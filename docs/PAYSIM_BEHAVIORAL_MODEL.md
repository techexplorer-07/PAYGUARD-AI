# PaySim Supervised Behavioural Fraud Model Integration

## 1. Overview and Purpose

PAYGUARD AI incorporates a supervised gradient-boosted decision tree (`HistGradientBoostingClassifier`) trained on synthetic **PaySim** mobile money transaction records. 

The PaySim model operates as an **auxiliary, complementary behavioural risk signal** alongside:
1. **Deterministic Heuristic Anomaly Scorer** (robust Median/MAD z-score, beneficiary novelty, velocity surge, and circular time deviation).
2. **Unsupervised Isolation Forest** (tree-based multidimensional outlier isolation).
3. **Intent-to-Payment Correlation Engine** (communication-to-transaction intent alignment).
4. **SPEG Recipient Graph Intelligence** (multi-hop graph evidence and reported complaints).

> [!IMPORTANT]
> **Synthetic Dataset Limitation Notice:**
> The model was trained and evaluated on synthetic PaySim transaction data. High test scores on synthetic benchmarks (e.g. PR-AUC 0.99986, ROC-AUC 1.0) reflect synthetic behavioral patterns and **do not constitute evidence of real-world banking or UPI fraud prevention efficacy**. This is an academic/hackathon prototype model.

---

## 2. Difference Between Supervised PaySim and Isolation Forest

| Dimension | Supervised PaySim Model | Unsupervised Isolation Forest |
| :--- | :--- | :--- |
| **Paradigm** | Supervised classification (`HistGradientBoostingClassifier`) | Unsupervised anomaly isolation (`IsolationForest`) |
| **Objective** | Estimates probability of transaction matching known fraud signatures | Detects multidimensional deviations from customer's personal history |
| **Features Used** | Transaction amount, pre-transaction sender balance, and payment method rail | Robust z-scores, velocity ratios, payee novelty, historical share, circular time |
| **Output Type** | Calibrated fraud probability `[0.0, 1.0]` and binary classification | Anomaly severity score `[0.0, 1.0]` |
| **Failure Mode** | Gracefully omitted if sender balance is unknown or rail is unsupported | Gracefully degraded to `UNCERTAIN` when historical volume is `< 3` records |

---

## 3. Required Input Fields & Feature Generation

### 3.1 Raw Inference Inputs
- `amount` (float > 0): Transaction monetary amount.
- `sender_balance` (float >= 0, optional): Pre-transaction sender account balance. (If omitted, model returns `model_available=True` but does not evaluate).
- `payment_method` (str): Transaction channel or rail (`TRANSFER`, `PAYMENT`, `CASH_OUT`, `CASH_IN`, `DEBIT` or mapped aliases such as `UPI`, `CARD`, `IMPS`, etc.).

### 3.2 Feature Transformations
The model expects 11 input features transformed precisely as follows:

1. `log_amount = log1p(amount)`
2. `log_sender_balance = log1p(oldbalanceOrg)`
3. `amount_to_balance_ratio = amount / max(oldbalanceOrg, 1)`, clipped to `[0.0, 10.0]`
4. `sender_balance_zero = 1.0 if oldbalanceOrg == 0 else 0.0`
5. `amount_equals_balance = 1.0 if abs(amount - oldbalanceOrg) <= 0.01 else 0.0`
6. `amount_exceeds_balance = 1.0 if amount > oldbalanceOrg + 0.01 else 0.0`
7. `type_CASH_IN` (One-hot 0.0 or 1.0)
8. `type_CASH_OUT` (One-hot 0.0 or 1.0)
9. `type_DEBIT` (One-hot 0.0 or 1.0)
10. `type_PAYMENT` (One-hot 0.0 or 1.0)
11. `type_TRANSFER` (One-hot 0.0 or 1.0)

> [!CAUTION]
> **No Target/Leakage Features:**
> Target fields (`isFraud`, `isFlaggedFraud`) and post-transaction balances (`newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`) are **never used as inference inputs** to prevent temporal leakage.

---

## 4. Configuration & Artifact Management

Configuration is handled in `backend/app/core/config.py` using Pydantic Settings:

```python
PAYSIM_MODEL_ENABLED: bool = True
PAYSIM_MODEL_PATH: str = "backend/models/paysim_behavior_model.joblib"
PAYSIM_MODEL_THRESHOLD: float = 0.5
```

- **Singleton Pattern:** The model artifact is loaded once into memory via `PaySimModelManager.get_instance()` and reused across requests.
- **Path Resolution:** The artifact path is resolved relative to the backend/project directory, ensuring portability across execution environments.
- **Resilience:** If the model file is missing or disabled, the behavioural engine continues operating using the deterministic anomaly scorer and Isolation Forest without raising unhandled 500 errors.
- **Git Exclusion:** Model artifacts (`*.joblib`, `*.pkl`) and datasets (`backend/data/raw/`, `backend/data/processed/`) are strictly excluded in `.gitignore`.

---

## 5. Execution Commands

### Run Backend Server
```powershell
$env:PYTHONPATH='backend'
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Run Full Test Suite
```powershell
$env:PYTHONPATH='backend'
.\backend\venv\Scripts\python.exe -m pytest -v
```

### Run PaySim Dedicated Tests
```powershell
$env:PYTHONPATH='backend'
.\backend\venv\Scripts\python.exe -m pytest backend/tests/test_paysim_behavior.py -v
```
