"""
Backend Application Configuration & Environment Settings.
"""

import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Weather & Landslide Risk Prediction Platform"
    API_V1_STR: str = "/api"
    
    # Environment Variables
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    WEATHER_API_PROVIDER: str = os.getenv("WEATHER_API_PROVIDER", "open-meteo")
    
    # Database URL: default to fast local SQLite, easily swapped to PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./landslide_platform.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Risk Classification Thresholds
    RISK_THRESHOLDS = {
        "LOW": (0.00, 0.20),
        "MODERATE": (0.20, 0.50),
        "HIGH": (0.50, 0.75),
        "VERY_HIGH": (0.75, 1.00)
    }

settings = Settings()
