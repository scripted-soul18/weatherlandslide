"""
History, Saved Locations, and Alerts API Routes.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import (
    SavedLocationCreate,
    SavedLocationItem,
    PredictionHistoryItem,
    AlertItem
)
from services.db_service import db_service

router = APIRouter(tags=["History & Alerts"])

@router.get("/saved-locations", response_model=List[SavedLocationItem])
async def list_saved_locations():
    items = await db_service.get_saved_locations()
    return [
        {
            "id": item.id,
            "name": item.name,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "notes": item.notes,
            "created_at": item.created_at.isoformat() if item.created_at else ""
        }
        for item in items
    ]

@router.post("/saved-locations", response_model=SavedLocationItem)
async def create_saved_location(payload: SavedLocationCreate):
    item = await db_service.save_location(
        name=payload.name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        notes=payload.notes
    )
    return {
        "id": item.id,
        "name": item.name,
        "latitude": item.latitude,
        "longitude": item.longitude,
        "notes": item.notes,
        "created_at": item.created_at.isoformat() if item.created_at else ""
    }

@router.get("/history", response_model=List[PredictionHistoryItem])
async def get_prediction_history():
    items = await db_service.get_recent_predictions(limit=25)
    return [
        {
            "id": item.id,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "location_name": item.location_name,
            "landslide_probability": item.landslide_probability,
            "risk_level": item.risk_level,
            "confidence": item.confidence,
            "rainfall_24h": item.rainfall_24h or 0.0,
            "timestamp": item.created_at.isoformat() if item.created_at else ""
        }
        for item in items
    ]

@router.get("/alerts", response_model=List[AlertItem])
async def get_safety_alerts():
    items = await db_service.get_recent_alerts(limit=15)
    return [
        {
            "id": item.id,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "location_name": item.location_name,
            "risk_level": item.risk_level,
            "probability": item.probability,
            "factors": item.factors_json or [],
            "disclaimer": item.disclaimer,
            "created_at": item.created_at.isoformat() if item.created_at else ""
        }
        for item in items
    ]
