"""PaySim Supervised Behavioural Fraud Prediction Service.

Loads and executes the pre-trained HistGradientBoostingClassifier on PaySim
pre-transaction behavioral features (amount, sender balance, transaction type).

This service complements the unsupervised Isolation Forest and deterministic
heuristics without replacing them.
"""

from decimal import Decimal
import logging
from math import log1p
from pathlib import Path
import threading
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("payguard.paysim_behavior_service")

# Exact feature names and order expected by the trained model
EXPECTED_FEATURES: List[str] = [
    "log_amount",
    "log_sender_balance",
    "amount_to_balance_ratio",
    "sender_balance_zero",
    "amount_equals_balance",
    "amount_exceeds_balance",
    "type_CASH_IN",
    "type_CASH_OUT",
    "type_DEBIT",
    "type_PAYMENT",
    "type_TRANSFER",
]

SUPPORTED_TRANSACTION_TYPES: List[str] = [
    "CASH_IN",
    "CASH_OUT",
    "DEBIT",
    "PAYMENT",
    "TRANSFER",
]


class PaySimPredictionResult(BaseModel):
    """Structured output from the PaySim supervised behavioral fraud model."""

    model_available: bool = Field(
        ...,
        description="Whether the PaySim supervised model artifact was loaded and executed",
    )
    fraud_probability: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Estimated fraud probability from the supervised model (0.0 to 1.0)",
    )
    is_fraud_predicted: Optional[bool] = Field(
        default=None,
        description="Binary fraud classification at the configured decision threshold",
    )
    threshold: Optional[float] = Field(
        default=None,
        description="Decision threshold used for binary classification",
    )
    model_name: str = Field(
        default="PaySim HistGradientBoostingClassifier (Supervised Baseline)",
        description="Canonical identifier of the model",
    )
    feature_vector: Optional[Dict[str, float]] = Field(
        default=None,
        description="Transformed inference features used as model inputs",
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Error details if the model was unavailable or inference failed",
    )


class PaySimModelManager:
    """Singleton manager that caches and validates the PaySim model artifact."""

    _instance: Optional["PaySimModelManager"] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self.model: Optional[Any] = None
        self.features: List[str] = []
        self.threshold: float = 0.5
        self.dataset: str = "PaySim"
        self.training_cutoff_step: Optional[int] = None
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self._load_artifact()

    @classmethod
    def get_instance(cls) -> "PaySimModelManager":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton instance (useful for unit testing error paths)."""
        with cls._lock:
            cls._instance = None

    def _resolve_artifact_path(self) -> Path:
        """Resolve the model artifact path relative to the backend/project directory."""
        configured_path = Path(settings.PAYSIM_MODEL_PATH)
        if configured_path.is_absolute():
            return configured_path

        # Look in workspace root and backend root
        # File is in backend/app/services/ -> parent=services, parent.parent=app, parent.parent.parent=backend
        backend_dir = Path(__file__).resolve().parent.parent.parent
        project_dir = backend_dir.parent

        candidate_paths = [
            project_dir / configured_path,
            backend_dir / configured_path.name,
            backend_dir / "models" / configured_path.name,
            configured_path,
        ]

        for p in candidate_paths:
            if p.is_file():
                return p

        # Fallback to backend_dir / models / paysim_behavior_model.joblib
        return backend_dir / "models" / configured_path.name

    def _load_artifact(self) -> None:
        if not settings.PAYSIM_MODEL_ENABLED:
            self.is_loaded = False
            self.load_error = "PaySim model is disabled via configuration (PAYSIM_MODEL_ENABLED=False)"
            logger.info("PaySim model is disabled by configuration.")
            return

        artifact_path = self._resolve_artifact_path()
        if not artifact_path.is_file():
            self.is_loaded = False
            self.load_error = f"PaySim model artifact not found at {artifact_path}"
            logger.warning("PaySim model artifact not found at %s. Supervised signal will be unavailable.", artifact_path)
            return

        try:
            artifact = joblib.load(artifact_path)
            if not isinstance(artifact, dict) or "model" not in artifact:
                raise ValueError("Artifact is missing required dictionary key 'model'")

            model = artifact["model"]
            features = artifact.get("features", EXPECTED_FEATURES)
            threshold = float(artifact.get("threshold", settings.PAYSIM_MODEL_THRESHOLD))

            if features != EXPECTED_FEATURES:
                raise ValueError(
                    f"Artifact features {features} do not match expected features {EXPECTED_FEATURES}"
                )

            self.model = model
            self.features = features
            self.threshold = threshold
            self.dataset = str(artifact.get("dataset", "PaySim"))
            self.training_cutoff_step = artifact.get("training_cutoff_step")
            self.is_loaded = True
            self.load_error = None
            logger.info(
                "PaySim supervised model loaded successfully from %s (features=%d, threshold=%.2f)",
                artifact_path,
                len(self.features),
                self.threshold,
            )
        except Exception as exc:
            self.is_loaded = False
            self.load_error = f"Failed to load PaySim artifact: {exc}"
            logger.error("Failed to load PaySim model artifact: %s", exc)


def transform_paysim_features(
    amount: float,
    sender_balance: float,
    transaction_type: str,
) -> Tuple[np.ndarray, Dict[str, float]]:
    """Transform raw transaction inputs into the exact PaySim feature vector.

    Feature definitions:
    - log_amount = log1p(amount)
    - log_sender_balance = log1p(sender_balance)
    - amount_to_balance_ratio = amount / max(sender_balance, 1), clipped to [0, 10]
    - sender_balance_zero = 1.0 if sender_balance == 0 else 0.0
    - amount_equals_balance = 1.0 if abs(amount - sender_balance) <= 0.01 else 0.0
    - amount_exceeds_balance = 1.0 if amount > sender_balance + 0.01 else 0.0
    - One-hot encoded transaction types: CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER
    """
    clean_type = transaction_type.strip().upper()

    log_amount = float(log1p(max(0.0, amount)))
    log_sender_balance = float(log1p(max(0.0, sender_balance)))

    safe_balance_denom = max(sender_balance, 1.0)
    raw_ratio = amount / safe_balance_denom
    amount_to_balance_ratio = float(min(max(raw_ratio, 0.0), 10.0))

    sender_balance_zero = 1.0 if sender_balance <= 0.000001 else 0.0
    amount_equals_balance = 1.0 if abs(amount - sender_balance) <= 0.01 else 0.0
    amount_exceeds_balance = 1.0 if amount > (sender_balance + 0.01) else 0.0

    type_cash_in = 1.0 if clean_type == "CASH_IN" else 0.0
    type_cash_out = 1.0 if clean_type == "CASH_OUT" else 0.0
    type_debit = 1.0 if clean_type == "DEBIT" else 0.0
    type_payment = 1.0 if clean_type == "PAYMENT" else 0.0
    type_transfer = 1.0 if clean_type == "TRANSFER" else 0.0

    feature_dict: Dict[str, float] = {
        "log_amount": log_amount,
        "log_sender_balance": log_sender_balance,
        "amount_to_balance_ratio": amount_to_balance_ratio,
        "sender_balance_zero": sender_balance_zero,
        "amount_equals_balance": amount_equals_balance,
        "amount_exceeds_balance": amount_exceeds_balance,
        "type_CASH_IN": type_cash_in,
        "type_CASH_OUT": type_cash_out,
        "type_DEBIT": type_debit,
        "type_PAYMENT": type_payment,
        "type_TRANSFER": type_transfer,
    }

    feature_df = pd.DataFrame([feature_dict])[EXPECTED_FEATURES]
    return feature_df, feature_dict


def predict_paysim_fraud(
    amount: float,
    sender_balance: Optional[float] = None,
    transaction_type: Optional[str] = None,
) -> PaySimPredictionResult:
    """Predict fraud probability using the supervised PaySim behavioral model.

    Validation & Safety rules:
    - If sender_balance is None, model is not evaluated (pre-transaction balance required).
    - If amount is <= 0 or sender_balance < 0, prediction is rejected.
    - If transaction_type is unknown or missing, maps or defaults safely to TRANSFER/PAYMENT or handles safely.
    - If model artifact is unavailable, returns model_available=False without crashing.
    """
    manager = PaySimModelManager.get_instance()
    if not manager.is_loaded or manager.model is None:
        return PaySimPredictionResult(
            model_available=False,
            error_message=manager.load_error or "PaySim model is not available",
        )

    # Validate amount
    if amount is None or amount <= 0.0:
        return PaySimPredictionResult(
            model_available=True,
            error_message=f"Invalid transaction amount: {amount}. Must be strictly positive.",
        )

    # Validate sender balance
    if sender_balance is None:
        return PaySimPredictionResult(
            model_available=True,
            error_message="Sender pre-transaction balance is required for PaySim model inference.",
        )

    if sender_balance < 0.0:
        return PaySimPredictionResult(
            model_available=True,
            error_message=f"Invalid sender balance: {sender_balance}. Balance cannot be negative.",
        )

    # Validate transaction type
    norm_type = (transaction_type or "TRANSFER").strip().upper()
    # Map common UPI/payment rails if needed
    if norm_type in ("UPI", "IMPS", "NEFT", "RTGS", "P2P"):
        norm_type = "TRANSFER"
    elif norm_type in ("CARD", "POS", "QR_MERCHANT", "P2M"):
        norm_type = "PAYMENT"

    if norm_type not in SUPPORTED_TRANSACTION_TYPES:
        return PaySimPredictionResult(
            model_available=True,
            error_message=(
                f"Unsupported transaction type '{transaction_type}'. "
                f"Must be one of {SUPPORTED_TRANSACTION_TYPES} or a known rail (UPI, CARD, etc.)."
            ),
        )

    try:
        X, feature_dict = transform_paysim_features(
            amount=amount,
            sender_balance=sender_balance,
            transaction_type=norm_type,
        )

        probabilities = manager.model.predict_proba(X)
        fraud_prob = float(probabilities[0, 1])
        is_fraud = fraud_prob >= manager.threshold

        return PaySimPredictionResult(
            model_available=True,
            fraud_probability=round(fraud_prob, 6),
            is_fraud_predicted=is_fraud,
            threshold=manager.threshold,
            feature_vector=feature_dict,
            error_message=None,
        )
    except Exception as exc:
        logger.error("PaySim model prediction failure: %s", exc)
        return PaySimPredictionResult(
            model_available=True,
            error_message=f"Model prediction failed: {exc}",
        )
