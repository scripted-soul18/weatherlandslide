"""
SQLAlchemy Database Models for Prediction Logs, Saved Locations, and Alerts.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictionLog(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    landslide_probability = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    rainfall_24h = Column(Float, default=0.0)
    features_json = Column(JSON, nullable=True)
    factors_json = Column(JSON, nullable=True)
    model_version = Column(String(100), default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)

class AlertLog(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    risk_level = Column(String(50), nullable=False)
    probability = Column(Float, nullable=False)
    factors_json = Column(JSON, nullable=True)
    disclaimer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
