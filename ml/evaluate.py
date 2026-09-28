"""
Model Evaluation and Diagnostic Inspection Script.
Generates ROC curve coordinates, detailed classification report, and feature rankings.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import classification_report, roc_curve, precision_recall_curve

from feature_engineering import FEATURE_COLUMNS
from preprocessing import prepare_data

ML_DIR = os.path.dirname(__file__)

def evaluate():
    model_path = os.path.join(ML_DIR, "model.pkl")
    scaler_path = os.path.join(ML_DIR, "scaler.pkl")

    if not os.path.exists(model_path):
        print("Model not found. Running training first...")
        from train import train_and_evaluate_models
        train_and_evaluate_models()

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    X_train, X_test, y_train, y_test, _, _ = prepare_data()
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\n--- Detailed Classification Report ---")
    print(classification_report(y_test, y_pred, target_names=["No Landslide", "Landslide"]))

    fpr, tpr, _ = roc_curve(y_test, y_prob)
    prec, rec, _ = precision_recall_curve(y_test, y_prob)

    roc_data = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr[::max(1, len(fpr)//50)], tpr[::max(1, len(tpr)//50)])]

    eval_report = {
        "roc_curve_sample": roc_data,
        "test_sample_size": len(y_test)
    }

    eval_json_path = os.path.join(ML_DIR, "evaluation_report.json")
    with open(eval_json_path, "w") as f:
        json.dump(eval_report, f, indent=2)

    print(f"Evaluation report written to {eval_json_path}")

if __name__ == "__main__":
    evaluate()
