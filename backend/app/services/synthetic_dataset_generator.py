"""Reproducible synthetic dataset generator for behavioural anomaly experiments (Phase 2.2.4)."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random
from typing import Any, Dict, List, NamedTuple, Tuple
from pydantic import BaseModel, Field

from app.schemas.behavioural import (
    BehaviouralAnalysisRequest,
    CurrentTransaction,
    HistoricalTransaction,
)

BASE_TIMESTAMP = datetime(2026, 11, 22, 14, 0, 0, tzinfo=timezone.utc)


class SyntheticEvaluationCase(BaseModel):
    """Encapsulates a synthetic evaluation scenario with ground-truth test labels."""

    case_id: str = Field(..., description="Unique scenario identifier")
    customer_profile: str = Field(..., description="Customer profile archetype (student, merchant, etc.)")
    archetype: str = Field(..., description="Scenario category: normal, extreme_amount, compound, velocity, time, rail")
    is_anomaly: bool = Field(..., description="Ground-truth binary label: True for anomaly, False for normal")
    description: str = Field(..., description="Human-readable description of the synthetic condition")
    request: BehaviouralAnalysisRequest = Field(..., description="Fully populated BehaviouralAnalysisRequest")


class CustomerProfileArchetype(NamedTuple):
    profile_id: str
    base_amount: Decimal
    amount_std: Decimal
    frequent_payees: List[str]
    allowed_payment_methods: List[str]
    active_hour_start: int
    active_hour_end: int
    daily_tx_rate: float


PROFILES: Dict[str, CustomerProfileArchetype] = {
    "student": CustomerProfileArchetype(
        profile_id="CUST-STU-",
        base_amount=Decimal("450.00"),
        amount_std=Decimal("150.00"),
        frequent_payees=["canteen@upi", "campus_store@upi", "friend_hostel@upi", "recharge@upi"],
        allowed_payment_methods=["UPI"],
        active_hour_start=11,
        active_hour_end=23,
        daily_tx_rate=1.8,
    ),
    "professional": CustomerProfileArchetype(
        profile_id="CUST-PRO-",
        base_amount=Decimal("2500.00"),
        amount_std=Decimal("800.00"),
        frequent_payees=["grocery_mart@upi", "fuel_station@upi", "utility_power@upi", "restaurant@upi"],
        allowed_payment_methods=["UPI", "CARD"],
        active_hour_start=8,
        active_hour_end=22,
        daily_tx_rate=1.4,
    ),
    "merchant": CustomerProfileArchetype(
        profile_id="CUST-MER-",
        base_amount=Decimal("8500.00"),
        amount_std=Decimal("3000.00"),
        frequent_payees=["supplier_alpha@upi", "wholesale_corp@upi", "logistics@upi", "tax_dept@upi"],
        allowed_payment_methods=["UPI", "NETBANKING"],
        active_hour_start=9,
        active_hour_end=21,
        daily_tx_rate=4.5,
    ),
    "high_net_worth": CustomerProfileArchetype(
        profile_id="CUST-HNW-",
        base_amount=Decimal("45000.00"),
        amount_std=Decimal("15000.00"),
        frequent_payees=["wealth_mgmt@upi", "luxury_retail@upi", "charity_foundation@upi", "property_tax@upi"],
        allowed_payment_methods=["NETBANKING", "CARD"],
        active_hour_start=10,
        active_hour_end=20,
        daily_tx_rate=0.8,
    ),
}


def _generate_synthetic_history(
    customer_id: str,
    profile: CustomerProfileArchetype,
    n_history: int,
    ref_time: datetime,
    rng: random.Random,
) -> List[HistoricalTransaction]:
    """Generate a sequence of normal historical transactions conforming to a profile archetype."""
    history: List[HistoricalTransaction] = []

    for i in range(1, n_history + 1):
        # Sample positive amount with profile Gaussian distribution
        raw_amt = rng.gauss(float(profile.base_amount), float(profile.amount_std))
        amt = Decimal(str(round(max(50.0, raw_amt), 2)))

        payee = rng.choice(profile.frequent_payees)
        method = rng.choice(profile.allowed_payment_methods)

        # Sample timestamp on past days within profile active hours
        days_back = int(i / max(0.5, profile.daily_tx_rate)) + 1
        hour = rng.randint(profile.active_hour_start, profile.active_hour_end)
        minute = rng.randint(0, 59)
        ts = ref_time - timedelta(days=days_back)
        ts = ts.replace(hour=hour, minute=minute, second=0, microsecond=0)

        history.append(
            HistoricalTransaction(
                transaction_id=f"TX-{customer_id}-{i:04d}",
                customer_id=customer_id,
                amount=amt,
                currency="INR",
                beneficiary_id=payee,
                payment_method=method,
                transaction_timestamp=ts,
            )
        )

    return history


def generate_normal_training_dataset(
    n_samples: int = 500,
    random_seed: int = 42,
) -> List[BehaviouralAnalysisRequest]:
    """Generate a clean training set of normal transactions across all profiles.

    Zero anomalies are injected. Used strictly for unsupervised normal baseline calibration.
    """
    rng = random.Random(random_seed)
    training_requests: List[BehaviouralAnalysisRequest] = []
    profile_keys = list(PROFILES.keys())

    for i in range(1, n_samples + 1):
        p_key = profile_keys[i % len(profile_keys)]
        profile = PROFILES[p_key]
        cust_id = f"{profile.profile_id}TRN-{i:04d}"

        # 8 to 20 historical transactions per profile
        n_history = rng.randint(8, 20)
        history = _generate_synthetic_history(cust_id, profile, n_history, BASE_TIMESTAMP, rng)

        # Current transaction: regular normal transaction conforming to profile
        raw_amt = rng.gauss(float(profile.base_amount), float(profile.amount_std))
        amt = Decimal(str(round(max(50.0, raw_amt), 2)))
        payee = rng.choice(profile.frequent_payees)
        method = rng.choice(profile.allowed_payment_methods)
        hour = rng.randint(profile.active_hour_start, profile.active_hour_end)
        minute = rng.randint(0, 59)
        current_ts = BASE_TIMESTAMP.replace(hour=hour, minute=minute, second=0, microsecond=0)

        curr_tx = CurrentTransaction(
            transaction_id=f"TX-CURR-{cust_id}",
            customer_id=cust_id,
            amount=amt,
            currency="INR",
            beneficiary_id=payee,
            payment_method=method,
            transaction_timestamp=current_ts,
        )

        req = BehaviouralAnalysisRequest(
            customer_id=cust_id,
            current_transaction=curr_tx,
            historical_transactions=history,
        )
        training_requests.append(req)

    return training_requests


def generate_evaluation_dataset(
    n_normal: int = 200,
    n_anomalous: int = 80,
    random_seed: int = 101,  # Independent seed preventing train/test data leakage
) -> List[SyntheticEvaluationCase]:
    """Generate held-out evaluation scenarios with ground-truth binary labels."""
    rng = random.Random(random_seed)
    evaluation_cases: List[SyntheticEvaluationCase] = []
    profile_keys = list(PROFILES.keys())

    # 1. Normal Evaluation Scenarios (is_anomaly = False)
    for i in range(1, n_normal + 1):
        p_key = profile_keys[i % len(profile_keys)]
        profile = PROFILES[p_key]
        cust_id = f"{profile.profile_id}EVAL-NORM-{i:04d}"

        n_history = rng.randint(6, 18)
        history = _generate_synthetic_history(cust_id, profile, n_history, BASE_TIMESTAMP, rng)

        raw_amt = rng.gauss(float(profile.base_amount), float(profile.amount_std))
        amt = Decimal(str(round(max(50.0, raw_amt), 2)))
        payee = rng.choice(profile.frequent_payees)
        method = rng.choice(profile.allowed_payment_methods)
        hour = rng.randint(profile.active_hour_start, profile.active_hour_end)
        minute = rng.randint(0, 59)
        current_ts = BASE_TIMESTAMP.replace(hour=hour, minute=minute, second=0, microsecond=0)

        curr_tx = CurrentTransaction(
            transaction_id=f"TX-CURR-{cust_id}",
            customer_id=cust_id,
            amount=amt,
            currency="INR",
            beneficiary_id=payee,
            payment_method=method,
            transaction_timestamp=current_ts,
        )

        req = BehaviouralAnalysisRequest(
            customer_id=cust_id,
            current_transaction=curr_tx,
            historical_transactions=history,
        )

        evaluation_cases.append(
            SyntheticEvaluationCase(
                case_id=f"EVAL-NORM-{i:03d}",
                customer_profile=p_key,
                archetype="normal",
                is_anomaly=False,
                description="Conforms to normal customer historical spending, time, payee, and rail parameters.",
                request=req,
            )
        )

    # 2. Anomalous Evaluation Scenarios (is_anomaly = True)
    # 2a. Extreme Amount Deviation (20 cases)
    for i in range(1, 21):
        p_key = profile_keys[i % len(profile_keys)]
        profile = PROFILES[p_key]
        cust_id = f"{profile.profile_id}ANOM-AMT-{i:03d}"
        history = _generate_synthetic_history(cust_id, profile, 12, BASE_TIMESTAMP, rng)

        # 10x to 25x historical median
        extreme_amt = profile.base_amount * Decimal(str(rng.randint(10, 25)))
        curr_tx = CurrentTransaction(
            transaction_id=f"TX-CURR-{cust_id}",
            customer_id=cust_id,
            amount=extreme_amt,
            currency="INR",
            beneficiary_id=rng.choice(profile.frequent_payees),
            payment_method=rng.choice(profile.allowed_payment_methods),
            transaction_timestamp=BASE_TIMESTAMP.replace(hour=14, minute=0, second=0, microsecond=0),
        )
        req = BehaviouralAnalysisRequest(
            customer_id=cust_id,
            current_transaction=curr_tx,
            historical_transactions=history,
        )
        evaluation_cases.append(
            SyntheticEvaluationCase(
                case_id=f"EVAL-ANOM-AMT-{i:03d}",
                customer_profile=p_key,
                archetype="extreme_amount",
                is_anomaly=True,
                description=f"Extreme amount spike of {extreme_amt} INR (10-25x baseline median).",
                request=req,
            )
        )

    # 2b. Compound Anomaly: Novel Payee + 12x Amount Spike (20 cases)
    for i in range(1, 21):
        p_key = profile_keys[i % len(profile_keys)]
        profile = PROFILES[p_key]
        cust_id = f"{profile.profile_id}ANOM-CMP-{i:03d}"
        history = _generate_synthetic_history(cust_id, profile, 12, BASE_TIMESTAMP, rng)

        extreme_amt = profile.base_amount * Decimal(str(rng.randint(10, 20)))
        novel_payee = f"unregistered_mule_{i}@okaxis"
        curr_tx = CurrentTransaction(
            transaction_id=f"TX-CURR-{cust_id}",
            customer_id=cust_id,
            amount=extreme_amt,
            currency="INR",
            beneficiary_id=novel_payee,
            payment_method=rng.choice(profile.allowed_payment_methods),
            transaction_timestamp=BASE_TIMESTAMP.replace(hour=14, minute=0, second=0, microsecond=0),
        )
        req = BehaviouralAnalysisRequest(
            customer_id=cust_id,
            current_transaction=curr_tx,
            historical_transactions=history,
        )
        evaluation_cases.append(
            SyntheticEvaluationCase(
                case_id=f"EVAL-ANOM-CMP-{i:03d}",
                customer_profile=p_key,
                archetype="compound_mule",
                is_anomaly=True,
                description=f"High-risk compound anomaly: {extreme_amt} INR to novel payee '{novel_payee}'.",
                request=req,
            )
        )

    # 2c. Velocity Surge: 5 to 7 Rapid Transactions in Last 45 Mins (15 cases)
    for i in range(1, 16):
        p_key = profile_keys[i % len(profile_keys)]
        profile = PROFILES[p_key]
        cust_id = f"{profile.profile_id}ANOM-VEL-{i:03d}"
        history = _generate_synthetic_history(cust_id, profile, 10, BASE_TIMESTAMP, rng)

        # Inject 5 rapid transactions in last 40 minutes into history
        for j in range(1, 6):
            history.append(
                HistoricalTransaction(
                    transaction_id=f"TX-RUSH-{cust_id}-{j}",
                    customer_id=cust_id,
                    amount=profile.base_amount,
                    currency="INR",
                    beneficiary_id=rng.choice(profile.frequent_payees),
                    payment_method=rng.choice(profile.allowed_payment_methods),
                    transaction_timestamp=BASE_TIMESTAMP - timedelta(minutes=j * 7),
                )
            )

        curr_tx = CurrentTransaction(
            transaction_id=f"TX-CURR-{cust_id}",
            customer_id=cust_id,
            amount=profile.base_amount,
            currency="INR",
            beneficiary_id=rng.choice(profile.frequent_payees),
            payment_method=rng.choice(profile.allowed_payment_methods),
            transaction_timestamp=BASE_TIMESTAMP,
        )
        req = BehaviouralAnalysisRequest(
            customer_id=cust_id,
            current_transaction=curr_tx,
            historical_transactions=history,
        )
        evaluation_cases.append(
            SyntheticEvaluationCase(
                case_id=f"EVAL-ANOM-VEL-{i:03d}",
                customer_profile=p_key,
                archetype="velocity_surge",
                is_anomaly=True,
                description="Frequency acceleration: 5 rapid transactions within 40 minutes.",
                request=req,
            )
        )

    # 2d. Unusual Midnight Hour (15 cases)
    for i in range(1, 16):
        p_key = profile_keys[i % len(profile_keys)]
        profile = PROFILES[p_key]
        cust_id = f"{profile.profile_id}ANOM-TIME-{i:03d}"
        history = _generate_synthetic_history(cust_id, profile, 10, BASE_TIMESTAMP, rng)

        # Transaction at 03:30 AM (outside any customer daytime profile)
        midnight_ts = BASE_TIMESTAMP.replace(hour=3, minute=30, second=0, microsecond=0)
        curr_tx = CurrentTransaction(
            transaction_id=f"TX-CURR-{cust_id}",
            customer_id=cust_id,
            amount=profile.base_amount,
            currency="INR",
            beneficiary_id=rng.choice(profile.frequent_payees),
            payment_method=rng.choice(profile.allowed_payment_methods),
            transaction_timestamp=midnight_ts,
        )
        req = BehaviouralAnalysisRequest(
            customer_id=cust_id,
            current_transaction=curr_tx,
            historical_transactions=history,
        )
        evaluation_cases.append(
            SyntheticEvaluationCase(
                case_id=f"EVAL-ANOM-TIME-{i:03d}",
                customer_profile=p_key,
                archetype="unusual_time",
                is_anomaly=True,
                description="Circadian outlier: Transaction executed at 03:30 AM UTC (> 6h from profile hours).",
                request=req,
            )
        )

    # 2e. Novel Payment Method (10 cases)
    for i in range(1, 11):
        p_key = profile_keys[i % len(profile_keys)]
        profile = PROFILES[p_key]
        cust_id = f"{profile.profile_id}ANOM-RAIL-{i:03d}"
        history = _generate_synthetic_history(cust_id, profile, 10, BASE_TIMESTAMP, rng)

        curr_tx = CurrentTransaction(
            transaction_id=f"TX-CURR-{cust_id}",
            customer_id=cust_id,
            amount=profile.base_amount,
            currency="INR",
            beneficiary_id=rng.choice(profile.frequent_payees),
            payment_method="UNREGISTERED_CRYPTO_BRIDGE",
            transaction_timestamp=BASE_TIMESTAMP.replace(hour=14, minute=0, second=0, microsecond=0),
        )
        req = BehaviouralAnalysisRequest(
            customer_id=cust_id,
            current_transaction=curr_tx,
            historical_transactions=history,
        )
        evaluation_cases.append(
            SyntheticEvaluationCase(
                case_id=f"EVAL-ANOM-RAIL-{i:03d}",
                customer_profile=p_key,
                archetype="new_payment_method",
                is_anomaly=True,
                description="Novel payment rail 'UNREGISTERED_CRYPTO_BRIDGE' with zero customer history.",
                request=req,
            )
        )

    # Shuffle evaluation cases deterministically
    rng.shuffle(evaluation_cases)
    return evaluation_cases
