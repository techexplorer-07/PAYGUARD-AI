"""Comprehensive test suite for Behavioural Risk Engine (Phase 2.2.1 & Phase 2.2.2)."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.behavioural import (
    BeneficiaryNoveltyStatus,
    BehaviouralAnalysisRequest,
    BehaviouralFeatureSet,
    CurrentTransaction,
    DataSufficiencyLevel,
    HistoricalTransaction,
    PaymentMethodNoveltyStatus,
)
from app.services.behavioural_feature_extractor import (
    _calculate_circular_minute_distance,
    _calculate_median,
    extract_behavioural_features,
)

client = TestClient(app)
ENDPOINT_URL = "/api/v1/behavioural/extract-features"

# Standard reference timestamp (UTC)
BASE_TIME = datetime(2026, 11, 22, 14, 30, 0, tzinfo=timezone.utc)


# =====================================================================
# DATA CONTRACT & VALIDATION TESTS (Phase 2.2.1)
# =====================================================================


def test_valid_historical_transaction() -> None:
    """Test 1: Valid historical transaction schema creation."""
    ht = HistoricalTransaction(
        transaction_id="TX-HIST-001",
        customer_id="CUST-1001",
        amount=Decimal("1500.50"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME - timedelta(days=2),
    )
    assert ht.transaction_id == "TX-HIST-001"
    assert ht.amount == Decimal("1500.50")
    assert ht.currency == "INR"


def test_negative_amount_rejection() -> None:
    """Test 2: Rejection of negative or zero amounts."""
    with pytest.raises(ValidationError):
        HistoricalTransaction(
            transaction_id="TX-001",
            customer_id="CUST-1001",
            amount=Decimal("-50.00"),
            currency="INR",
            beneficiary_id="vendor@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME,
        )

    with pytest.raises(ValidationError):
        CurrentTransaction(
            customer_id="CUST-1001",
            amount=Decimal("0.00"),
            currency="INR",
            beneficiary_id="vendor@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME,
        )


def test_invalid_currency_rejection() -> None:
    """Test 3: Rejection of lowercase or non-3-letter currency codes."""
    with pytest.raises(ValidationError):
        HistoricalTransaction(
            transaction_id="TX-001",
            customer_id="CUST-1001",
            amount=Decimal("100.00"),
            currency="inr",  # Lowercase rejected
            beneficiary_id="vendor@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME,
        )

    with pytest.raises(ValidationError):
        HistoricalTransaction(
            transaction_id="TX-001",
            customer_id="CUST-1001",
            amount=Decimal("100.00"),
            currency="US",  # 2 letters rejected
            beneficiary_id="vendor@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME,
        )


def test_naive_timestamp_rejection() -> None:
    """Test 4: Rejection of timezone-naive timestamps."""
    naive_dt = datetime(2026, 11, 22, 10, 0, 0)  # No tzinfo
    with pytest.raises(ValidationError) as exc:
        HistoricalTransaction(
            transaction_id="TX-001",
            customer_id="CUST-1001",
            amount=Decimal("100.00"),
            currency="INR",
            beneficiary_id="vendor@upi",
            payment_method="UPI",
            transaction_timestamp=naive_dt,
        )
    assert "timezone-aware" in str(exc.value)

    with pytest.raises(ValidationError) as exc:
        CurrentTransaction(
            customer_id="CUST-1001",
            amount=Decimal("100.00"),
            currency="INR",
            beneficiary_id="vendor@upi",
            payment_method="UPI",
            transaction_timestamp=naive_dt,
        )
    assert "timezone-aware" in str(exc.value)


def test_wrong_customer_ownership_rejection() -> None:
    """Test 5: Rejection when transactions belong to a different customer ID."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist_tx = HistoricalTransaction(
        transaction_id="TX-001",
        customer_id="CUST-9999",  # Mismatched customer ID
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME - timedelta(hours=1),
    )

    with pytest.raises(ValidationError) as exc:
        BehaviouralAnalysisRequest(
            customer_id="CUST-1001",
            current_transaction=curr_tx,
            historical_transactions=[hist_tx],
        )
    assert "does not match request customer_id" in str(exc.value)


def test_duplicate_transaction_id_rejection() -> None:
    """Test 6: Rejection of duplicate transaction IDs in history."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist_tx_1 = HistoricalTransaction(
        transaction_id="TX-REPEAT-01",
        customer_id="CUST-1001",
        amount=Decimal("100.00"),
        currency="INR",
        beneficiary_id="b1@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME - timedelta(days=2),
    )
    hist_tx_2 = HistoricalTransaction(
        transaction_id="TX-REPEAT-01",  # Duplicate ID
        customer_id="CUST-1001",
        amount=Decimal("200.00"),
        currency="INR",
        beneficiary_id="b2@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME - timedelta(days=1),
    )

    with pytest.raises(ValidationError) as exc:
        BehaviouralAnalysisRequest(
            customer_id="CUST-1001",
            current_transaction=curr_tx,
            historical_transactions=[hist_tx_1, hist_tx_2],
        )
    assert "Duplicate transaction_id" in str(exc.value)


def test_future_historical_timestamp_rejection() -> None:
    """Edge Case: Rejection when a historical transaction occurs in the future relative to current."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    future_hist_tx = HistoricalTransaction(
        transaction_id="TX-FUTURE-01",
        customer_id="CUST-1001",
        amount=Decimal("100.00"),
        currency="INR",
        beneficiary_id="b1@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME + timedelta(hours=2),  # Future timestamp
    )

    with pytest.raises(ValidationError) as exc:
        BehaviouralAnalysisRequest(
            customer_id="CUST-1001",
            current_transaction=curr_tx,
            historical_transactions=[future_hist_tx],
        )
    assert "strictly in the future" in str(exc.value)


# =====================================================================
# FEATURE EXTRACTION MATHEMATICAL & BEHAVIOURAL TESTS (Phase 2.2.2)
# =====================================================================


def test_correct_historical_median_calculation() -> None:
    """Test 7: Verify median calculation on odd and even datasets."""
    # Odd length: [1000, 2000, 3000] -> median is 2000
    assert _calculate_median([Decimal("3000"), Decimal("1000"), Decimal("2000")]) == Decimal("2000")
    # Even length: [1000, 2000, 3000, 4000] -> median is (2000 + 3000)/2 = 2500
    assert _calculate_median([Decimal("4000"), Decimal("1000"), Decimal("3000"), Decimal("2000")]) == Decimal("2500")


def test_correct_median_absolute_deviation() -> None:
    """Test 8: Verify Median Absolute Deviation (MAD) on a known dataset."""
    # Dataset: [100, 200, 300, 400, 500]
    # Median = 300
    # Absolute deviations: [|100-300|=200, |200-300|=100, |300-300|=0, |400-300|=100, |500-300|=200]
    # Sorted abs deviations: [0, 100, 100, 200, 200]
    # Median of deviations (MAD) = 100
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("600.00"),
        currency="INR",
        beneficiary_id="b@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        HistoricalTransaction(
            transaction_id=f"TX-{i}",
            customer_id="CUST-1001",
            amount=Decimal(amt),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=i),
        )
        for i, amt in enumerate(["100.00", "200.00", "300.00", "400.00", "500.00"], start=1)
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    assert feats.amount_deviation.historical_median == Decimal("300.00")
    assert feats.amount_deviation.median_absolute_deviation == Decimal("100.00")
    assert feats.amount_deviation.difference_from_median == Decimal("300.00")  # 600 - 300
    assert feats.amount_deviation.ratio_to_median == Decimal("2.0000")
    # robust z-score: 0.6745 * (600 - 300) / 100 = 0.6745 * 3 = 2.0235
    assert feats.amount_deviation.robust_z_score == Decimal("2.0235")
    assert feats.amount_deviation.is_zero_mad is False


def test_cross_currency_exclusion() -> None:
    """Test 9: Historical transactions in different currency are excluded from amount statistics."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("5000.00"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        # USD transactions (should be ignored for INR amount baseline)
        HistoricalTransaction(
            transaction_id="TX-USD-1",
            customer_id="CUST-1001",
            amount=Decimal("100.00"),
            currency="USD",
            beneficiary_id="us_merchant@upi",
            payment_method="CARD",
            transaction_timestamp=BASE_TIME - timedelta(days=5),
        ),
        HistoricalTransaction(
            transaction_id="TX-USD-2",
            customer_id="CUST-1001",
            amount=Decimal("200.00"),
            currency="USD",
            beneficiary_id="us_merchant@upi",
            payment_method="CARD",
            transaction_timestamp=BASE_TIME - timedelta(days=4),
        ),
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    assert feats.same_currency_count == 0
    assert feats.amount_deviation.comparable_count == 0
    assert feats.amount_deviation.historical_median is None
    assert feats.amount_deviation.median_absolute_deviation is None
    assert feats.amount_deviation.robust_z_score is None
    assert "No historical transactions found denominated in INR" in feats.amount_deviation.calculation_notes


def test_new_beneficiary_detection() -> None:
    """Test 10: Detection of an unprecedented beneficiary."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("1000.00"),
        currency="INR",
        beneficiary_id="new_scammer@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        HistoricalTransaction(
            transaction_id="TX-01",
            customer_id="CUST-1001",
            amount=Decimal("1000.00"),
            currency="INR",
            beneficiary_id="trusted_merchant@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=1),
        )
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    assert feats.beneficiary_feature.status == BeneficiaryNoveltyStatus.NEW
    assert feats.beneficiary_feature.historical_transaction_count == 0
    assert feats.beneficiary_feature.historical_share_percentage == Decimal("0.00")
    assert "New beneficiary" in feats.beneficiary_feature.calculation_notes


def test_known_beneficiary_detection() -> None:
    """Test 11: Detection and share calculation for a known beneficiary."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("1000.00"),
        currency="INR",
        beneficiary_id="family@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        HistoricalTransaction(
            transaction_id="TX-01",
            customer_id="CUST-1001",
            amount=Decimal("500.00"),
            currency="INR",
            beneficiary_id="family@upi",  # Match 1
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=3),
        ),
        HistoricalTransaction(
            transaction_id="TX-02",
            customer_id="CUST-1001",
            amount=Decimal("700.00"),
            currency="INR",
            beneficiary_id="FAMILY@UPI",  # Match 2 (case insensitive)
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=2),
        ),
        HistoricalTransaction(
            transaction_id="TX-03",
            customer_id="CUST-1001",
            amount=Decimal("200.00"),
            currency="INR",
            beneficiary_id="store@upi",   # Other
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=1),
        ),
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    assert feats.beneficiary_feature.status == BeneficiaryNoveltyStatus.KNOWN
    assert feats.beneficiary_feature.historical_transaction_count == 2
    # 2 out of 3 = 66.67%
    assert feats.beneficiary_feature.historical_share_percentage == Decimal("66.67")
    assert "Known beneficiary" in feats.beneficiary_feature.calculation_notes


def test_insufficient_history_handling() -> None:
    """Test 12: Insufficient sample classification (< 3 transactions)."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("1000.00"),
        currency="INR",
        beneficiary_id="b@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        HistoricalTransaction(
            transaction_id="TX-01",
            customer_id="CUST-1001",
            amount=Decimal("1000.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=1),
        ),
        HistoricalTransaction(
            transaction_id="TX-02",
            customer_id="CUST-1001",
            amount=Decimal("1200.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=2),
        ),
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    assert feats.data_sufficiency == DataSufficiencyLevel.INSUFFICIENT
    assert feats.same_currency_count == 2
    # Time deviation requires at least 3 transactions
    assert feats.time_deviation.min_circular_distance_minutes is None
    assert "Insufficient historical sample" in feats.time_deviation.calculation_notes


def test_transaction_velocity_calculations() -> None:
    """Test 13: Velocity counts and volume accumulation across 1h, 24h, 7d windows."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="b@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        # 30 mins ago (falls in 1h, 24h, 7d)
        HistoricalTransaction(
            transaction_id="TX-1H",
            customer_id="CUST-1001",
            amount=Decimal("1000.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(minutes=30),
        ),
        # 5 hours ago (falls in 24h, 7d)
        HistoricalTransaction(
            transaction_id="TX-24H",
            customer_id="CUST-1001",
            amount=Decimal("2000.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(hours=5),
        ),
        # 3 days ago (falls in 7d only)
        HistoricalTransaction(
            transaction_id="TX-7D",
            customer_id="CUST-1001",
            amount=Decimal("4000.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=3),
        ),
        # 10 days ago (outside 7d window)
        HistoricalTransaction(
            transaction_id="TX-OLD",
            customer_id="CUST-1001",
            amount=Decimal("8000.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=10),
        ),
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    vel = feats.velocity_feature
    assert vel.tx_count_1h == 1
    assert vel.tx_volume_1h == Decimal("1000.00")

    assert vel.tx_count_24h == 2  # 1h + 5h
    assert vel.tx_volume_24h == Decimal("3000.00")  # 1000 + 2000

    assert vel.tx_count_7d == 3  # 1h + 5h + 3d
    assert vel.tx_volume_7d == Decimal("7000.00")  # 1000 + 2000 + 4000


def test_new_payment_method_detection() -> None:
    """Test 14: Detection of novel payment methods."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="b@upi",
        payment_method="CRYPTO_CARD",  # Novel method
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        HistoricalTransaction(
            transaction_id="TX-01",
            customer_id="CUST-1001",
            amount=Decimal("500.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=1),
        ),
        HistoricalTransaction(
            transaction_id="TX-02",
            customer_id="CUST-1001",
            amount=Decimal("500.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="NETBANKING",
            transaction_timestamp=BASE_TIME - timedelta(days=2),
        ),
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    assert feats.payment_method_feature.status == PaymentMethodNoveltyStatus.NEW
    assert feats.payment_method_feature.historical_usage_count == 0


def test_circular_time_deviation_around_midnight() -> None:
    """Test 15: Correct circular distance calculation across the 00:00 boundary."""
    # Direct formula test
    # 23:55 (1435 min) vs 00:05 (5 min) -> distance must be 10 minutes, not 1430
    dist_midnight = _calculate_circular_minute_distance(1435, 5)
    assert dist_midnight == 10

    # 12:00 (720 min) vs 00:00 (0 min) -> distance is 720 minutes
    dist_opposite = _calculate_circular_minute_distance(720, 0)
    assert dist_opposite == 720

    # Test within feature extractor
    # Current transaction at 00:02 UTC
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="b@upi",
        payment_method="UPI",
        transaction_timestamp=datetime(2026, 11, 22, 0, 2, 0, tzinfo=timezone.utc),
    )
    # Historical transactions all around 23:58 UTC
    hist = [
        HistoricalTransaction(
            transaction_id=f"TX-{i}",
            customer_id="CUST-1001",
            amount=Decimal("500.00"),
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=datetime(2026, 11, 21 - i, 23, 58, 0, tzinfo=timezone.utc),
        )
        for i in range(1, 5)
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    # 00:02 (2 min) to 23:58 (1438 min) is |2 - 1438| = 1436; circular dist = 1440 - 1436 = 4 minutes!
    assert feats.time_deviation.min_circular_distance_minutes == 4
    assert feats.time_deviation.is_unusual_hour is False


def test_empty_transaction_history() -> None:
    """Test 16: Graceful handling of zero historical transactions."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("500.00"),
        currency="INR",
        beneficiary_id="b@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=[],
    )
    feats = extract_behavioural_features(req)

    assert feats.total_historical_count == 0
    assert feats.same_currency_count == 0
    assert feats.data_sufficiency == DataSufficiencyLevel.INSUFFICIENT
    assert feats.amount_deviation.historical_median is None
    assert feats.amount_deviation.median_absolute_deviation is None
    assert feats.beneficiary_feature.status == BeneficiaryNoveltyStatus.INSUFFICIENT_HISTORY
    assert feats.payment_method_feature.status == PaymentMethodNoveltyStatus.INSUFFICIENT_HISTORY
    assert feats.time_deviation.min_circular_distance_minutes is None
    assert feats.velocity_feature.tx_count_24h == 0


def test_zero_mad_edge_case() -> None:
    """Test 17: All historical transactions have identical amounts (MAD is 0.00)."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-1001",
        amount=Decimal("1500.00"),  # Current differs from the fixed 1000.00
        currency="INR",
        beneficiary_id="b@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        HistoricalTransaction(
            transaction_id=f"TX-{i}",
            customer_id="CUST-1001",
            amount=Decimal("1000.00"),  # Exactly identical amounts
            currency="INR",
            beneficiary_id="b@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=i),
        )
        for i in range(1, 6)
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-1001",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    feats = extract_behavioural_features(req)

    assert feats.amount_deviation.historical_median == Decimal("1000.00")
    assert feats.amount_deviation.median_absolute_deviation == Decimal("0.00")
    assert feats.amount_deviation.is_zero_mad is True
    assert feats.amount_deviation.robust_z_score is None  # Avoided division by zero
    assert feats.amount_deviation.difference_from_median == Decimal("500.00")
    assert "Zero MAD detected" in feats.amount_deviation.calculation_notes


# =====================================================================
# API ENDPOINT INTEGRATION TESTS
# =====================================================================


def test_api_extract_behavioural_features_success() -> None:
    """Test 18: Live FastAPI endpoint call to POST /api/v1/behavioural/extract-features."""
    payload = {
        "customer_id": "CUST-API-01",
        "current_transaction": {
            "transaction_id": "TX-CURR-01",
            "customer_id": "CUST-API-01",
            "amount": 8500.00,
            "currency": "INR",
            "beneficiary_id": "merchant@upi",
            "payment_method": "UPI",
            "transaction_timestamp": BASE_TIME.isoformat(),
        },
        "historical_transactions": [
            {
                "transaction_id": f"TX-HIST-{i}",
                "customer_id": "CUST-API-01",
                "amount": float(amt),
                "currency": "INR",
                "beneficiary_id": "merchant@upi" if i % 2 == 0 else "other@upi",
                "payment_method": "UPI",
                "transaction_timestamp": (BASE_TIME - timedelta(days=i)).isoformat(),
            }
            for i, amt in enumerate([1000, 2000, 2500, 3000, 5000], start=1)
        ],
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["customer_id"] == "CUST-API-01"
    assert data["data_sufficiency"] == DataSufficiencyLevel.MINIMAL.value
    assert data["total_historical_count"] == 5
    assert data["same_currency_count"] == 5
    assert Decimal(data["amount_deviation"]["historical_median"]) == Decimal("2500.00")
    assert data["beneficiary_feature"]["status"] == BeneficiaryNoveltyStatus.KNOWN.value
    assert data["payment_method_feature"]["status"] == PaymentMethodNoveltyStatus.KNOWN.value
    assert "summary" in data


# =====================================================================
# BEHAVIOURAL RISK SCORING TESTS (Phase 2.2.3)
# =====================================================================

from app.schemas.behavioural import (
    BehaviouralRiskAssessment,
    BehaviouralRiskLevel,
    FeatureContribution,
)
from app.services.behavioural_risk_scorer import (
    MAX_WEIGHT_AMOUNT,
    MAX_WEIGHT_BENEFICIARY,
    MAX_WEIGHT_PAYMENT_METHOD,
    MAX_WEIGHT_TIME,
    MAX_WEIGHT_VELOCITY,
    SYNERGY_COMPOUND_WEIGHT,
    THRESHOLD_LOW_UPPER,
    THRESHOLD_MEDIUM_UPPER,
    score_behavioural_risk,
)

ANALYZE_ENDPOINT_URL = "/api/v1/behavioural/analyze"


def _create_sample_request(
    amount: Decimal = Decimal("1000.00"),
    currency: str = "INR",
    beneficiary_id: str = "trusted_merchant@upi",
    payment_method: str = "UPI",
    tx_time: datetime = BASE_TIME,
    history_count: int = 10,
    historical_amount: Decimal = Decimal("1000.00"),
    vary_amounts: bool = True,
    historical_beneficiary: str = "trusted_merchant@upi",
    historical_payment_method: str = "UPI",
) -> BehaviouralAnalysisRequest:
    """Helper to synthesize structured behavioural requests."""
    curr_tx = CurrentTransaction(
        transaction_id="TX-CURRENT",
        customer_id="CUST-SCORER-01",
        amount=amount,
        currency=currency,
        beneficiary_id=beneficiary_id,
        payment_method=payment_method,
        transaction_timestamp=tx_time,
    )

    history = []
    for i in range(1, history_count + 1):
        if vary_amounts:
            # Vary amounts: [800, 900, 1000, 1100, 1200...]
            amt = historical_amount + Decimal(str((i % 5 - 2) * 100))
        else:
            amt = historical_amount

        history.append(
            HistoricalTransaction(
                transaction_id=f"TX-HIST-{i:03d}",
                customer_id="CUST-SCORER-01",
                amount=amt,
                currency=currency,
                beneficiary_id=historical_beneficiary,
                payment_method=historical_payment_method,
                transaction_timestamp=tx_time - timedelta(days=i),
            )
        )

    return BehaviouralAnalysisRequest(
        customer_id="CUST-SCORER-01",
        current_transaction=curr_tx,
        historical_transactions=history,
    )


def test_normal_customer_transaction_pattern() -> None:
    """Test 19: Routine customer transaction yielding LOW anomaly score."""
    req = _create_sample_request(
        amount=Decimal("1000.00"),
        beneficiary_id="trusted_merchant@upi",
        payment_method="UPI",
        history_count=12,
        historical_amount=Decimal("1000.00"),
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features, transaction_id=req.current_transaction.transaction_id)

    assert assessment.risk_level == BehaviouralRiskLevel.LOW
    assert assessment.anomaly_score < THRESHOLD_LOW_UPPER
    assert len(assessment.detected_indicators) == 0
    assert any("LOW BEHAVIOURAL ANOMALY" in exp for exp in assessment.explanation)


def test_unusually_high_amount_scoring() -> None:
    """Test 20: Extreme amount deviation triggers amount contributor and indicator."""
    req = _create_sample_request(
        amount=Decimal("25000.00"),  # 25x historical median
        history_count=12,
        historical_amount=Decimal("1000.00"),
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features, transaction_id="TX-CURRENT")

    assert "EXTREME_AMOUNT_DEVIATION" in assessment.detected_indicators
    assert assessment.feature_contributions["amount_deviation"] == MAX_WEIGHT_AMOUNT
    # With amount anomaly alone (0.35), risk enters MEDIUM band
    assert assessment.risk_level == BehaviouralRiskLevel.MEDIUM
    assert assessment.anomaly_score == MAX_WEIGHT_AMOUNT


def test_new_beneficiary_alone_is_not_high() -> None:
    """Test 21: Crucial rule - A new beneficiary alone must NEVER produce HIGH risk."""
    req = _create_sample_request(
        amount=Decimal("1000.00"),  # Normal amount
        beneficiary_id="unprecedented_account@upi",  # Novel payee
        history_count=12,
        historical_beneficiary="regular_store@upi",
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features, transaction_id="TX-CURRENT")

    assert "NEW_BENEFICIARY" in assessment.detected_indicators
    assert assessment.feature_contributions["beneficiary_novelty"] == MAX_WEIGHT_BENEFICIARY  # 0.25
    # Must strictly be LOW because 0.25 < THRESHOLD_LOW_UPPER (0.30)
    assert assessment.risk_level == BehaviouralRiskLevel.LOW
    assert assessment.risk_level != BehaviouralRiskLevel.HIGH
    assert assessment.risk_level != BehaviouralRiskLevel.MEDIUM


def test_new_beneficiary_combined_with_large_amount() -> None:
    """Test 22: Joint novel payee + extreme amount spike activates compound synergy and reaches HIGH."""
    req = _create_sample_request(
        amount=Decimal("25000.00"),                  # Extreme amount (0.35)
        beneficiary_id="unknown_mule@upi",          # Novel payee (0.25)
        history_count=12,
        historical_amount=Decimal("1000.00"),
        historical_beneficiary="regular_store@upi",
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features, transaction_id="TX-CURRENT")

    assert "NEW_BENEFICIARY" in assessment.detected_indicators
    assert "EXTREME_AMOUNT_DEVIATION" in assessment.detected_indicators
    assert "COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE" in assessment.detected_indicators
    # 0.35 (amount) + 0.25 (beneficiary) + 0.10 (synergy) = 0.7000 >= 0.6500 (HIGH)
    assert assessment.anomaly_score >= THRESHOLD_MEDIUM_UPPER
    assert assessment.risk_level == BehaviouralRiskLevel.HIGH
    assert assessment.feature_contributions["compound_synergy"] == SYNERGY_COMPOUND_WEIGHT


def test_high_velocity_surge_scoring() -> None:
    """Test 23: Multiple transactions within 1h/24h triggers velocity surge."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-VEL-01",
        amount=Decimal("1000.00"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    # 4 transactions within the last 45 minutes
    hist = [
        HistoricalTransaction(
            transaction_id=f"TX-RUSH-{i}",
            customer_id="CUST-VEL-01",
            amount=Decimal("1000.00"),
            currency="INR",
            beneficiary_id="merchant@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(minutes=10 * i),
        )
        for i in range(1, 10)
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-VEL-01",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert "HIGH_VELOCITY_SURGE" in assessment.detected_indicators
    assert assessment.feature_contributions["velocity_surge"] == MAX_WEIGHT_VELOCITY


def test_new_payment_method_scoring() -> None:
    """Test 24: Unprecedented payment method contributes novelty score."""
    req = _create_sample_request(
        payment_method="CRYPTO_RAIL",
        history_count=10,
        historical_payment_method="UPI",
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert "NEW_PAYMENT_METHOD" in assessment.detected_indicators
    assert assessment.feature_contributions["payment_method_novelty"] == MAX_WEIGHT_PAYMENT_METHOD


def test_unusual_time_scoring() -> None:
    """Test 25: Transaction executed 6 hours away from historical times flags unusual time."""
    # Current at 03:00 UTC
    curr_time = datetime(2026, 11, 22, 3, 0, 0, tzinfo=timezone.utc)
    # History all at 14:00 UTC (11 hours away circular)
    req = _create_sample_request(
        tx_time=curr_time,
        history_count=5,
    )
    # Override historical timestamps to 14:00 UTC
    for i, ht in enumerate(req.historical_transactions, start=1):
        ht.transaction_timestamp = datetime(2026, 11, 22 - i, 14, 0, 0, tzinfo=timezone.utc)

    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert "UNUSUAL_TRANSACTION_TIME" in assessment.detected_indicators
    assert assessment.feature_contributions["time_deviation"] == MAX_WEIGHT_TIME


def test_insufficient_historical_information_scoring() -> None:
    """Test 26: Insufficient historical profile (< 3 transactions) MUST yield UNCERTAIN risk."""
    req = _create_sample_request(history_count=2)
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert features.data_sufficiency == DataSufficiencyLevel.INSUFFICIENT
    assert assessment.risk_level == BehaviouralRiskLevel.UNCERTAIN
    assert assessment.risk_level != BehaviouralRiskLevel.LOW
    assert any("insufficient" in exp.lower() for exp in assessment.explanation)


def test_zero_mad_fallback_scoring() -> None:
    """Test 27: Zero MAD fallback correctly detects amount spikes using ratio_to_median."""
    req = _create_sample_request(
        amount=Decimal("5000.00"),          # 5x higher than fixed history
        history_count=10,
        historical_amount=Decimal("1000.00"),
        vary_amounts=False,                 # All amounts exactly 1000.00 -> MAD is 0.00
    )
    features = extract_behavioural_features(req)
    assert features.amount_deviation.is_zero_mad is True
    assert features.amount_deviation.robust_z_score is None

    assessment = score_behavioural_risk(features)
    assert "EXTREME_AMOUNT_DEVIATION_ZERO_MAD" in assessment.detected_indicators
    assert assessment.feature_contributions["amount_deviation"] == MAX_WEIGHT_AMOUNT


def test_missing_currency_comparable_history() -> None:
    """Test 28: Missing currency-comparable history yields UNCERTAIN risk."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-CURR-01",
        amount=Decimal("1000.00"),
        currency="EUR",  # Current is EUR
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    hist = [
        HistoricalTransaction(
            transaction_id="TX-INR-1",
            customer_id="CUST-CURR-01",
            amount=Decimal("1000.00"),
            currency="INR",  # History only in INR
            beneficiary_id="merchant@upi",
            payment_method="UPI",
            transaction_timestamp=BASE_TIME - timedelta(days=1),
        )
    ]
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-CURR-01",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert assessment.risk_level == BehaviouralRiskLevel.UNCERTAIN
    assert any("No comparable historical transactions in EUR" in exp for exp in assessment.explanation)


def test_missing_feature_handling() -> None:
    """Test 29: Missing or unavailable features contribute 0.0 and do not cause exceptions."""
    curr_tx = CurrentTransaction(
        customer_id="CUST-EMPTY",
        amount=Decimal("1000.00"),
        currency="INR",
        beneficiary_id="merchant@upi",
        payment_method="UPI",
        transaction_timestamp=BASE_TIME,
    )
    req = BehaviouralAnalysisRequest(
        customer_id="CUST-EMPTY",
        current_transaction=curr_tx,
        historical_transactions=[],
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert assessment.anomaly_score == Decimal("0.0000")
    assert assessment.risk_level == BehaviouralRiskLevel.UNCERTAIN


def test_score_normalization_bounded() -> None:
    """Test 30: Total composite score never exceeds 1.0000 even with all anomalies present."""
    # Synthesize a request with all anomalies simultaneously
    curr_time = datetime(2026, 11, 22, 3, 0, 0, tzinfo=timezone.utc)
    curr_tx = CurrentTransaction(
        customer_id="CUST-ALL-ANOM",
        amount=Decimal("50000.00"),
        currency="INR",
        beneficiary_id="foreign_scammer@upi",
        payment_method="NEW_CHANNEL",
        transaction_timestamp=curr_time,
    )
    # History with 10 tx, clustered at 14:00 UTC, normal amounts 1000.00, regular beneficiary, 5 tx in last 30 mins
    hist = []
    for i in range(1, 12):
        ts = curr_time - timedelta(minutes=10 * i) if i <= 5 else curr_time - timedelta(days=i)
        hist.append(
            HistoricalTransaction(
                transaction_id=f"TX-ANOM-{i:03d}",
                customer_id="CUST-ALL-ANOM",
                amount=Decimal("1000.00"),
                currency="INR",
                beneficiary_id="regular_store@upi",
                payment_method="UPI",
                transaction_timestamp=ts,
            )
        )

    req = BehaviouralAnalysisRequest(
        customer_id="CUST-ALL-ANOM",
        current_transaction=curr_tx,
        historical_transactions=hist,
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert assessment.anomaly_score <= Decimal("1.0000")
    assert assessment.anomaly_score >= Decimal("0.0000")
    assert assessment.risk_level == BehaviouralRiskLevel.HIGH


def test_risk_level_threshold_boundaries() -> None:
    """Test 31: Exact unit tests on threshold boundaries."""
    from app.schemas.behavioural import (
        AmountDeviationFeature,
        BeneficiaryFeature,
        PaymentMethodFeature,
        TimeDeviationFeature,
        VelocityFeature,
    )

    def _make_dummy_features() -> BehaviouralFeatureSet:
        return BehaviouralFeatureSet(
            customer_id="CUST-TEST",
            data_sufficiency=DataSufficiencyLevel.SUFFICIENT,
            total_historical_count=15,
            same_currency_count=15,
            amount_deviation=AmountDeviationFeature(
                current_amount=Decimal("1000.00"),
                currency="INR",
                comparable_count=15,
                historical_median=Decimal("1000.00"),
                calculation_notes="",
            ),
            beneficiary_feature=BeneficiaryFeature(
                beneficiary_id="b@upi",
                status=BeneficiaryNoveltyStatus.KNOWN,
                historical_transaction_count=10,
                calculation_notes="",
            ),
            velocity_feature=VelocityFeature(
                tx_count_1h=0,
                tx_volume_1h=Decimal("0.00"),
                tx_count_24h=0,
                tx_volume_24h=Decimal("0.00"),
                tx_count_7d=5,
                tx_volume_7d=Decimal("5000.00"),
                calculation_notes="",
            ),
            payment_method_feature=PaymentMethodFeature(
                payment_method="UPI",
                status=PaymentMethodNoveltyStatus.KNOWN,
                historical_usage_count=15,
                calculation_notes="",
            ),
            time_deviation=TimeDeviationFeature(
                current_time_of_day_utc="14:00 UTC",
                min_circular_distance_minutes=10,
                is_unusual_hour=False,
                calculation_notes="",
            ),
            summary="test",
        )

    feats = _make_dummy_features()
    # 1. Base clean -> score 0.0000 -> LOW
    assert score_behavioural_risk(feats).risk_level == BehaviouralRiskLevel.LOW

    # 2. Beneficiary only -> score 0.2500 (< 0.3000) -> LOW
    feats.beneficiary_feature.status = BeneficiaryNoveltyStatus.NEW
    res = score_behavioural_risk(feats)
    assert res.anomaly_score == Decimal("0.2500")
    assert res.risk_level == BehaviouralRiskLevel.LOW

    # 3. Add moderate velocity (+0.1000) -> score 0.3500 (>= 0.3000) -> MEDIUM
    feats.velocity_feature.tx_count_24h = 3
    res = score_behavioural_risk(feats)
    assert res.anomaly_score == Decimal("0.3500")
    assert res.risk_level == BehaviouralRiskLevel.MEDIUM

    # 4. Add high amount (+0.2500) and synergy (+0.1000) -> score 0.7000 (>= 0.6500) -> HIGH
    feats.amount_deviation.robust_z_score = Decimal("3.0000")
    res = score_behavioural_risk(feats)
    assert res.anomaly_score == Decimal("0.7000")
    assert res.risk_level == BehaviouralRiskLevel.HIGH


def test_explanation_generation_content() -> None:
    """Test 32: Validates that explanation array produces traceable, readable reasoning."""
    req = _create_sample_request(
        amount=Decimal("5000.00"),
        beneficiary_id="new_recipient@upi",
        history_count=10,
        historical_amount=Decimal("1000.00"),
    )
    features = extract_behavioural_features(req)
    assessment = score_behavioural_risk(features)

    assert len(assessment.explanation) >= 3
    all_text = " ".join(assessment.explanation)
    assert "First-time beneficiary" in all_text or "new beneficiary" in all_text.lower()
    assert "amount" in all_text.lower()
    assert "ANOMALY" in assessment.explanation[0]


def test_invalid_assessment_values_rejected() -> None:
    """Test 33: Schema validation rejects anomaly scores outside [0.0, 1.0] or naive timestamps."""
    with pytest.raises(ValidationError):
        BehaviouralRiskAssessment(
            assessment_id="ASM-001",
            customer_id="CUST-1",
            anomaly_score=Decimal("1.5000"),  # > 1.0 rejected
            risk_level=BehaviouralRiskLevel.HIGH,
            feature_contributions={},
            explanation=[],
            data_sufficiency=DataSufficiencyLevel.SUFFICIENT,
            assessment_timestamp=BASE_TIME,
        )

    with pytest.raises(ValidationError):
        BehaviouralRiskAssessment(
            assessment_id="ASM-001",
            customer_id="CUST-1",
            anomaly_score=Decimal("0.5000"),
            risk_level=BehaviouralRiskLevel.MEDIUM,
            feature_contributions={},
            explanation=[],
            data_sufficiency=DataSufficiencyLevel.SUFFICIENT,
            assessment_timestamp=datetime(2026, 11, 22, 10, 0, 0),  # Naive timestamp rejected
        )


def test_api_analyze_behavioural_endpoint_success() -> None:
    """Test 34: Live FastAPI endpoint call to POST /api/v1/behavioural/analyze."""
    payload = {
        "customer_id": "CUST-ANALYZE-01",
        "current_transaction": {
            "transaction_id": "TX-CURR-ANALYZE",
            "customer_id": "CUST-ANALYZE-01",
            "amount": 25000.00,
            "currency": "INR",
            "beneficiary_id": "unknown_payee@upi",
            "payment_method": "UPI",
            "transaction_timestamp": BASE_TIME.isoformat(),
        },
        "historical_transactions": [
            {
                "transaction_id": f"TX-H-{i}",
                "customer_id": "CUST-ANALYZE-01",
                "amount": float(amt),
                "currency": "INR",
                "beneficiary_id": "trusted_store@upi",
                "payment_method": "UPI",
                "transaction_timestamp": (BASE_TIME - timedelta(days=i)).isoformat(),
            }
            for i, amt in enumerate([1000, 1050, 950, 1000, 1020, 980, 1010, 990, 1000, 1050], start=1)
        ],
    }

    response = client.post(ANALYZE_ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["customer_id"] == "CUST-ANALYZE-01"
    assert data["transaction_id"] == "TX-CURR-ANALYZE"
    assert data["risk_level"] == BehaviouralRiskLevel.HIGH.value
    assert float(data["anomaly_score"]) >= 0.65
    assert "NEW_BENEFICIARY" in data["detected_indicators"]
    assert "EXTREME_AMOUNT_DEVIATION" in data["detected_indicators"]
    assert "COMPOUND_NOVEL_BENEFICIARY_AMOUNT_SPIKE" in data["detected_indicators"]
    assert len(data["explanation"]) > 0


def test_regression_existing_extract_features_endpoint() -> None:
    """Test 35: Regression check - POST /api/v1/behavioural/extract-features still works flawlessly."""
    payload = {
        "customer_id": "CUST-REGRESS-01",
        "current_transaction": {
            "transaction_id": "TX-REG-01",
            "customer_id": "CUST-REGRESS-01",
            "amount": 1000.00,
            "currency": "INR",
            "beneficiary_id": "store@upi",
            "payment_method": "UPI",
            "transaction_timestamp": BASE_TIME.isoformat(),
        },
        "historical_transactions": [
            {
                "transaction_id": f"TX-H-REG-{i}",
                "customer_id": "CUST-REGRESS-01",
                "amount": 1000.00,
                "currency": "INR",
                "beneficiary_id": "store@upi",
                "payment_method": "UPI",
                "transaction_timestamp": (BASE_TIME - timedelta(days=i)).isoformat(),
            }
            for i in range(1, 5)
        ],
    }

    response = client.post(ENDPOINT_URL, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == "CUST-REGRESS-01"
    assert data["data_sufficiency"] == DataSufficiencyLevel.MINIMAL.value
