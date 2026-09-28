"""
ML Prediction Integration Service.
Orchestrates real-time weather retrieval, terrain analysis, and ML inference with Explainable AI.
"""

import sys
import os
from typing import Dict, Any, Optional
from datetime import datetime

# Add ml directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml")))

# pyrefly: ignore [missing-import]
from predict import get_predictor
from services.weather_service import weather_service
from services.terrain_service import terrain_service

class MLService:
    def __init__(self):
        self.predictor = get_predictor()

    async def predict_for_location(
        self,
        latitude: float,
        longitude: float,
        override_rain_24h: Optional[float] = None,
        override_slope: Optional[float] = None,
        override_soil_moisture: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Gathers live meteorological and terrain variables, runs ML model,
        and provides Explainable AI SHAP breakdown.
        """
        # 1. Fetch live weather & terrain in parallel
        weather_data = await weather_service.get_weather_and_forecast(latitude, longitude)
        terrain_data = await terrain_service.get_terrain_features(latitude, longitude)

        current_w = weather_data.get("current", {})

        # 2. Build feature payload with optional user overrides
        rainfall_1h = current_w.get("rainfall_1h", 0.0)
        rainfall_24h = override_rain_24h if override_rain_24h is not None else current_w.get("rainfall_24h", 0.0)
        rainfall_7d = current_w.get("rainfall_7d", 0.0)
        slope = override_slope if override_slope is not None else terrain_data.get("slope", 15.0)
        soil_moisture = override_soil_moisture if override_soil_moisture is not None else current_w.get("soil_moisture", 0.35)

        raw_input = {
            "latitude": latitude,
            "longitude": longitude,
            "rainfall_1h": rainfall_1h,
            "rainfall_3h": current_w.get("rainfall_3h", 0.0),
            "rainfall_6h": current_w.get("rainfall_6h", 0.0),
            "rainfall_12h": current_w.get("rainfall_12h", 0.0),
            "rainfall_24h": rainfall_24h,
            "rainfall_3d": current_w.get("rainfall_3d", 0.0),
            "rainfall_7d": rainfall_7d,
            "temperature": current_w.get("temperature", 20.0),
            "humidity": current_w.get("humidity", 65.0),
            "wind_speed": current_w.get("wind_speed", 10.0),
            "elevation": terrain_data.get("elevation", 300.0),
            "slope": slope,
            "aspect": terrain_data.get("aspect", 180.0),
            "plan_curvature": terrain_data.get("plan_curvature", 0.0),
            "profile_curvature": terrain_data.get("profile_curvature", 0.0),
            "soil_moisture": soil_moisture,
            "vegetation_density": terrain_data.get("vegetation_density", 0.55),
            "soil_type": terrain_data.get("soil_type", "clay_loam"),
            "land_cover": terrain_data.get("land_cover", "shrubland"),
            "geology_strength": terrain_data.get("geology_strength", 3),
            "previous_landslides": 1.0 if slope > 22.0 else 0.0
        }

        # 3. Perform ML inference + SHAP explanation
        prediction_result = self.predictor.predict(raw_input)

        # 4. Attach contextual metadata
        prediction_result["timestamp"] = datetime.utcnow().isoformat()
        prediction_result["terrain"] = terrain_data
        prediction_result["weather_summary"] = {
            "temperature": current_w.get("temperature"),
            "humidity": current_w.get("humidity"),
            "rainfall_24h": rainfall_24h,
            "rainfall_7d": rainfall_7d,
            "wind_speed": current_w.get("wind_speed"),
            "description": current_w.get("weather_description")
        }

        return prediction_result

ml_service = MLService()
