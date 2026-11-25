from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    average_precision_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "raw" / "paysim"
MODEL_DIR = ROOT / "models"

csv_files = list(DATA_DIR.glob("*.csv"))

if not csv_files:
    raise FileNotFoundError(f"No PaySim CSV found in {DATA_DIR}")

CSV_PATH = csv_files[0]

COLUMNS = [
    "step", "type", "amount",
    "oldbalanceOrg", "isFraud"
]

TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]


def make_features(df):
    amount = df["amount"].astype("float32")
    balance = df["oldbalanceOrg"].astype("float32")

    ratio = amount / balance.clip(lower=1)

    X = pd.DataFrame(index=df.index)

    X["log_amount"] = np.log1p(amount)
    X["log_sender_balance"] = np.log1p(balance)
    X["amount_to_balance_ratio"] = ratio.clip(0, 10)

    X["sender_balance_zero"] = (balance == 0).astype("int8")
    X["amount_equals_balance"] = (
        (amount - balance).abs() <= 0.01
    ).astype("int8")

    X["amount_exceeds_balance"] = (
        amount > balance + 0.01
    ).astype("int8")

    for transaction_type in TYPES:
        X[f"type_{transaction_type}"] = (
            df["type"] == transaction_type
        ).astype("int8")

    return X.astype("float32")


def main():
    print("Finding dataset time range...")

    max_step = 0

    for chunk in pd.read_csv(
        CSV_PATH, usecols=["step"], chunksize=200000
    ):
        max_step = max(max_step, int(chunk["step"].max()))

    cutoff = int(max_step * 0.8)

    print("Maximum step:", max_step)
    print("Training through step:", cutoff)

    train_parts = []
    test_parts = []

    print("\nCollecting training and test data...")

    for i, chunk in enumerate(
        pd.read_csv(CSV_PATH, usecols=COLUMNS, chunksize=200000)
    ):
        train = chunk[chunk["step"] <= cutoff]
        test = chunk[chunk["step"] > cutoff]

        if not train.empty:
            fraud = train[train["isFraud"] == 1]
            legitimate = train[train["isFraud"] == 0]

            # Keep all fraud records and sample legitimate records.
            if len(legitimate) > 2000:
                legitimate = legitimate.sample(
                    n=2000, random_state=42 + i
                )

            train_parts.extend([fraud, legitimate])

        if not test.empty:
            test_parts.append(test)

    train_df = pd.concat(train_parts, ignore_index=True)
    test_df = pd.concat(test_parts, ignore_index=True)

    print("Training records:", f"{len(train_df):,}")
    print("Test records:", f"{len(test_df):,}")
    print("Training fraud:", int(train_df["isFraud"].sum()))
    print("Test fraud:", int(test_df["isFraud"].sum()))

    X_train = make_features(train_df)
    y_train = train_df["isFraud"].astype("int8")

    X_test = make_features(test_df)
    y_test = test_df["isFraud"].astype("int8")

    print("\nTraining HistGradientBoosting model...")

    counts = np.bincount(y_train, minlength=2)

    if min(counts) == 0:
        raise ValueError("Training data does not contain both classes.")

    weights = np.where(
        y_train.to_numpy() == 1,
        len(y_train) / (2 * counts[1]),
        len(y_train) / (2 * counts[0])
    )

    model = HistGradientBoostingClassifier(
        max_iter=100,
        learning_rate=0.08,
        max_leaf_nodes=15,
        min_samples_leaf=50,
        l2_regularization=1.0,
        early_stopping=True,
        random_state=42
    )

    model.fit(X_train, y_train, sample_weight=weights)

    print("\nEvaluating on the later transaction period...")

    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= 0.5).astype("int8")

    print("\nAVERAGE PRECISION (PR-AUC):",
          round(average_precision_score(y_test, probabilities), 5))

    print("ROC-AUC:",
          round(roc_auc_score(y_test, probabilities), 5))

    print("\nCLASSIFICATION REPORT:")
    print(classification_report(
        y_test, predictions, zero_division=0
    ))

    print("CONFUSION MATRIX:")
    print(confusion_matrix(y_test, predictions))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    output = MODEL_DIR / "paysim_behavior_model.joblib"

    joblib.dump({
        "model": model,
        "features": list(X_train.columns),
        "threshold": 0.5,
        "dataset": "PaySim",
        "training_cutoff_step": cutoff
    }, output)

    print("\nMODEL SAVED:", output)
    print("Baseline training completed.")


if __name__ == "__main__":
    main()