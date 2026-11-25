import re
import joblib
import pandas as pd

from pathlib import Path
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)

ROOT = Path(__file__).resolve().parents[1]

UCI_PATH = ROOT / "data/raw/sms_uci/SMSSpamCollection"
MENDELEY_PATH = ROOT / "data/raw/sms_mendeley/extracted/Dataset_5971.csv"
MODEL_PATH = ROOT / "models/sms_scam_classifier.joblib"


def normalize_text(text):
    text = str(text).casefold()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def main():
    print("Loading trained Mendeley model...")
    artifact = joblib.load(MODEL_PATH)
    model = artifact["model"]

    print("Loading UCI dataset...")
    uci = pd.read_csv(
        UCI_PATH,
        sep="\t",
        header=None,
        names=["label", "text"],
        encoding="utf-8"
    )

    mendeley = pd.read_csv(MENDELEY_PATH)

    uci["label"] = uci["label"].astype(str).str.strip().str.casefold()
    uci["text"] = uci["text"].fillna("").astype(str).str.strip()

    uci = uci[uci["label"].isin(["ham", "spam"])]
    uci = uci[uci["text"] != ""].copy()

    # Normalize messages for duplicate detection
    uci["normalized_text"] = uci["text"].apply(normalize_text)
    mendeley["normalized_text"] = (
        mendeley["TEXT"].fillna("").astype(str).apply(normalize_text)
    )

    # Remove duplicates within UCI
    before = len(uci)
    uci = uci.drop_duplicates(subset=["normalized_text"])
    print("Duplicates within UCI removed:", before - len(uci))

    # Exclude messages already present in Mendeley
    mendeley_texts = set(mendeley["normalized_text"])
    overlap = uci["normalized_text"].isin(mendeley_texts)

    print("Messages overlapping with Mendeley:", int(overlap.sum()))

    uci = uci[~overlap].copy()

    if len(uci) == 0:
        raise ValueError("No independent UCI messages remain after deduplication.")

    X_test = uci["text"]
    y_true = uci["label"]

    print("\nEXTERNAL TEST DATA:")
    print("Independent messages:", len(uci))
    print("\nTrue label distribution:")
    print(y_true.value_counts())

    # Original three-class model predictions
    raw_predictions = model.predict(X_test)

    print("\nMODEL PREDICTION DISTRIBUTION:")
    print(pd.Series(raw_predictions).value_counts())

    # For binary external evaluation, both spam and smishing
    # predictions are treated as malicious.
    binary_predictions = [
        "spam" if prediction in ("spam", "smishing") else "ham"
        for prediction in raw_predictions
    ]

    print("\nEXTERNAL TEST ACCURACY:")
    print(f"{accuracy_score(y_true, binary_predictions):.4f}")

    print("\nEXTERNAL CLASSIFICATION REPORT:")
    print(classification_report(
        y_true,
        binary_predictions,
        labels=["ham", "spam"],
        target_names=["ham", "spam"],
        zero_division=0
    ))

    print("CONFUSION MATRIX (ham, spam):")
    print(confusion_matrix(
        y_true,
        binary_predictions,
        labels=["ham", "spam"]
    ))

    print("\nExternal evaluation completed.")
    print("No model retraining was performed.")


if __name__ == "__main__":
    main()
