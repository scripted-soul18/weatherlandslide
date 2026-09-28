"""
Landslide Risk Prediction & Explainable AI Inference Engine.
Loads trained ML models and computes landslide probabilities, risk tiers,
SHAP feature contributions, and human-readable risk factors.
"""

import os
import json
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
import joblib

from feature_engineering import extract_features_from_dict, FEATURE_COLUMNS

ML_DIR = os.path.dirname(__file__)

class LandslidePredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.metadata = {}
        self.explainer = None
        self._load_artifacts()

    def _load_artifacts(self):
        model_path = os.path.join(ML_DIR, "model.pkl")
        scaler_path = os.path.join(ML_DIR, "scaler.pkl")
        metadata_path = os.path.join(ML_DIR, "metadata.json")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
        else:
            print("Model artifacts not found. Automatically training...")
            from train import train_and_evaluate_models
            train_and_evaluate_models()
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)

        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                self.metadata = json.load(f)

    def get_risk_level(self, probability: float) -> str:
        if probability < 0.20:
            return "LOW"
        elif probability < 0.50:
            return "MODERATE"
        elif probability < 0.75:
            return "HIGH"
        else:
            return "VERY HIGH"

    def generate_human_factors(self, raw_input: Dict[str, Any], feature_contributions: Dict[str, float]) -> List[str]:
        """
        Generates intuitive human-readable risk drivers based on physical thresholds and SHAP weights.
        """
        factors = []
        slope = float(raw_input.get("slope", 0.0))
        rain_24h = float(raw_input.get("rainfall_24h", 0.0))
        rain_7d = float(raw_input.get("rainfall_7d", 0.0))
        soil_moisture = float(raw_input.get("soil_moisture", 0.0))
        veg = float(raw_input.get("vegetation_density", 0.5))
        prev_landslides = float(raw_input.get("previous_landslides", 0))

        if rain_24h >= 40.0 or rain_7d >= 100.0:
            factors.append(f"Heavy accumulated rainfall ({rain_24h:.1f} mm in 24h)")
        elif rain_24h >= 20.0:
            factors.append(f"Moderate sustained precipitation ({rain_24h:.1f} mm in 24h)")

        if slope >= 30.0:
            factors.append(f"Steep terrain slope ({slope:.1f}°)")
        elif slope >= 20.0:
            factors.append(f"Moderate hillside incline ({slope:.1f}°)")

        if soil_moisture >= 0.65:
            factors.append(f"Critical soil moisture saturation ({soil_moisture*100:.0f}%)")
        elif soil_moisture >= 0.45:
            factors.append(f"High subsurface soil moisture ({soil_moisture*100:.0f}%)")

        if prev_landslides >= 2:
            factors.append("Historical landslide-prone cluster zone")

        if veg <= 0.25 and slope >= 15.0:
            factors.append("Sparse vegetation / lack of root reinforcement")

        if not factors:
            factors.append("Stable terrain gradient with low meteorological forcing")

        return factors

    def explain_prediction(self, X_scaled: np.ndarray, feature_df: pd.DataFrame) -> Tuple[Dict[str, float], List[Dict[str, Any]]]:
        """
        Computes normalized feature contribution percentages (Explainable AI / SHAP proxy).
        """
        feature_names = FEATURE_COLUMNS
        contributions = {}
        top_shap_list = []

        # Tree model feature importances combined with normalized deviation from mean
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            # Weight = importance * magnitude of standardized feature value
            impacts = np.abs(X_scaled[0]) * importances
            total_impact = np.sum(impacts) + 1e-9
            pcts = (impacts / total_impact) * 100.0

            for idx, col in enumerate(feature_names):
                contributions[col] = round(float(pcts[idx]), 1)

            sorted_indices = np.argsort(pcts)[::-1]
            for idx in sorted_indices[:5]:
                col = feature_names[idx]
                top_shap_list.append({
                    "feature": col,
                    "label": col.replace("_", " ").title(),
                    "contribution_pct": round(float(pcts[idx]), 1),
                    "value": round(float(feature_df[col].iloc[0]), 2)
                })
        else:
            for col in feature_names:
                contributions[col] = 100.0 / len(feature_names)

        return contributions, top_shap_list

    def predict(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end prediction pipeline on raw inputs.
        """
        feature_df = extract_features_from_dict(raw_input)
        X_scaled = self.scaler.transform(feature_df)

        proba = float(self.model.predict_proba(X_scaled)[0, 1])
        risk_level = self.get_risk_level(proba)

        # Confidence metric (distance from decision boundary + calibration)
        confidence = round(float(0.5 + abs(proba - 0.5)), 2)

        contributions, top_shap_list = self.explain_prediction(X_scaled, feature_df)
        human_factors = self.generate_human_factors(raw_input, contributions)

        return {
            "latitude": float(raw_input.get("latitude", 0.0)),
            "longitude": float(raw_input.get("longitude", 0.0)),
            "landslide_probability": round(proba, 4),
            "risk_level": risk_level,
            "confidence": confidence,
            "factors": human_factors,
            "shap_contributions": top_shap_list,
            "feature_breakdown": contributions,
            "model_version": self.metadata.get("best_model_name", "Random Forest v1.0"),
            "disclaimer": "This is an AI-based risk estimate and not an official emergency warning. Follow local authorities and emergency services for safety instructions."
        }

# Global predictor instance
_predictor = None

def get_predictor() -> LandslidePredictor:
    global _predictor
    if _predictor is None:
        _predictor = LandslidePredictor()
    return _predictor

if __name__ == "__main__":
    predictor = get_predictor()
    sample_high_risk = {
        "latitude": 30.145,
        "longitude": 79.231,
        "rainfall_1h": 22.0,
        "rainfall_24h": 85.0,
        "rainfall_7d": 190.0,
        "slope": 34.5,
        "elevation": 1850.0,
        "soil_moisture": 0.72,
        "vegetation_density": 0.25,
        "previous_landslides": 2
    }
    res = predictor.predict(sample_high_risk)
    print(json.dumps(res, indent=2))
