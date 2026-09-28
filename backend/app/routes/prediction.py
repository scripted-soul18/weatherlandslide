"""
Landslide Prediction & Risk Assessment API Routes.
Provides endpoint for multi-factor risk inference, spatial heatmap grid,
prediction timeline, and model validation transparency metrics.
"""

import json
import os
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional

from models.schemas import (
    LandslidePredictionRequest,
    LandslidePredictionResponse,
    RiskMapResponse,
    PredictionTimelineResponse
)
from services.ml_service import ml_service
from services.risk_map_service import risk_map_service
from services.timeline_service import timeline_service
from services.db_service import db_service

router = APIRouter(tags=["Landslide Prediction"])

ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))

@router.post("/predict-landslide", response_model=LandslidePredictionResponse)
async def predict_landslide(payload: LandslidePredictionRequest):
    """
    Executes multi-factor geotechnical + meteorological ML inference for the target coordinate.
    Calculates probability, categorizes risk tier, derives SHAP feature contributions,
    and logs prediction and alerts.
    """
    try:
        result = await ml_service.predict_for_location(
            latitude=payload.latitude,
            longitude=payload.longitude,
            override_rain_24h=payload.rainfall_24h,
            override_slope=payload.slope,
            override_soil_moisture=payload.soil_moisture
        )

        # Asynchronously log prediction to database
        try:
            await db_service.log_prediction(
                latitude=payload.latitude,
                longitude=payload.longitude,
                probability=result["landslide_probability"],
                risk_level=result["risk_level"],
                confidence=result["confidence"],
                rainfall_24h=result.get("weather_summary", {}).get("rainfall_24h", 0.0),
                factors=result.get("factors", [])
            )

            # If risk is elevated, log safety alert
            await db_service.log_alert_if_severe(
                latitude=payload.latitude,
                longitude=payload.longitude,
                risk_level=result["risk_level"],
                probability=result["landslide_probability"],
                factors=result.get("factors", []),
                disclaimer=result["disclaimer"]
            )
        except Exception as db_err:
            print(f"Non-critical DB logging warning: {db_err}")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Landslide prediction failed: {str(e)}")

@router.get("/risk-map", response_model=RiskMapResponse)
async def get_risk_map(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(12.0, ge=1.0, le=50.0),
    grid_size: int = Query(5, ge=3, le=7)
):
    """
    Generates spatial risk grid around coordinates for Leaflet heat circle/marker overlays.
    """
    try:
        return await risk_map_service.generate_risk_grid(
            center_lat=latitude,
            center_lon=longitude,
            radius_km=radius_km,
            grid_size=grid_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate risk grid: {str(e)}")

@router.get("/timeline", response_model=PredictionTimelineResponse)
async def get_timeline(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0)
):
    """
    Calculates future landslide risk trajectory across time horizons (+1h, +3h, +6h, +12h, +24h, +48h, +72h).
    """
    try:
        return await timeline_service.generate_timeline(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate timeline: {str(e)}")

@router.get("/model-metrics")
async def get_model_metrics():
    """
    Returns trained ML model performance metrics, Recall, ROC-AUC, and feature rankings.
    """
    metadata_path = os.path.join(ML_DIR, "metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            return json.load(f)
    return {
        "status": "Model metadata not yet generated",
        "best_model_name": "Gradient Boosting"
    }
