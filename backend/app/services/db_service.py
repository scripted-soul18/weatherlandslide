"""
Database Service Layer.
Manages asynchronous database connection, schema initialization,
and CRUD operations for Saved Locations, Prediction Logs, and Alerts.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from models.db_models import Base, SavedLocation, PredictionLog, AlertLog
from config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class DBService:
    async def init_db(self):
        """Creates database tables if they do not exist."""
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database schema initialized successfully.")

    async def log_prediction(
        self,
        latitude: float,
        longitude: float,
        probability: float,
        risk_level: str,
        confidence: float,
        rainfall_24h: float = 0.0,
        factors: List[str] = None,
        location_name: Optional[str] = None
    ) -> PredictionLog:
        async with async_session() as session:
            async with session.begin():
                log = PredictionLog(
                    latitude=latitude,
                    longitude=longitude,
                    location_name=location_name,
                    landslide_probability=probability,
                    risk_level=risk_level,
                    confidence=confidence,
                    rainfall_24h=rainfall_24h,
                    factors_json=factors or [],
                    model_version="Gradient Boosting v1.0"
                )
                session.add(log)
            await session.commit()
            return log

    async def log_alert_if_severe(
        self,
        latitude: float,
        longitude: float,
        risk_level: str,
        probability: float,
        factors: List[str],
        disclaimer: str,
        location_name: Optional[str] = None
    ) -> Optional[AlertLog]:
        if risk_level in ["HIGH", "VERY HIGH"]:
            async with async_session() as session:
                async with session.begin():
                    alert = AlertLog(
                        latitude=latitude,
                        longitude=longitude,
                        location_name=location_name,
                        risk_level=risk_level,
                        probability=probability,
                        factors_json=factors,
                        disclaimer=disclaimer
                    )
                    session.add(alert)
                await session.commit()
                return alert
        return None

    async def get_recent_predictions(self, limit: int = 20) -> List[PredictionLog]:
        async with async_session() as session:
            stmt = select(PredictionLog).order_by(PredictionLog.created_at.desc()).limit(limit)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def get_recent_alerts(self, limit: int = 10) -> List[AlertLog]:
        async with async_session() as session:
            stmt = select(AlertLog).order_by(AlertLog.created_at.desc()).limit(limit)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def save_location(self, name: str, latitude: float, longitude: float, notes: Optional[str] = None) -> SavedLocation:
        async with async_session() as session:
            async with session.begin():
                loc = SavedLocation(name=name, latitude=latitude, longitude=longitude, notes=notes)
                session.add(loc)
            await session.commit()
            return loc

    async def get_saved_locations(self) -> List[SavedLocation]:
        async with async_session() as session:
            stmt = select(SavedLocation).order_by(SavedLocation.created_at.desc())
            result = await session.execute(stmt)
            return result.scalars().all()

db_service = DBService()
