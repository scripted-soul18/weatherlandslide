"""
Machine Learning Training Pipeline for Landslide Risk Assessment.
Trains and compares Random Forest, Gradient Boosting, Extra Trees, and MLP Neural Network.
Optimizes for high Recall and ROC-AUC to prevent hazardous false negatives.
Exports trained model, scaler, and SHAP explainer artifacts.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import shap

from feature_engineering import FEATURE_COLUMNS
from preprocessing import prepare_data

ML_DIR = os.path.dirname(__file__)

def train_and_evaluate_models():
    print("=" * 60)
    print("Starting Landslide Risk ML Training Pipeline")
    print("=" * 60)

    X_train, X_test, y_train, y_test, scaler, raw_df = prepare_data()

    # Candidate models
    models = {
        "Random Forest (Baseline)": RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=5,
            class_weight={0: 1.0, 1: 1.6},  # Penalize false negatives to boost recall
            random_state=42,
            n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=160,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.85,
            random_state=42
        ),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=150,
            max_depth=12,
            class_weight={0: 1.0, 1: 1.5},
            random_state=42,
            n_jobs=-1
        ),
        "Neural Network (MLP)": MLPClassifier(
            hidden_layer_sizes=(64, 32),
            max_iter=300,
            activation="relu",
            alpha=0.01,
            random_state=42
        )
    }

    results = {}
    best_score = -1
    best_model_name = None
    best_model = None

    for name, clf in models.items():
        print(f"\nTraining candidate model: {name}...")
        clf.fit(X_train, y_train)

        y_pred = clf.predict(X_test)
        y_prob = clf.predict_proba(X_test)[:, 1] if hasattr(clf, "predict_proba") else y_pred

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        # Scientific metric score focusing on safety: Composite score (0.4 Recall + 0.3 ROC-AUC + 0.2 F1 + 0.1 Acc)
        composite_metric = (0.40 * rec) + (0.30 * roc) + (0.20 * f1) + (0.10 * acc)

        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}  (Critical metric)")
        print(f"  F1 Score:  {f1:.4f}")
        print(f"  ROC-AUC:   {roc:.4f}")
        print(f"  Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

        results[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc), 4),
            "confusion_matrix": cm,
            "composite_score": round(float(composite_metric), 4)
        }

        if composite_metric > best_score:
            best_score = composite_metric
            best_model_name = name
            best_model = clf

    print("\n" + "=" * 60)
    print(f"WINNING MODEL: {best_model_name} (Composite Score: {best_score:.4f})")
    print("=" * 60)

    # SHAP Explainer Generation
    print("Generating SHAP Tree Explainer...")
    try:
        # Sample background for fast SHAP inference
        bg_sample = X_train[:100]
        if hasattr(best_model, "estimators_"):
            explainer = shap.TreeExplainer(best_model)
        else:
            explainer = shap.KernelExplainer(best_model.predict_proba, bg_sample)
        explainer_available = True
    except Exception as e:
        print(f"Warning: SHAP tree explainer fallback: {e}")
        explainer = None
        explainer_available = False

    # Feature Importance computation
    feature_importances = {}
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices:
            feature_importances[FEATURE_COLUMNS[idx]] = round(float(importances[idx]), 4)

    # Save artifacts
    model_path = os.path.join(ML_DIR, "model.pkl")
    scaler_path = os.path.join(ML_DIR, "scaler.pkl")
    explainer_path = os.path.join(ML_DIR, "explainer.pkl")
    metadata_path = os.path.join(ML_DIR, "metadata.json")

    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)
    if explainer:
        try:
            joblib.dump(explainer, explainer_path)
        except Exception as e:
            print(f"Could not pickle explainer directly: {e}")

    metadata = {
        "best_model_name": best_model_name,
        "features": FEATURE_COLUMNS,
        "thresholds": {
            "low_max": 0.20,
            "moderate_max": 0.50,
            "high_max": 0.75,
            "very_high_min": 0.75
        },
        "metrics": results[best_model_name],
        "all_model_results": results,
        "feature_importances": feature_importances,
        "sample_count": len(raw_df)
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nAll artifacts saved to {ML_DIR}")
    print(f"  - Model: {model_path}")
    print(f"  - Scaler: {scaler_path}")
    print(f"  - Metadata: {metadata_path}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate_models()
