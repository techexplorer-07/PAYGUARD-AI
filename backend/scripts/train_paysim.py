
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    average_precision_score,
    roc_auc_score
)

ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    ROOT / "data" / "raw" / "paysim" /
    "PS_20174392719_1491204439457_log.csv"
)

MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "paysim_fraud_model.joblib"

RANDOM_STATE = 42
NORMAL_SAMPLE_SIZE = 100_000
CHUNK_SIZE = 100_000

FEATURES = [
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
]

def engineer_features(df):
    df = df.copy()

    df["sender_error"] = (
        df["oldbalanceOrg"]
        - df["newbalanceOrig"]
        - df["amount"]
    )

    df["receiver_error"] = (
        df["newbalanceDest"]
        - df["oldbalanceDest"]
        - df["amount"]
    )

    df["sender_zero_before"] = (
        df["oldbalanceOrg"] == 0
    ).astype("int8")

    df["sender_depleted"] = (
        df["newbalanceOrig"] == 0
    ).astype("int8")

    return df

def main():
    print("Loading PaySim in chunks...")

    fraud_parts = []
    normal_parts = []
    rng = np.random.default_rng(RANDOM_STATE)

    for chunk in pd.read_csv(DATA_PATH, chunksize=CHUNK_SIZE):
        fraud = chunk[chunk["isFraud"] == 1]
        normal = chunk[chunk["isFraud"] == 0]

        if not fraud.empty:
            fraud_parts.append(fraud)

        if not normal.empty:
            normal_parts.append(normal.sample(
                frac=min(1.0, NORMAL_SAMPLE_SIZE / 6_354_407),
                random_state=int(rng.integers(0, 2**31 - 1))
            ))

    fraud_df = pd.concat(fraud_parts, ignore_index=True)
    normal_df = pd.concat(normal_parts, ignore_index=True)

    # Randomly select at most 100,000 legitimate transactions.
    normal_df = normal_df.sample(
        n=min(NORMAL_SAMPLE_SIZE, len(normal_df)),
        random_state=RANDOM_STATE
    )

    df = pd.concat([fraud_df, normal_df], ignore_index=True)
    df = df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)

    print("Fraud records:", len(fraud_df))
    print("Normal records:", len(normal_df))
    print("Total sampled records:", len(df))

    X = engineer_features(df)
    y = df["isFraud"].astype("int8")

    X = X.drop(columns=["isFraud", "isFlaggedFraud", "nameOrig", "nameDest", "step"],
               errors="ignore")

    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE
    )

    categorical = ["type"]
    numerical = [c for c in X.columns if c not in categorical]

    preprocess = ColumnTransformer([
        ("type", OneHotEncoder(handle_unknown="ignore"), categorical),
        ("numbers", "passthrough", numerical)
    ])

    model = Pipeline([
        ("preprocess", preprocess),
        ("classifier", RandomForestClassifier(
            n_estimators=150,
            max_depth=18,
            min_samples_leaf=2,
            class_weight="balanced",
            n_jobs=2,
            random_state=RANDOM_STATE
        ))
    ])

    print("\nTraining Random Forest...")
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]

    print("\n========== EVALUATION ==========")
    print(classification_report(
        y_test, predictions,
        target_names=["Normal", "Fraud"],
        digits=4
    ))

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    print("PR-AUC:", round(average_precision_score(
        y_test, probabilities
    ), 4))

    print("ROC-AUC:", round(roc_auc_score(
        y_test, probabilities
    ), 4))

    artifact = {
        "model": model,
        "features": list(X.columns),
        "algorithm": "RandomForestClassifier",
        "dataset": "PaySim",
        "random_state": RANDOM_STATE
    }

    joblib.dump(artifact, MODEL_PATH, compress=3)

    print("\nModel saved to:", MODEL_PATH)
    print("Training completed.")

if __name__ == "__main__":
    main()
