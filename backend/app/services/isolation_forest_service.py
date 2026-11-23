"""Isolation Forest Anomaly Detection Service for Behavioural Risk Experiments (Phase 2.2.4).

Evaluates unsupervised tree-based anomaly isolation alongside the deterministic
behavioural scoring engine without replacing it.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest

from app.schemas.behavioural import (
    BeneficiaryNoveltyStatus,
    BehaviouralAnalysisRequest,
    BehaviouralFeatureSet,
    BehaviouralRiskLevel,
    DataSufficiencyLevel,
    PaymentMethodNoveltyStatus,
)
from app.schemas.ml_experiment import (
    IsolationForestScore,
    MetricComparison,
    ModelBenchmarkReport,
    ModelPredictionLabel,
)
from app.services.behavioural_feature_extractor import extract_behavioural_features
from app.services.behavioural_risk_scorer import score_behavioural_risk
from app.services.synthetic_dataset_generator import SyntheticEvaluationCase

# Deterministic feature ordering (9 dimensions)
FEATURE_NAMES: List[str] = [
    "amount_ratio_to_median",
    "amount_robust_z",
    "is_new_beneficiary",
    "beneficiary_historical_share",
    "tx_count_24h",
    "velocity_ratio_24h",
    "is_new_payment_method",
    "circular_time_distance_hours",
    "data_sufficiency_code",
]


def extract_feature_vector(features: BehaviouralFeatureSet) -> List[float]:
    """Convert an extracted BehaviouralFeatureSet into a deterministic 9-dimensional numeric vector.

    Dimensions:
    0: amount_ratio_to_median (1.0 if missing/insufficient)
    1: amount_robust_z (z-score if present; if zero MAD, linear ratio scaling; else 0.0)
    2: is_new_beneficiary (1.0 for NEW, 0.0 for KNOWN, 0.5 for INSUFFICIENT)
    3: beneficiary_historical_share (0.0 to 100.0)
    4: tx_count_24h (raw count in last 24 hours)
    5: velocity_ratio_24h (ratio to daily baseline, 1.0 if baseline missing)
    6: is_new_payment_method (1.0 for NEW, 0.0 for KNOWN, 0.5 for INSUFFICIENT)
    7: circular_time_distance_hours (min circular distance in hours, 0.0 to 12.0)
    8: data_sufficiency_code (1.0 for SUFFICIENT, 0.5 for MINIMAL, 0.0 for INSUFFICIENT)
    """
    amt = features.amount_deviation
    ben = features.beneficiary_feature
    vel = features.velocity_feature
    pm = features.payment_method_feature
    time_dev = features.time_deviation

    # 0. Amount ratio to median
    if amt.ratio_to_median is not None:
        v_amount_ratio = float(amt.ratio_to_median)
    else:
        v_amount_ratio = 1.0

    # 1. Amount robust z-score (or zero-MAD fallback)
    if amt.robust_z_score is not None:
        v_amount_z = float(amt.robust_z_score)
    elif amt.is_zero_mad and amt.ratio_to_median is not None:
        v_amount_z = float((amt.ratio_to_median - Decimal("1.0")) * Decimal("2.0"))
    else:
        v_amount_z = 0.0

    # 2. Beneficiary novelty
    if ben.status == BeneficiaryNoveltyStatus.NEW:
        v_new_beneficiary = 1.0
    elif ben.status == BeneficiaryNoveltyStatus.KNOWN:
        v_new_beneficiary = 0.0
    else:
        v_new_beneficiary = 0.5

    # 3. Beneficiary historical share
    if ben.historical_share_percentage is not None:
        v_ben_share = float(ben.historical_share_percentage)
    else:
        v_ben_share = 0.0

    # 4. 24h transaction count
    v_tx_count_24h = float(vel.tx_count_24h)

    # 5. 24h velocity ratio
    if vel.velocity_ratio_24h is not None:
        v_velocity_ratio = float(vel.velocity_ratio_24h)
    else:
        v_velocity_ratio = 1.0

    # 6. Payment method novelty
    if pm.status == PaymentMethodNoveltyStatus.NEW:
        v_new_pm = 1.0
    elif pm.status == PaymentMethodNoveltyStatus.KNOWN:
        v_new_pm = 0.0
    else:
        v_new_pm = 0.5

    # 7. Circular time distance in hours
    if time_dev.min_circular_distance_minutes is not None:
        v_time_dist_hours = float(time_dev.min_circular_distance_minutes) / 60.0
    else:
        v_time_dist_hours = 0.0

    # 8. Data sufficiency code
    if features.data_sufficiency == DataSufficiencyLevel.SUFFICIENT:
        v_sufficiency = 1.0
    elif features.data_sufficiency == DataSufficiencyLevel.MINIMAL:
        v_sufficiency = 0.5
    else:
        v_sufficiency = 0.0

    return [
        round(v_amount_ratio, 4),
        round(v_amount_z, 4),
        round(v_new_beneficiary, 2),
        round(v_ben_share, 4),
        round(v_tx_count_24h, 2),
        round(v_velocity_ratio, 4),
        round(v_new_pm, 2),
        round(v_time_dist_hours, 4),
        round(v_sufficiency, 2),
    ]


def train_isolation_forest_model(
    training_requests: List[BehaviouralAnalysisRequest],
    n_estimators: int = 100,
    contamination: float = 0.05,
    random_state: int = 42,
) -> Tuple[IsolationForest, Dict[str, Any]]:
    """Train an IsolationForest model on extracted feature vectors from baseline normal transactions.

    Args:
        training_requests: Clean normal customer transaction requests.
        n_estimators: Number of isolation trees (default: 100).
        contamination: Expected proportion of outliers in the training data (default: 0.05).
        random_state: Deterministic random seed for reproducibility.

    Returns:
        Tuple of (fitted IsolationForest instance, training_metadata dictionary).
    """
    feature_vectors: List[List[float]] = []

    for req in training_requests:
        feat_set = extract_behavioural_features(req)
        vec = extract_feature_vector(feat_set)
        feature_vectors.append(vec)

    X_train = np.array(feature_vectors, dtype=np.float64)

    model = IsolationForest(
        n_estimators=n_estimators,
        max_samples="auto",
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X_train)

    # Compute training decision function distribution metrics
    train_decision_scores = model.decision_function(X_train)
    min_score = float(np.min(train_decision_scores))
    median_score = float(np.median(train_decision_scores))
    max_score = float(np.max(train_decision_scores))

    training_meta = {
        "n_samples": len(training_requests),
        "n_estimators": n_estimators,
        "contamination": contamination,
        "random_state": random_state,
        "min_decision_score": min_score,
        "median_decision_score": median_score,
        "max_decision_score": max_score,
        "model_version": f"iforest-v1.0-e{n_estimators}-c{contamination}",
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
    }

    return model, training_meta


def score_with_isolation_forest(
    features: BehaviouralFeatureSet,
    model: IsolationForest,
    training_meta: Dict[str, Any],
) -> IsolationForestScore:
    """Score a transaction's behavioural features using the trained Isolation Forest model.

    Gating:
    - If data sufficiency is INSUFFICIENT (< 3 transactions), returns INLIER (1) with 0.0 severity
      and an explanatory note, preventing false outlier flags on cold-start profiles.
    """
    notes: List[str] = []
    vector = extract_feature_vector(features)

    # Guardrail: Insufficient baseline history
    if features.data_sufficiency == DataSufficiencyLevel.INSUFFICIENT:
        notes.append(
            "Insufficient historical baseline (< 3 comparable transactions). "
            "Isolation Forest cannot reliably isolate anomalies without baseline context; defaulting to inlier."
        )
        return IsolationForestScore(
            raw_score_samples=0.0,
            decision_function=0.0,
            prediction=ModelPredictionLabel.NORMAL,
            normalized_anomaly_severity=0.0,
            model_version=training_meta.get("model_version", "iforest-v1.0"),
            training_sample_count=training_meta.get("n_samples", 0),
            feature_vector_used=vector,
            assessment_notes=notes,
        )

    X = np.array([vector], dtype=np.float64)
    raw_score = float(model.score_samples(X)[0])
    decision = float(model.decision_function(X)[0])
    pred_val = int(model.predict(X)[0])

    prediction_label = (
        ModelPredictionLabel.ANOMALY if pred_val == -1 else ModelPredictionLabel.NORMAL
    )

    # Calibrated non-probabilistic severity scaling in [0.0, 1.0]
    min_train = training_meta.get("min_decision_score", -0.3)
    med_train = training_meta.get("median_decision_score", 0.15)

    if decision < 0.0:
        # Outlier region: scale severity from 0.5 up to 1.0 based on distance from zero
        denominator = abs(min_train) if abs(min_train) > 1e-4 else 0.3
        severity = 0.5 + 0.5 * min(1.0, abs(decision) / denominator)
        notes.append(
            f"Isolation Forest classified transaction as ANOMALY (decision_function: {decision:+.4f} < 0.0)."
        )
    else:
        # Inlier region: scale severity from 0.5 down toward 0.0 based on distance above zero
        denominator = med_train if med_train > 1e-4 else 0.15
        severity = max(0.0, 0.5 * (1.0 - min(1.0, decision / denominator)))
        notes.append(
            f"Isolation Forest classified transaction as NORMAL (decision_function: {decision:+.4f} >= 0.0)."
        )

    notes.append(
        "Unsupervised tree isolation score. Reflects topological distance in feature space, "
        "NOT a calibrated fraud probability."
    )

    return IsolationForestScore(
        raw_score_samples=round(raw_score, 4),
        decision_function=round(decision, 4),
        prediction=prediction_label,
        normalized_anomaly_severity=round(float(severity), 4),
        model_version=training_meta.get("model_version", "iforest-v1.0"),
        training_sample_count=training_meta.get("n_samples", 0),
        feature_vector_used=vector,
        assessment_notes=notes,
    )


def _compute_metrics(tp: int, fp: int, tn: int, fn: int) -> MetricComparison:
    """Compute standard classification evaluation metrics safely."""
    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    return MetricComparison(
        true_positives=tp,
        false_positives=fp,
        true_negatives=tn,
        false_negatives=fn,
        precision=round(precision, 4),
        recall=round(recall, 4),
        f1_score=round(f1, 4),
        false_positive_rate=round(fpr, 4),
        accuracy=round(accuracy, 4),
    )


def run_benchmark_evaluation(
    eval_cases: List[SyntheticEvaluationCase],
    model: IsolationForest,
    training_meta: Dict[str, Any],
) -> ModelBenchmarkReport:
    """Benchmark Deterministic Behavioural Scorer vs Isolation Forest on identical held-out scenarios.

    Anomaly Decision Rules:
    - Deterministic Scorer: Flagged as anomaly if risk_level is HIGH (composite score >= 0.65).
    - Isolation Forest: Flagged as anomaly if prediction == ModelPredictionLabel.ANOMALY (-1).
    """
    # Deterministic confusion counts
    det_tp, det_fp, det_tn, det_fn = 0, 0, 0, 0
    # Isolation Forest confusion counts
    if_tp, if_fp, if_tn, if_fn = 0, 0, 0, 0

    archetype_stats: Dict[str, Dict[str, Any]] = {}

    for case in eval_cases:
        feat_set = extract_behavioural_features(case.request)

        # 1. Deterministic evaluation
        det_result = score_behavioural_risk(feat_set)
        det_is_anomaly = det_result.risk_level == BehaviouralRiskLevel.HIGH

        # 2. Isolation Forest evaluation
        if_result = score_with_isolation_forest(feat_set, model, training_meta)
        if_is_anomaly = if_result.prediction == ModelPredictionLabel.ANOMALY

        ground_truth = case.is_anomaly

        # Update Deterministic metrics
        if ground_truth and det_is_anomaly:
            det_tp += 1
        elif not ground_truth and det_is_anomaly:
            det_fp += 1
        elif not ground_truth and not det_is_anomaly:
            det_tn += 1
        else:
            det_fn += 1

        # Update Isolation Forest metrics
        if ground_truth and if_is_anomaly:
            if_tp += 1
        elif not ground_truth and if_is_anomaly:
            if_fp += 1
        elif not ground_truth and not if_is_anomaly:
            if_tn += 1
        else:
            if_fn += 1

        # Scenario breakdown tracking
        arch = case.archetype
        if arch not in archetype_stats:
            archetype_stats[arch] = {
                "total": 0,
                "ground_truth_anomalies": 0,
                "deterministic_detected": 0,
                "isolation_forest_detected": 0,
            }
        archetype_stats[arch]["total"] += 1
        if ground_truth:
            archetype_stats[arch]["ground_truth_anomalies"] += 1
        if det_is_anomaly:
            archetype_stats[arch]["deterministic_detected"] += 1
        if if_is_anomaly:
            archetype_stats[arch]["isolation_forest_detected"] += 1

    # Format scenario breakdown
    breakdown: Dict[str, Dict[str, Any]] = {}
    for arch, stats in archetype_stats.items():
        gt_anom = stats["ground_truth_anomalies"]
        total = stats["total"]
        det_det = stats["deterministic_detected"]
        if_det = stats["isolation_forest_detected"]

        det_rate = (det_det / gt_anom) if gt_anom > 0 else (det_det / total)
        if_rate = (if_det / gt_anom) if gt_anom > 0 else (if_det / total)

        breakdown[arch] = {
            "total_cases": total,
            "ground_truth_anomalies": gt_anom,
            "deterministic_flagged": det_det,
            "isolation_forest_flagged": if_det,
            "deterministic_rate": round(det_rate, 4),
            "isolation_forest_rate": round(if_rate, 4),
        }

    det_metrics = _compute_metrics(det_tp, det_fp, det_tn, det_fn)
    if_metrics = _compute_metrics(if_tp, if_fp, if_tn, if_fn)

    normal_count = sum(1 for c in eval_cases if not c.is_anomaly)
    anom_count = sum(1 for c in eval_cases if c.is_anomaly)

    notes = [
        "Benchmark conducted on synthetic held-out evaluation scenarios (random_seed=101).",
        "Deterministic model flags anomalies at risk_level == HIGH (score >= 0.65).",
        "Isolation Forest flags anomalies at decision_function < 0.0 (prediction == -1).",
        "Zero real-world or production banking data was utilized in this benchmark.",
    ]

    return ModelBenchmarkReport(
        dataset_name="Synthetic-Behavioural-Evaluation-V1",
        evaluation_sample_count=len(eval_cases),
        normal_sample_count=normal_count,
        anomalous_sample_count=anom_count,
        deterministic_metrics=det_metrics,
        isolation_forest_metrics=if_metrics,
        scenario_breakdown=breakdown,
        experiment_timestamp=datetime.now(timezone.utc),
        methodology_notes=notes,
    )
