"""Comprehensive Test Suite for PaySim Supervised Behavioural Fraud Model Service.

Validates:
1. Successful model loading and singleton lifecycle.
2. Valid TRANSFER prediction (including typical PaySim account-clearing fraud).
3. Valid CASH_OUT prediction.
4. Zero sender balance edge-case handling.
5. Invalid or unsupported transaction type handling.
6. Missing transaction fields (e.g. missing sender balance).
7. Invalid amount or negative balance rejection.
8. Missing model artifact graceful fallback (model_available=False without crash).
9. Model prediction failure handling.
10. Existing behavioural engine continues operating normally when PaySim model is disabled/unavailable.
11. Unified risk assessment consumes PaySim signals through existing pipeline.
12. Payment protection end-to-end integration preserves existing behavior.
"""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.schemas.behavioural import (
    BehaviouralAnalysisRequest,
    CurrentTransaction,
    HistoricalTransaction,
)
from app.schemas.correlation import SimulatedTransaction
from app.schemas.payment_protection import PaymentProtectionRequest
from app.services.payment_protection_orchestrator import orchestrate_payment_protection
from app.services.paysim_behavior_service import (
    EXPECTED_FEATURES,
    PaySimModelManager,
    PaySimPredictionResult,
    predict_paysim_fraud,
    transform_paysim_features,
)

client = TestClient(app)
BASE_TIME = datetime(2026, 11, 25, 12, 0, tzinfo=timezone.utc)


def test_01_successful_model_loading():
    """Verify that the model manager loads the artifact and feature metadata properly."""
    manager = PaySimModelManager.get_instance()
    assert manager.is_loaded is True
    assert manager.model is not None
    assert manager.features == EXPECTED_FEATURES
    assert manager.threshold == 0.5
    assert manager.dataset == "PaySim"
    assert manager.load_error is None


def test_02_valid_transfer_prediction():
    """Verify inference for a TRANSFER transaction with complete account drainage."""
    # Classic PaySim fraud pattern: transfer draining entire account balance
    result: PaySimPredictionResult = predict_paysim_fraud(
        amount=10000.0,
        sender_balance=10000.0,
        transaction_type="TRANSFER",
    )
    assert result.model_available is True
    assert result.error_message is None
    assert result.fraud_probability is not None
    assert result.fraud_probability > 0.80
    assert result.is_fraud_predicted is True
    assert result.threshold == 0.5
    assert result.feature_vector is not None
    assert result.feature_vector["type_TRANSFER"] == 1.0
    assert result.feature_vector["amount_equals_balance"] == 1.0


def test_03_valid_cash_out_prediction():
    """Verify inference for CASH_OUT transaction."""
    result: PaySimPredictionResult = predict_paysim_fraud(
        amount=5000.0,
        sender_balance=5000.0,
        transaction_type="CASH_OUT",
    )
    assert result.model_available is True
    assert result.error_message is None
    assert result.fraud_probability is not None
    assert result.feature_vector is not None
    assert result.feature_vector["type_CASH_OUT"] == 1.0


def test_04_zero_sender_balance():
    """Verify that zero sender balance is handled safely without division by zero."""
    result: PaySimPredictionResult = predict_paysim_fraud(
        amount=500.0,
        sender_balance=0.0,
        transaction_type="PAYMENT",
    )
    assert result.model_available is True
    assert result.error_message is None
    assert result.fraud_probability is not None
    assert result.feature_vector is not None
    assert result.feature_vector["sender_balance_zero"] == 1.0
    # Ratio is amount / max(0, 1) clipped to 10.0
    assert result.feature_vector["amount_to_balance_ratio"] == 10.0


def test_05_invalid_or_unsupported_transaction_type():
    """Verify that completely unsupported transaction types return a clean error without crashing."""
    result: PaySimPredictionResult = predict_paysim_fraud(
        amount=1000.0,
        sender_balance=5000.0,
        transaction_type="CRYPTO_SWAP_UNSUPPORTED",
    )
    assert result.model_available is True
    assert result.fraud_probability is None
    assert result.error_message is not None
    assert "Unsupported transaction type" in result.error_message


def test_06_missing_sender_balance():
    """Verify that missing sender_balance is handled gracefully without fabricating balances."""
    result: PaySimPredictionResult = predict_paysim_fraud(
        amount=1000.0,
        sender_balance=None,
        transaction_type="TRANSFER",
    )
    assert result.model_available is True
    assert result.fraud_probability is None
    assert result.error_message is not None
    assert "Sender pre-transaction balance is required" in result.error_message


def test_07_invalid_amount_or_negative_balance():
    """Verify that zero/negative amounts or negative sender balances are rejected."""
    # Negative amount
    res_neg_amt = predict_paysim_fraud(amount=-50.0, sender_balance=100.0)
    assert res_neg_amt.fraud_probability is None
    assert "Invalid transaction amount" in (res_neg_amt.error_message or "")

    # Zero amount
    res_zero_amt = predict_paysim_fraud(amount=0.0, sender_balance=100.0)
    assert res_zero_amt.fraud_probability is None
    assert "Invalid transaction amount" in (res_zero_amt.error_message or "")

    # Negative sender balance
    res_neg_bal = predict_paysim_fraud(amount=100.0, sender_balance=-50.0)
    assert res_neg_bal.fraud_probability is None
    assert "Invalid sender balance" in (res_neg_bal.error_message or "")


def test_08_missing_model_artifact_fallback():
    """Verify behavior when model artifact is missing or disabled."""
    PaySimModelManager.reset_instance()
    with patch("app.services.paysim_behavior_service.settings.PAYSIM_MODEL_PATH", "backend/models/non_existent.joblib"):
        res = predict_paysim_fraud(amount=1000.0, sender_balance=5000.0, transaction_type="TRANSFER")
        assert res.model_available is False
        assert "not found" in (res.error_message or "")
    PaySimModelManager.reset_instance()


def test_09_model_prediction_exception_handling():
    """Verify that unexpected inference errors are caught and logged without raising exceptions."""
    manager = PaySimModelManager.get_instance()
    with patch.object(manager.model, "predict_proba", side_effect=RuntimeError("Engine compute crash")):
        res = predict_paysim_fraud(amount=1000.0, sender_balance=5000.0, transaction_type="TRANSFER")
        assert res.model_available is True
        assert res.fraud_probability is None
        assert "Model prediction failed" in (res.error_message or "")


def test_10_behavioural_engine_runs_when_paysim_disabled():
    """Verify that the existing behavioural scoring engine functions normally when PaySim is disabled."""
    PaySimModelManager.reset_instance()
    with patch("app.services.paysim_behavior_service.settings.PAYSIM_MODEL_ENABLED", False):
        req = BehaviouralAnalysisRequest(
            customer_id="CUST-PAYSIM-TEST",
            current_transaction=CurrentTransaction(
                transaction_id="TX-PAYSIM-01",
                customer_id="CUST-PAYSIM-TEST",
                amount=Decimal("1500.00"),
                currency="INR",
                beneficiary_id="merchant@upi",
                payment_method="UPI",
                sender_balance=Decimal("5000.00"),
                transaction_timestamp=BASE_TIME,
            ),
            historical_transactions=[
                HistoricalTransaction(
                    transaction_id="TX-HIST-01",
                    customer_id="CUST-PAYSIM-TEST",
                    amount=Decimal("1400.00"),
                    currency="INR",
                    beneficiary_id="merchant@upi",
                    payment_method="UPI",
                    transaction_timestamp=BASE_TIME,
                ),
                HistoricalTransaction(
                    transaction_id="TX-HIST-02",
                    customer_id="CUST-PAYSIM-TEST",
                    amount=Decimal("1600.00"),
                    currency="INR",
                    beneficiary_id="merchant@upi",
                    payment_method="UPI",
                    transaction_timestamp=BASE_TIME,
                ),
                HistoricalTransaction(
                    transaction_id="TX-HIST-03",
                    customer_id="CUST-PAYSIM-TEST",
                    amount=Decimal("1500.00"),
                    currency="INR",
                    beneficiary_id="merchant@upi",
                    payment_method="UPI",
                    transaction_timestamp=BASE_TIME,
                ),
            ],
        )
        res = client.post("/api/v1/behavioural/analyze", json=req.model_dump(mode="json"))
        assert res.status_code == 200
        data = res.json()
        assert data["risk_level"] == "LOW"
        assert data["paysim_prediction"] is not None
        assert data["paysim_prediction"]["model_available"] is False
    PaySimModelManager.reset_instance()


def test_11_behavioural_endpoint_returns_paysim_signal():
    """Verify that POST /api/v1/behavioural/analyze returns PaySim prediction when available."""
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-PAYSIM-LIVE",
        current_transaction=CurrentTransaction(
            transaction_id="TX-PAYSIM-LIVE-01",
            customer_id="CUST-PAYSIM-LIVE",
            amount=Decimal("10000.00"),
            currency="INR",
            beneficiary_id="unknown_mule@upi",
            payment_method="TRANSFER",
            sender_balance=Decimal("10000.00"),
            transaction_timestamp=BASE_TIME,
        ),
        historical_transactions=[
            HistoricalTransaction(
                transaction_id=f"TX-HIST-{i}",
                customer_id="CUST-PAYSIM-LIVE",
                amount=Decimal("500.00"),
                currency="INR",
                beneficiary_id="regular@upi",
                payment_method="UPI",
                transaction_timestamp=BASE_TIME,
            )
            for i in range(10)
        ],
    )
    res = client.post("/api/v1/behavioural/analyze", json=req.model_dump(mode="json"))
    assert res.status_code == 200
    data = res.json()
    assert data["paysim_prediction"] is not None
    assert data["paysim_prediction"]["model_available"] is True
    assert data["paysim_prediction"]["fraud_probability"] is not None
    assert data["paysim_prediction"]["fraud_probability"] > 0.8
    assert "PAYSIM_SUPERVISED_FRAUD_PREDICTED" in data["detected_indicators"]


def test_12_payment_protection_orchestrator_incorporates_paysim():
    """Verify that payment protection orchestration passes sender_balance to PaySim model."""
    req = PaymentProtectionRequest(
        customer_consent=True,
        communication_text="Transfer 10000 to fraud@upi immediately",
        simulated_transaction=SimulatedTransaction(
            amount=10000.0,
            currency="INR",
            recipient_id="fraud@upi",
            transaction_reference="TX-ORCH-PAYSIM",
        ),
        customer_id="CUST-ORCH",
        sender_balance=Decimal("10000.00"),
        payment_method="TRANSFER",
        historical_transactions=[
            HistoricalTransaction(
                transaction_id=f"TX-HIST-{i}",
                customer_id="CUST-ORCH",
                amount=Decimal("1000.00"),
                currency="INR",
                beneficiary_id="store@upi",
                payment_method="UPI",
                transaction_timestamp=BASE_TIME,
            )
            for i in range(5)
        ],
        as_of=BASE_TIME,
    )

    resp = orchestrate_payment_protection(req)
    assert resp.behavioural_assessment is not None
    assert resp.behavioural_assessment.paysim_prediction is not None
    assert resp.behavioural_assessment.paysim_prediction["model_available"] is True
    assert resp.behavioural_assessment.paysim_prediction["is_fraud_predicted"] is True

    # Unified risk assessment includes the PaySim statistical evidence
    paysim_evidence = [
        e for e in resp.unified_risk_assessment.supporting_evidence
        if e.source_reference == "PAYSIM_HIST_GRADIENT_BOOSTING"
    ]
    assert len(paysim_evidence) >= 1
    assert "fraud probability" in paysim_evidence[0].description
