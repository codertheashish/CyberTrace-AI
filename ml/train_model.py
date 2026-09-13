"""
CyberTrace AI - Model Training Pipeline
=========================================
Trains a supervised model to predict the most likely cash-withdrawal
location_id for a suspicious transaction/account, using the engineered
features produced by generate_dataset.py.

No data leakage: previous_withdrawal_location, distance_from_previous_location,
timestamp-derived hour/day are computed BEFORE the withdrawal event itself, and
raw identifiers (transaction_id, complaint_id, account_id, timestamp) are
excluded from the model's feature matrix.

Saves:
  ml/saved_models/location_model.joblib
  ml/saved_models/label_encoders.joblib
  ml/saved_models/metrics.json          <- REAL metrics computed on held-out test set
"""
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, top_k_accuracy_score
)

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLS = [
    "amount", "hour", "day_of_week", "distance_from_previous_location",
    "withdrawal_frequency", "average_withdrawal_amount", "account_age_days",
    "transaction_velocity", "linked_accounts", "device_count",
    "historical_location_frequency", "time_since_last_withdrawal",
]
CATEGORICAL_COLS = ["transaction_type", "previous_withdrawal_location"]
TARGET_COL = "location_id"


def load_data():
    df = pd.read_csv(os.path.join(DATA_DIR, "ml_training_data.csv"))
    return df


def build_features(df, encoders=None, fit=False):
    df = df.copy()
    if encoders is None:
        encoders = {}
    for col in CATEGORICAL_COLS:
        if fit:
            le = LabelEncoder()
            df[col + "_enc"] = le.fit_transform(df[col].astype(str))
            encoders[col] = le
        else:
            le = encoders[col]
            df[col + "_enc"] = df[col].astype(str).map(
                lambda v: le.transform([v])[0] if v in le.classes_ else -1
            )
    feature_cols = FEATURE_COLS + [c + "_enc" for c in CATEGORICAL_COLS]
    X = df[feature_cols].fillna(0)
    return X, encoders, feature_cols


def main():
    df = load_data()
    print(f"Loaded {len(df)} labeled rows, {df[TARGET_COL].nunique()} distinct locations")

    # Keep only locations with enough support to be learnable & to allow
    # stratified splitting; extremely rare one-off locations are dropped
    # from the supervised task (they'd be unlearnable from 1 example anyway).
    counts = df[TARGET_COL].value_counts()
    keep_locs = counts[counts >= 5].index
    df = df[df[TARGET_COL].isin(keep_locs)].reset_index(drop=True)
    print(f"After filtering rare classes (<5 examples): {len(df)} rows, {df[TARGET_COL].nunique()} classes")

    target_encoder = LabelEncoder()
    y = target_encoder.fit_transform(df[TARGET_COL])

    X, encoders, feature_cols = build_features(df, fit=True)

    # 60/20/20 train/val/test split, stratified so every class appears in
    # every split (required for XGBoost's contiguous-label assumption and for
    # meaningful top-k accuracy on the test set).
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.4, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )

    candidates = {
        "RandomForest": RandomForestClassifier(
            n_estimators=300, max_depth=10, random_state=42, class_weight="balanced"
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=200, max_depth=3, random_state=42
        ),
    }
    if HAS_XGB:
        candidates["XGBoost"] = XGBClassifier(
            n_estimators=250, max_depth=5, learning_rate=0.08,
            eval_metric="mlogloss", random_state=42, verbosity=0
        )

    best_name, best_model, best_val_acc = None, None, -1
    val_scores = {}
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        val_pred = model.predict(X_val)
        val_acc = accuracy_score(y_val, val_pred)
        val_scores[name] = round(float(val_acc), 4)
        print(f"  [{name}] validation accuracy = {val_acc:.4f}")
        if val_acc > best_val_acc:
            best_val_acc, best_name, best_model = val_acc, name, model

    print(f"Selected best model: {best_name} (val acc={best_val_acc:.4f})")

    # Refit best model on train+val for final test evaluation
    X_trainval = pd.concat([X_train, X_val])
    y_trainval = np.concatenate([y_train, y_val])
    best_model.fit(X_trainval, y_trainval)

    test_pred = best_model.predict(X_test)
    test_proba = best_model.predict_proba(X_test)

    n_classes_present = test_proba.shape[1]
    k3 = min(3, n_classes_present)
    k5 = min(5, n_classes_present)

    metrics = {
        "selected_model": best_name,
        "validation_scores": val_scores,
        "test_accuracy": round(float(accuracy_score(y_test, test_pred)), 4),
        "test_precision_weighted": round(float(precision_score(y_test, test_pred, average="weighted", zero_division=0)), 4),
        "test_recall_weighted": round(float(recall_score(y_test, test_pred, average="weighted", zero_division=0)), 4),
        "test_f1_weighted": round(float(f1_score(y_test, test_pred, average="weighted", zero_division=0)), 4),
        "top_3_location_accuracy": round(float(top_k_accuracy_score(y_test, test_proba, k=k3, labels=np.arange(n_classes_present))), 4),
        "top_5_location_accuracy": round(float(top_k_accuracy_score(y_test, test_proba, k=k5, labels=np.arange(n_classes_present))), 4),
        "n_train": len(X_train), "n_val": len(X_val), "n_test": len(X_test),
        "n_classes": int(df[TARGET_COL].nunique()),
        "feature_cols": feature_cols,
    }
    print("Final test metrics:", json.dumps(metrics, indent=2))

    joblib.dump(best_model, os.path.join(MODEL_DIR, "location_model.joblib"))
    joblib.dump({"encoders": encoders, "target_encoder": target_encoder, "feature_cols": feature_cols},
                os.path.join(MODEL_DIR, "label_encoders.joblib"))
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print("\nSaved model, encoders, and metrics to ml/saved_models/")


if __name__ == "__main__":
    main()
