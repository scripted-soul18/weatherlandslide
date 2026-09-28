"""
Weather API Endpoints.
Provides current weather, hourly meteo metrics, and 7-day forecast.
"""

from fastapi import APIRouter, Query, HTTPException
from models.schemas import WeatherForecastResponse
from services.weather_service import weather_service

router = APIRouter(tags=["Weather"])

@router.get("/weather", response_model=WeatherForecastResponse)
async def get_weather(
    latitude: float = Query(..., description="Latitude coordinate", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Longitude coordinate", ge=-180.0, le=180.0)
):
    try:
        data = await weather_service.get_weather_and_forecast(latitude, longitude)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve weather data: {str(e)}")

@router.get("/forecast", response_model=WeatherForecastResponse)
async def get_forecast(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0)
):
    return await get_weather(latitude=latitude, longitude=longitude)
