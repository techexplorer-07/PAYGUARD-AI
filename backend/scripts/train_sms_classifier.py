import re
import joblib
import pandas as pd

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)

# Paths
BACKEND_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = BACKEND_DIR / "data/raw/sms_mendeley/extracted/Dataset_5971.csv"
MODEL_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODEL_DIR / "sms_scam_classifier.joblib"

LABELS = ["ham", "spam", "smishing"]


def normalize_text(text):
    text = str(text).casefold()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def main():
    print("Loading Mendeley SMS dataset...")

    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)

    required_columns = {"LABEL", "TEXT"}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"Missing columns. Found: {df.columns.tolist()}")

    # Normalize labels
    df["label"] = df["LABEL"].astype(str).str.strip().str.casefold()
    df["label"] = df["label"].replace({
        "spam": "spam",
        "smishing": "smishing",
        "ham": "ham"
    })

    # Keep only supported labels and non-empty messages
    df["text"] = df["TEXT"].fillna("").astype(str).str.strip()
    df = df[df["label"].isin(LABELS)]
    df = df[df["text"] != ""].copy()

    # Normalize text for duplicate detection
    df["normalized_text"] = df["text"].apply(normalize_text)

    # Remove messages with conflicting labels
    label_counts = df.groupby("normalized_text")["label"].nunique()
    conflicting_texts = label_counts[label_counts > 1].index

    print("Conflicting duplicate messages:", len(conflicting_texts))

    df = df[~df["normalized_text"].isin(conflicting_texts)].copy()

    # Remove exact duplicate messages
    before = len(df)
    df = df.drop_duplicates(subset=["normalized_text"], keep="first")
    print("Duplicate messages removed:", before - len(df))

    X = df["text"]
    y = df["label"]

    print("\nCLASS DISTRIBUTION:")
    print(y.value_counts())

    if y.nunique() != 3:
        raise ValueError("Expected all three classes: ham, spam, smishing")

    # Stratified train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print("\nTraining messages:", len(X_train))
    print("Testing messages:", len(X_test))

    # TF-IDF + Logistic Regression
    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            strip_accents="unicode",
            ngram_range=(1, 2),
            min_df=2,
            max_features=50000,
            sublinear_tf=True
        )),
        ("classifier", LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            random_state=42
        ))
    ])

    print("\nTraining model...")
    model.fit(X_train, y_train)

    print("Training completed.")

    # Evaluation
    predictions = model.predict(X_test)

    print("\nACCURACY:")
    print(f"{accuracy_score(y_test, predictions):.4f}")

    print("\nCLASSIFICATION REPORT:")
    print(classification_report(
        y_test,
        predictions,
        labels=LABELS,
        target_names=LABELS,
        zero_division=0
    ))

    print("CONFUSION MATRIX (ham, spam, smishing):")
    print(confusion_matrix(
        y_test,
        predictions,
        labels=LABELS
    ))

    # Save model and metadata
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    artifact = {
        "model": model,
        "labels": LABELS,
        "model_type": "TF-IDF + Logistic Regression",
        "dataset": "Mendeley SMS Phishing Dataset",
        "training_samples": len(X_train),
        "testing_samples": len(X_test),
        "class_distribution": y.value_counts().to_dict()
    }

    joblib.dump(artifact, MODEL_PATH)

    print("\nMODEL SAVED SUCCESSFULLY:")
    print(MODEL_PATH)

    # Quick inference test
    test_messages = [
        "Congratulations! You have won a free prize. Click this link now.",
        "Hey, are you coming to college tomorrow?",
        "Your bank account will be blocked. Verify your details immediately."
    ]

    print("\nSAMPLE PREDICTIONS:")
    for message in test_messages:
        prediction = model.predict([message])[0]
        print(f"{prediction.upper():10} | {message}")


if __name__ == "__main__":
    main()
