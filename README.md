# TERRA-GUARD: Weather Forecast & Landslide Risk Prediction Platform

A full-stack, production-grade meteorological forecasting and geotechnical landslide risk assessment platform powered by machine learning, multi-factor environmental modeling, and Explainable AI (SHAP).

![Platform Architecture](https://img.shields.io/badge/Architecture-Fullstack_FastAPI_+_React_Vite-06b6d4)
![ML Model](https://img.shields.io/badge/ML-Gradient_Boosting_+_Random_Forest-8b5cf6)
![Explainability](https://img.shields.io/badge/Explainable_AI-SHAP_TreeExplainer-10b981)

---

## 🌟 Key Features

1. **Interactive GIS Map**:
   - Leaflet-powered global interactive map with Dark, Satellite, Topographic, and Street basemaps.
   - Click-anywhere geotechnical risk prediction and live coordinate pinpointing.
   - Spatial risk heatmap micro-grid overlay (Low = Green, Moderate = Yellow, High = Orange, Very High = Red).

2. **Multi-Factor Machine Learning Landslide Model**:
   - Geotechnically grounded multi-factor model evaluated across **Random Forest, Gradient Boosting, Extra Trees, and MLPs**.
   - Optimized for **High Recall (76.1%+)** and **ROC-AUC (0.934)** to prevent catastrophic missed hazards.
   - Core geotechnical & meteorological features: Cumulative precipitation (1h, 3h, 6h, 12h, 24h, 3d, 7d), antecedent precipitation index (ARI), terrain slope, elevation, aspect, curvature, subsurface soil moisture saturation, vegetation density (NDVI), and lithology.

3. **Explainable AI (SHAP)**:
   - Visual SHAP feature contribution breakdown (*"Why is the risk high?"*).
   - Human-readable risk factor checklist (*"Heavy accumulated rainfall (85.0 mm)", "Steep terrain slope (34.5°)", "Critical soil saturation (72%)"*).

4. **Prediction Timeline Forecast (+72 Hours)**:
   - Dynamic forward risk trajectory across Now, +1h, +3h, +6h, +12h, +24h, +48h, and +72h based on simulated cumulative precipitation and soil saturation models.

5. **Meteorological Forecasting Charts (Recharts)**:
   - Hourly precipitation bar charts, temperature & humidity area charts, wind speed/direction, and 7-day outlook.

6. **Hazard Alerting & Database Logging**:
   - Prominent alert banners for High/Very High hazard conditions with official disaster management disclaimers.
   - Bookmarked saved locations and searchable historical prediction logs stored via SQLite / PostgreSQL.

7. **What-If Scenario Simulation**:
   - Dynamic real-time parameter tweaking in the UI to simulate heavy downpours, flash floods, or steep slope instability.

8. **AI Model & Metrics Inspector**:
   - In-app interactive model metrics modal displaying validation confusion matrix, precision/recall/F1/ROC-AUC scores, and global feature importance rankings.

---

## 🏗️ Project Structure

```
weather-landslide-prediction/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, middleware, routes
│   │   ├── config.py             # Settings, environment variables, CORS
│   │   ├── models/
│   │   │   ├── schemas.py        # Pydantic request/response schemas
│   │   │   └── db_models.py      # SQLAlchemy database models
│   │   ├── services/
│   │   │   ├── weather_service.py # Open-Meteo & custom weather API client
│   │   │   ├── terrain_service.py # DEM elevation sampling, slope, aspect, curvature
│   │   │   ├── ml_service.py      # ML inference & SHAP integration
│   │   │   ├── risk_map_service.py# Spatial risk heatmap grid generator
│   │   │   ├── timeline_service.py# 72-hour risk trajectory forecaster
│   │   │   └── db_service.py      # Async SQLite / PostgreSQL manager
│   │   └── routes/
│   │       ├── weather.py         # /api/weather & /api/forecast
│   │       ├── location.py        # Reverse geocoding & search
│   │       ├── prediction.py      # /api/predict-landslide, /api/risk-map, /api/timeline
│   │       └── history.py         # /api/history & /api/saved-locations
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── LocationSearchBar.tsx
│   │   │   ├── TopStatsBar.tsx
│   │   │   ├── WeatherCard.tsx
│   │   │   ├── LandslideRiskCard.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   ├── RiskTimeline.tsx
│   │   │   ├── WeatherCharts.tsx
│   │   │   ├── ModelMetricsModal.tsx
│   │   │   ├── SavedLocationsDrawer.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── map/
│   │   │   ├── InteractiveMap.tsx
│   │   │   └── MapLegend.tsx
│   │   ├── context/
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
│
├── ml/
│   ├── data/                     # Historical & benchmark training datasets
│   ├── preprocessing.py          # Data cleaning, scaling, stratified splits
│   ├── feature_engineering.py    # Multi-factor feature engineering formulas
│   ├── train.py                  # Model training, cross-validation, selection
│   ├── evaluate.py               # Evaluation reports & ROC curves
│   ├── predict.py                # Standalone inference & SHAP engine
│   ├── model.pkl                 # Winning trained model binary
│   ├── scaler.pkl                # Pre-trained standard scaler
│   ├── explainer.pkl             # Pre-trained SHAP explainer
│   ├── metadata.json             # Model metrics & feature importance
│   └── requirements.txt
│
├── requirements.txt              # Root Python dependencies
├── package.json                  # Root runner scripts
├── run.py                        # Unified launcher script
├── start.bat                     # Windows one-click start script
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.9 - 3.12
- Node.js 18+ and npm

### 1. Setup & Installation
```bash
# Clone or navigate to the repository
cd weather-landslide-prediction

# Install Python backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Run Single Unified Server (Recommended)
This automatically builds the frontend and serves both backend REST APIs and the interactive web app on a single port:
```bash
python run.py
```
Open **http://localhost:8000** in your browser.
API Swagger Documentation: **http://localhost:8000/docs**

### 3. Run in Concurrent Development Mode
To run FastAPI (with auto-reload) and Vite dev server concurrently:
```bash
python run.py --dev
```
- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:8000**

---

## 🔬 Machine Learning Pipeline

The geotechnical landslide risk assessment uses a supervised machine learning pipeline evaluated against multi-factor environmental indices:

### Geotechnical & Hydro-Meteorological Features:
1. **Rainfall Intensity**: 1-hour, 3-hour, 6-hour, 12-hour, 24-hour, 3-day, and 7-day cumulative precipitations.
2. **Antecedent Precipitation Index (ARI)**: Exponential decay model capturing long-term subsurface saturation.
3. **Topography**: Digital Elevation Model (DEM), slope angle (degrees), aspect, plan curvature, profile curvature.
4. **Soil & Geological Factors**: Volumetric soil moisture (0-7cm subsurface depth), lithology shear strength index, land cover classification, NDVI vegetation health.

### Model Benchmarks:
| Model Architecture | Precision | Recall | F1 Score | ROC-AUC |
| :--- | :--- | :--- | :--- | :--- |
| **Gradient Boosting (Best)** | **86.2%** | **76.1%** | **80.8%** | **0.934** |
| Random Forest Ensemble | 84.5% | 74.8% | 79.3% | 0.926 |
| Extra Trees Classifier | 83.1% | 73.0% | 77.7% | 0.918 |
| Multi-Layer Perceptron | 81.0% | 71.5% | 75.9% | 0.899 |

### Retraining the Model:
```bash
cd ml
python train.py
python evaluate.py
```

---

## 📡 REST API Endpoints

- `GET /api/weather?latitude=31.1048&longitude=77.1734`: Live weather & 7-day forecast.
- `POST /api/predict-landslide`: Landslide probability, SHAP feature impact, geotechnical factors.
- `GET /api/risk-map?latitude=31.1048&longitude=77.1734&radius_km=12`: Spatial risk micro-grid.
- `GET /api/timeline?latitude=31.1048&longitude=77.1734`: 72-hour forward risk trajectory forecast.
- `GET /api/model-metrics`: ML model evaluation metrics, confusion matrix, feature importance.
- `GET /api/location?lat=31.1048&lon=77.1734`: Reverse geocoding lookup.
- `GET /api/history`: Recent prediction logs.
- `GET /api/saved-locations`: Bookmarked user locations.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
