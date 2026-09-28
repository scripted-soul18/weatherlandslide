"""
Feature Engineering Module for Landslide Risk Prediction.
Extracts and computes multi-factor features from meteorological, topographical,
and environmental inputs according to scientific geotechnical principles.
"""

from typing import Dict, Any, List
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "rainfall_1h",
    "rainfall_3h",
    "rainfall_6h",
    "rainfall_12h",
    "rainfall_24h",
    "rainfall_3d",
    "rainfall_7d",
    "max_rainfall_intensity",
    "antecedent_rainfall_index",
    "temperature",
    "humidity",
    "wind_speed",
    "elevation",
    "slope",
    "aspect",
    "plan_curvature",
    "profile_curvature",
    "soil_moisture",
    "vegetation_density",
    "soil_type_code",
    "land_cover_code",
    "geology_strength",
    "previous_landslides"
]

SOIL_TYPE_MAP = {
    "clay": 0,
    "silty_clay": 1,
    "clay_loam": 2,
    "silt_loam": 3,
    "loam": 4,
    "sandy_loam": 5,
    "sand": 6,
    "gravel": 7,
    "rock": 8
}

LAND_COVER_MAP = {
    "dense_forest": 0,
    "sparse_forest": 1,
    "shrubland": 2,
    "grassland": 3,
    "cropland": 4,
    "barren_soil": 5,
    "settlement_urban": 6,
    "steep_rock_cliff": 7
}

def compute_antecedent_rainfall_index(daily_rain_history: List[float], decay_factor: float = 0.85) -> float:
    """
    Computes the Antecedent Precipitation Index (API / ARI).
    ARI = sum_{t=1}^n (decay_factor^t * rain_{t})
    Higher ARI represents accumulated subsurface water saturation.
    """
    if not daily_rain_history:
        return 0.0
    ari = 0.0
    for t, rain in enumerate(daily_rain_history, start=1):
        ari += (decay_factor ** t) * max(0.0, float(rain))
    return round(ari, 2)

def extract_features_from_dict(raw: Dict[str, Any]) -> pd.DataFrame:
    """
    Converts raw dictionary of location/weather/terrain inputs into a standardized feature DataFrame.
    """
    # Parse soil type & land cover to categorical codes
    soil_type = str(raw.get("soil_type", "clay_loam")).lower().replace(" ", "_")
    soil_code = SOIL_TYPE_MAP.get(soil_type, 2)

    land_cover = str(raw.get("land_cover", "shrubland")).lower().replace(" ", "_")
    land_cover_code = LAND_COVER_MAP.get(land_cover, 2)

    daily_history = raw.get("daily_rain_history", [
        raw.get("rainfall_24h", 0.0),
        raw.get("rainfall_3d", 0.0) / 3.0,
        raw.get("rainfall_7d", 0.0) / 7.0
    ])
    ari = raw.get("antecedent_rainfall_index")
    if ari is None:
        ari = compute_antecedent_rainfall_index(daily_history)

    max_intensity = raw.get("max_rainfall_intensity")
    if max_intensity is None:
        max_intensity = max(float(raw.get("rainfall_1h", 0.0)), float(raw.get("rainfall_3h", 0.0)) / 3.0)

    feature_dict = {
        "rainfall_1h": float(raw.get("rainfall_1h", 0.0)),
        "rainfall_3h": float(raw.get("rainfall_3h", 0.0)),
        "rainfall_6h": float(raw.get("rainfall_6h", 0.0)),
        "rainfall_12h": float(raw.get("rainfall_12h", 0.0)),
        "rainfall_24h": float(raw.get("rainfall_24h", 0.0)),
        "rainfall_3d": float(raw.get("rainfall_3d", 0.0)),
        "rainfall_7d": float(raw.get("rainfall_7d", 0.0)),
        "max_rainfall_intensity": float(max_intensity),
        "antecedent_rainfall_index": float(ari),
        "temperature": float(raw.get("temperature", 20.0)),
        "humidity": float(raw.get("humidity", 65.0)),
        "wind_speed": float(raw.get("wind_speed", 10.0)),
        "elevation": float(raw.get("elevation", 300.0)),
        "slope": float(raw.get("slope", 15.0)),
        "aspect": float(raw.get("aspect", 180.0)),
        "plan_curvature": float(raw.get("plan_curvature", 0.0)),
        "profile_curvature": float(raw.get("profile_curvature", 0.0)),
        "soil_moisture": float(raw.get("soil_moisture", 0.35)),
        "vegetation_density": float(raw.get("vegetation_density", 0.55)),
        "soil_type_code": int(soil_code),
        "land_cover_code": int(land_cover_code),
        "geology_strength": float(raw.get("geology_strength", 3.0)),
        "previous_landslides": float(raw.get("previous_landslides", 1.0))
    }

    return pd.DataFrame([feature_dict])[FEATURE_COLUMNS]
