"""Comprehensive test suite for Phase 2.2.4 Isolation Forest Anomaly Detection Experiment.

Validates:
1. Synthetic dataset generator reproducibility and distribution properties.
2. 9-dimensional numeric feature vector extraction from BehaviouralFeatureSet.
3. Isolation Forest model training and calibration metadata.
4. Anomaly detection inference, score direction, and data sufficiency guardrails.
5. Comparative benchmark execution between Deterministic Scorer and Isolation Forest.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import numpy as np
import pytest
from sklearn.ensemble import IsolationForest

from app.schemas.behavioural import (
    AmountDeviationFeature,
    BeneficiaryFeature,
    BeneficiaryNoveltyStatus,
    BehaviouralAnalysisRequest,
    BehaviouralFeatureSet,
    BehaviouralRiskLevel,
    CurrentTransaction,
    DataSufficiencyLevel,
    HistoricalTransaction,
    PaymentMethodFeature,
    PaymentMethodNoveltyStatus,
    TimeDeviationFeature,
    VelocityFeature,
)
from app.schemas.ml_experiment import (
    IsolationForestScore,
    MetricComparison,
    ModelBenchmarkReport,
    ModelPredictionLabel,
)
from app.services.behavioural_feature_extractor import extract_behavioural_features
from app.services.isolation_forest_service import (
    FEATURE_NAMES,
    extract_feature_vector,
    run_benchmark_evaluation,
    score_with_isolation_forest,
    train_isolation_forest_model,
)
from app.services.synthetic_dataset_generator import (
    PROFILES,
    SyntheticEvaluationCase,
    generate_evaluation_dataset,
    generate_normal_training_dataset,
)

BASE_TS = datetime(2026, 11, 22, 14, 0, 0, tzinfo=timezone.utc)


# =====================================================================
# FIXTURES
# =====================================================================


@pytest.fixture(scope="module")
def trained_iforest_model():
    """Module-scoped trained model fixture to accelerate test execution."""
    train_data = generate_normal_training_dataset(n_samples=150, random_seed=42)
    model, meta = train_isolation_forest_model(
        training_requests=train_data,
        n_estimators=50,
        contamination=0.05,
        random_state=42,
    )
    return model, meta


# =====================================================================
# 1. SYNTHETIC DATASET GENERATOR TESTS
# =====================================================================


def test_synthetic_training_dataset_generation():
    """Verify clean normal training dataset generation parameters."""
    dataset = generate_normal_training_dataset(n_samples=50, random_seed=42)
    assert len(dataset) == 50

    for req in dataset:
        assert isinstance(req, BehaviouralAnalysisRequest)
        assert len(req.historical_transactions) >= 8
        assert req.current_transaction.amount > Decimal("0.00")
        assert req.current_transaction.currency == "INR"
        # All historical transactions must be strictly in the past
        for ht in req.historical_transactions:
            assert ht.transaction_timestamp <= req.current_transaction.transaction_timestamp


def test_synthetic_training_dataset_reproducibility():
    """Same random seed produces identical dataset requests."""
    ds1 = generate_normal_training_dataset(n_samples=10, random_seed=99)
    ds2 = generate_normal_training_dataset(n_samples=10, random_seed=99)

    for r1, r2 in zip(ds1, ds2):
        assert r1.customer_id == r2.customer_id
        assert r1.current_transaction.amount == r2.current_transaction.amount
        assert len(r1.historical_transactions) == len(r2.historical_transactions)


def test_synthetic_evaluation_dataset_structure():
    """Verify evaluation dataset contains 200 normal and 80 anomalous cases across archetypes."""
    eval_cases = generate_evaluation_dataset(n_normal=200, n_anomalous=80, random_seed=101)
    assert len(eval_cases) == 280

    normal_cases = [c for c in eval_cases if not c.is_anomaly]
    anom_cases = [c for c in eval_cases if c.is_anomaly]
    assert len(normal_cases) == 200
    assert len(anom_cases) == 80

    archetypes = {c.archetype for c in eval_cases}
    assert "normal" in archetypes
    assert "extreme_amount" in archetypes
    assert "compound_mule" in archetypes
    assert "velocity_surge" in archetypes
    assert "unusual_time" in archetypes
    assert "new_payment_method" in archetypes


def test_synthetic_evaluation_data_leakage_prevention():
    """Training and evaluation datasets must use distinct customer IDs and seeds."""
    train_ds = generate_normal_training_dataset(n_samples=30, random_seed=42)
    eval_ds = generate_evaluation_dataset(n_normal=30, n_anomalous=10, random_seed=101)

    train_cust_ids = {r.customer_id for r in train_ds}
    eval_cust_ids = {c.request.customer_id for c in eval_ds}

    # Intersecting customer IDs must be completely disjoint
    assert len(train_cust_ids.intersection(eval_cust_ids)) == 0


# =====================================================================
# 2. FEATURE EXTRACTION & VECTORIZATION TESTS
# =====================================================================


def test_feature_vector_dimension_and_types():
    """extract_feature_vector must return a 9-dimensional list of floats."""
    req = generate_normal_training_dataset(n_samples=1, random_seed=42)[0]
    features = extract_behavioural_features(req)
    vector = extract_feature_vector(features)

    assert isinstance(vector, list)
    assert len(vector) == 9
    assert len(FEATURE_NAMES) == 9
    for val in vector:
        assert isinstance(val, (float, int))


def test_feature_vector_insufficient_history_defaults():
    """Feature vector must handle missing/null values with robust fallback defaults."""
    feat_set = BehaviouralFeatureSet(
        customer_id="CUST-COLD-001",
        data_sufficiency=DataSufficiencyLevel.INSUFFICIENT,
        total_historical_count=1,
        same_currency_count=1,
        amount_deviation=AmountDeviationFeature(
            current_amount=Decimal("1000.00"),
            currency="INR",
            comparable_count=1,
            historical_median=None,
            ratio_to_median=None,
            robust_z_score=None,
            is_zero_mad=False,
            calculation_notes="Single transaction",
        ),
        beneficiary_feature=BeneficiaryFeature(
            beneficiary_id="payee@upi",
            status=BeneficiaryNoveltyStatus.INSUFFICIENT_HISTORY,
            historical_transaction_count=0,
            historical_share_percentage=None,
            calculation_notes="Insufficient",
        ),
        velocity_feature=VelocityFeature(
            tx_count_1h=0,
            tx_volume_1h=Decimal("0.00"),
            tx_count_24h=1,
            tx_volume_24h=Decimal("1000.00"),
            tx_count_7d=1,
            tx_volume_7d=Decimal("1000.00"),
            historical_daily_avg_count=None,
            velocity_ratio_24h=None,
            calculation_notes="Insufficient",
        ),
        payment_method_feature=PaymentMethodFeature(
            payment_method="UPI",
            status=PaymentMethodNoveltyStatus.INSUFFICIENT_HISTORY,
            historical_usage_count=0,
            calculation_notes="Insufficient",
        ),
        time_deviation=TimeDeviationFeature(
            current_time_of_day_utc="14:00",
            sample_count=1,
            min_circular_distance_minutes=None,
            median_circular_distance_minutes=None,
            is_unusual_hour=None,
            calculation_notes="Insufficient",
        ),
        summary="Cold start customer profile",
    )

    vector = extract_feature_vector(feat_set)
    assert len(vector) == 9
    assert vector[0] == 1.0  # ratio default
    assert vector[1] == 0.0  # z-score default
    assert vector[2] == 0.5  # new beneficiary default for INSUFFICIENT
    assert vector[3] == 0.0  # share default
    assert vector[4] == 1.0  # tx_count_24h
    assert vector[5] == 1.0  # velocity ratio default
    assert vector[6] == 0.5  # new pm default for INSUFFICIENT
    assert vector[7] == 0.0  # time dist hours default
    assert vector[8] == 0.0  # data sufficiency code for INSUFFICIENT


def test_feature_vector_zero_mad_fallback():
    """Zero-MAD amounts must fall back to linear ratio-based z-score proxy."""
    feat_set = BehaviouralFeatureSet(
        customer_id="CUST-UNIFORM-001",
        data_sufficiency=DataSufficiencyLevel.SUFFICIENT,
        total_historical_count=10,
        same_currency_count=10,
        amount_deviation=AmountDeviationFeature(
            current_amount=Decimal("3000.00"),
            currency="INR",
            comparable_count=10,
            historical_median=Decimal("1000.00"),
            ratio_to_median=Decimal("3.0"),
            median_absolute_deviation=Decimal("0.00"),
            robust_z_score=None,
            is_zero_mad=True,
            calculation_notes="Uniform baseline",
        ),
        beneficiary_feature=BeneficiaryFeature(
            beneficiary_id="payee@upi",
            status=BeneficiaryNoveltyStatus.KNOWN,
            historical_transaction_count=10,
            historical_share_percentage=Decimal("100.00"),
            calculation_notes="Known",
        ),
        velocity_feature=VelocityFeature(
            tx_count_1h=0,
            tx_volume_1h=Decimal("0.00"),
            tx_count_24h=1,
            tx_volume_24h=Decimal("3000.00"),
            tx_count_7d=10,
            tx_volume_7d=Decimal("10000.00"),
            historical_daily_avg_count=Decimal("1.0"),
            velocity_ratio_24h=Decimal("1.0"),
            calculation_notes="Normal",
        ),
        payment_method_feature=PaymentMethodFeature(
            payment_method="UPI",
            status=PaymentMethodNoveltyStatus.KNOWN,
            historical_usage_count=10,
            calculation_notes="Known",
        ),
        time_deviation=TimeDeviationFeature(
            current_time_of_day_utc="14:00",
            sample_count=10,
            min_circular_distance_minutes=15,
            median_circular_distance_minutes=Decimal("30.0"),
            is_unusual_hour=False,
            calculation_notes="Normal",
        ),
        summary="Uniform amount profile",
    )

    vector = extract_feature_vector(feat_set)
    # Dimension 1: (3.0 - 1.0) * 2.0 = 4.0
    assert vector[1] == 4.0
    assert vector[2] == 0.0  # KNOWN beneficiary
    assert vector[6] == 0.0  # KNOWN payment method
    assert vector[8] == 1.0  # SUFFICIENT data


# =====================================================================
# 3. ISOLATION FOREST MODEL TRAINING TESTS
# =====================================================================


def test_train_isolation_forest_model_execution():
    """Verify training executes cleanly and returns fitted estimator with metadata."""
    train_requests = generate_normal_training_dataset(n_samples=40, random_seed=42)
    model, meta = train_isolation_forest_model(
        training_requests=train_requests,
        n_estimators=30,
        contamination=0.05,
        random_state=42,
    )

    assert isinstance(model, IsolationForest)
    assert meta["n_samples"] == 40
    assert meta["n_estimators"] == 30
    assert meta["contamination"] == 0.05
    assert meta["min_decision_score"] <= meta["median_decision_score"]
    assert meta["median_decision_score"] <= meta["max_decision_score"]


# =====================================================================
# 4. SCORING & ANOMALY DETECTION TESTS
# =====================================================================


def test_score_with_insufficient_data_guardrail(trained_iforest_model):
    """Cold-start insufficient history must return inlier (1) with 0.0 severity and note."""
    model, meta = trained_iforest_model

    cold_features = BehaviouralFeatureSet(
        customer_id="CUST-NEW-001",
        data_sufficiency=DataSufficiencyLevel.INSUFFICIENT,
        total_historical_count=1,
        same_currency_count=1,
        amount_deviation=AmountDeviationFeature(
            current_amount=Decimal("50000.00"),
            currency="INR",
            comparable_count=1,
            calculation_notes="Insufficient",
        ),
        beneficiary_feature=BeneficiaryFeature(
            beneficiary_id="payee@upi",
            status=BeneficiaryNoveltyStatus.INSUFFICIENT_HISTORY,
            historical_transaction_count=0,
            calculation_notes="Insufficient",
        ),
        velocity_feature=VelocityFeature(
            tx_count_1h=0,
            tx_volume_1h=Decimal("0.00"),
            tx_count_24h=1,
            tx_volume_24h=Decimal("50000.00"),
            tx_count_7d=1,
            tx_volume_7d=Decimal("50000.00"),
            calculation_notes="Insufficient",
        ),
        payment_method_feature=PaymentMethodFeature(
            payment_method="UPI",
            status=PaymentMethodNoveltyStatus.INSUFFICIENT_HISTORY,
            historical_usage_count=0,
            calculation_notes="Insufficient",
        ),
        time_deviation=TimeDeviationFeature(
            current_time_of_day_utc="14:00",
            calculation_notes="Insufficient",
        ),
        summary="Cold start",
    )

    score = score_with_isolation_forest(cold_features, model, meta)
    assert score.prediction == ModelPredictionLabel.NORMAL
    assert score.normalized_anomaly_severity == 0.0
    assert any("Insufficient historical baseline" in n for n in score.assessment_notes)


def test_score_normal_transaction(trained_iforest_model):
    """Normal customer transaction conforming to history should score as normal inlier."""
    model, meta = trained_iforest_model

    req = generate_normal_training_dataset(n_samples=1, random_seed=42)[0]
    features = extract_behavioural_features(req)
    score = score_with_isolation_forest(features, model, meta)

    assert isinstance(score, IsolationForestScore)
    assert score.prediction == ModelPredictionLabel.NORMAL
    assert score.decision_function >= 0.0
    assert score.normalized_anomaly_severity <= 0.5


def test_score_compound_mule_anomaly(trained_iforest_model):
    """Compound transaction with 25x amount spike to novel beneficiary must be isolated as an outlier."""
    model, meta = trained_iforest_model

    req = generate_normal_training_dataset(n_samples=1, random_seed=42)[0]
    # Inject 25x amount spike to novel unregistered beneficiary
    spike_curr = req.current_transaction.model_copy(
        update={
            "amount": req.current_transaction.amount * Decimal("25.0"),
            "beneficiary_id": "unregistered_mule_99@upi",
        }
    )
    spike_req = req.model_copy(update={"current_transaction": spike_curr})
    features = extract_behavioural_features(spike_req)

    score = score_with_isolation_forest(features, model, meta)
    assert score.prediction == ModelPredictionLabel.ANOMALY
    assert score.decision_function < 0.0
    assert score.normalized_anomaly_severity > 0.5


def test_score_samples_direction_consistency(trained_iforest_model):
    """Outliers must produce lower score_samples than inliers."""
    model, meta = trained_iforest_model

    normal_req = generate_normal_training_dataset(n_samples=1, random_seed=42)[0]
    normal_feats = extract_behavioural_features(normal_req)
    normal_score = score_with_isolation_forest(normal_feats, model, meta)

    extreme_curr = normal_req.current_transaction.model_copy(
        update={"amount": normal_req.current_transaction.amount * Decimal("20.0")}
    )
    extreme_req = normal_req.model_copy(update={"current_transaction": extreme_curr})
    extreme_feats = extract_behavioural_features(extreme_req)
    extreme_score = score_with_isolation_forest(extreme_feats, model, meta)

    # In Isolation Forest: lower score = more anomalous
    assert extreme_score.raw_score_samples < normal_score.raw_score_samples
    assert extreme_score.decision_function < normal_score.decision_function


# =====================================================================
# 5. BENCHMARK EVALUATION TESTS
# =====================================================================


def test_benchmark_evaluation_execution(trained_iforest_model):
    """Run comparative benchmark and verify report structure and metric sanity."""
    model, meta = trained_iforest_model

    # Use evaluation set with full archetypes
    eval_cases = generate_evaluation_dataset(n_normal=50, n_anomalous=80, random_seed=101)
    report = run_benchmark_evaluation(eval_cases, model, meta)

    assert isinstance(report, ModelBenchmarkReport)
    assert report.evaluation_sample_count == 130
    assert report.normal_sample_count == 50
    assert report.anomalous_sample_count == 80

    # Deterministic metrics validation
    det = report.deterministic_metrics
    assert 0.0 <= det.precision <= 1.0
    assert 0.0 <= det.recall <= 1.0
    assert 0.0 <= det.f1_score <= 1.0
    assert 0.0 <= det.false_positive_rate <= 1.0
    assert 0.0 <= det.accuracy <= 1.0
    assert det.true_positives + det.false_positives + det.true_negatives + det.false_negatives == 130

    # Isolation Forest metrics validation
    ifo = report.isolation_forest_metrics
    assert 0.0 <= ifo.precision <= 1.0
    assert 0.0 <= ifo.recall <= 1.0
    assert 0.0 <= ifo.f1_score <= 1.0
    assert 0.0 <= ifo.false_positive_rate <= 1.0
    assert 0.0 <= ifo.accuracy <= 1.0
    assert ifo.true_positives + ifo.false_positives + ifo.true_negatives + ifo.false_negatives == 130

    # Archetype breakdown check
    assert "normal" in report.scenario_breakdown
    assert "extreme_amount" in report.scenario_breakdown
    assert "compound_mule" in report.scenario_breakdown
    assert "velocity_surge" in report.scenario_breakdown
    assert "unusual_time" in report.scenario_breakdown
    assert "new_payment_method" in report.scenario_breakdown
