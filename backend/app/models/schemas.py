"""
Pydantic Schemas for Request & Response Data Validation.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# --- Location Schemas ---
class LocationQuery(BaseModel):
    query: str

class LocationInfo(BaseModel):
    latitude: float
    longitude: float
    name: Optional[str] = None
    country: Optional[str] = None
    elevation: Optional[float] = None
    slope: Optional[float] = None

# --- Weather Schemas ---
class CurrentWeather(BaseModel):
    temperature: float = Field(..., description="Current temperature in Celsius")
    rainfall_1h: float = Field(0.0, description="Precipitation in last hour (mm)")
    rainfall_3h: float = Field(0.0, description="Precipitation in last 3 hours (mm)")
    rainfall_6h: float = Field(0.0, description="Precipitation in last 6 hours (mm)")
    rainfall_12h: float = Field(0.0, description="Precipitation in last 12 hours (mm)")
    rainfall_24h: float = Field(0.0, description="Precipitation in last 24 hours (mm)")
    rainfall_3d: float = Field(0.0, description="Precipitation in last 3 days (mm)")
    rainfall_7d: float = Field(0.0, description="Precipitation in last 7 days (mm)")
    humidity: float = Field(..., description="Relative humidity percentage")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    wind_direction: float = Field(0.0, description="Wind direction in degrees")
    pressure: float = Field(1013.25, description="Surface atmospheric pressure (hPa)")
    soil_moisture: float = Field(0.35, description="Volumetric soil moisture (0-1 m³/m³)")
    weather_code: int = 0
    weather_description: str = "Clear"
    timestamp: str

class HourlyForecastItem(BaseModel):
    time: str
    temperature: float
    rainfall: float
    humidity: float
    wind_speed: float
    wind_direction: float
    pressure: float
    soil_moisture: float

class DailyForecastItem(BaseModel):
    date: str
    max_temp: float
    min_temp: float
    total_rainfall: float
    weather_code: int
    weather_description: str

class WeatherForecastResponse(BaseModel):
    latitude: float
    longitude: float
    elevation: float
    location_name: Optional[str] = None
    current: CurrentWeather
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]

# --- Terrain Schemas ---
class TerrainInfo(BaseModel):
    latitude: float
    longitude: float
    elevation: float
    slope: float
    aspect: float
    plan_curvature: float
    profile_curvature: float
    soil_type: str
    land_cover: str
    geology_strength: int
    vegetation_density: float
    data_limitations: List[str] = []

# --- Landslide Prediction Schemas ---
class LandslidePredictionRequest(BaseModel):
    latitude: float
    longitude: float
    rainfall_1h: Optional[float] = None
    rainfall_24h: Optional[float] = None
    rainfall_7d: Optional[float] = None
    slope: Optional[float] = None
    soil_moisture: Optional[float] = None

class SHAPContribution(BaseModel):
    feature: str
    label: str
    contribution_pct: float
    value: float

class LandslidePredictionResponse(BaseModel):
    latitude: float
    longitude: float
    landslide_probability: float
    risk_level: str  # "LOW", "MODERATE", "HIGH", "VERY HIGH"
    confidence: float
    factors: List[str]
    shap_contributions: List[SHAPContribution]
    feature_breakdown: Dict[str, float]
    model_version: str
    disclaimer: str
    timestamp: str
    terrain: Optional[TerrainInfo] = None
    weather_summary: Optional[Dict[str, Any]] = None

# --- Spatial Risk Map Grid Schemas ---
class RiskGridPoint(BaseModel):
    id: str
    latitude: float
    longitude: float
    elevation: float
    slope: float
    rainfall_24h: float
    soil_moisture: float
    landslide_probability: float
    risk_level: str

class RiskMapResponse(BaseModel):
    center_lat: float
    center_lon: float
    radius_km: float
    grid_points: List[RiskGridPoint]
    summary: Dict[str, int]

# --- Prediction Timeline Schemas ---
class TimelineHorizonItem(BaseModel):
    time_offset: str  # "Now", "+1h", "+3h", "+6h", "+12h", "+24h", "+48h", "+72h"
    hours_from_now: int
    timestamp: str
    rainfall_mm: float
    cumulative_rainfall_mm: float
    temperature: float
    humidity: float
    soil_moisture: float
    landslide_probability: float
    risk_level: str

class PredictionTimelineResponse(BaseModel):
    latitude: float
    longitude: float
    timeline: List[TimelineHorizonItem]

# --- Database & History Schemas ---
class SavedLocationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    notes: Optional[str] = None

class SavedLocationItem(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    notes: Optional[str] = None
    created_at: str

class PredictionHistoryItem(BaseModel):
    id: int
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    landslide_probability: float
    risk_level: str
    confidence: float
    rainfall_24h: float
    timestamp: str

class AlertItem(BaseModel):
    id: int
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    risk_level: str
    probability: float
    factors: List[str]
    disclaimer: str
    created_at: str
