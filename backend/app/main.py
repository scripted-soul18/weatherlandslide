"""
Main FastAPI Application Entrypoint.
Provides unified REST APIs for weather forecasting, multi-factor landslide prediction,
spatial risk maps, Explainable AI (SHAP), and user location histories.
"""

import sys
import os
import time

# Auto-inject backend/app and ml directory paths into sys.path
# This ensures imports always work whether run from project root or backend/app directory
APP_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(APP_DIR, "..", ".."))
ML_DIR = os.path.join(PROJECT_ROOT, "ml")

for p in [APP_DIR, ML_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from config import settings
from services.db_service import db_service
from routes.weather import router as weather_router
from routes.location import router as location_router
from routes.prediction import router as prediction_router
from routes.history import router as history_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack Weather Forecast & Multi-Factor Landslide Risk Assessment Platform with Explainable AI (SHAP).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Hook
@app.on_event("startup")
async def startup_event():
    print(f"Starting {settings.PROJECT_NAME}...")
    await db_service.init_db()
    # Pre-warm ML Predictor
    from predict import get_predictor
    predictor = get_predictor()
    print(f"ML Model Loaded: {predictor.metadata.get('best_model_name', 'Ensemble')}")

# Request timing / simple rate limit logging
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

FRONTEND_DIST = os.path.abspath(os.path.join(PROJECT_ROOT, "frontend", "dist"))

# Include Sub-Routers with /api prefix
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(location_router, prefix=settings.API_V1_STR)
app.include_router(prediction_router, prefix=settings.API_V1_STR)
app.include_router(history_router, prefix=settings.API_V1_STR)

# Also expose without /api prefix for direct endpoint access
app.include_router(weather_router)
app.include_router(location_router)
app.include_router(prediction_router)
app.include_router(history_router)

# Mount frontend assets and SPA routes if built
if os.path.exists(FRONTEND_DIST) and os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_or_static(full_path: str):
        # Exclude API and Docs paths
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json"]:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "version": "1.0.0",
            "endpoints": {
                "weather": "/api/weather?latitude=23.054&longitude=79.783",
                "predict_landslide": "POST /api/predict-landslide",
                "risk_map": "/api/risk-map?latitude=23.054&longitude=79.783",
                "timeline": "/api/timeline?latitude=23.054&longitude=79.783",
                "model_metrics": "/api/model-metrics",
                "docs": "/docs"
            }
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

