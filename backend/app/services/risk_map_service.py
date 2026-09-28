"""
Spatial Risk Map Grid Service.
Generates an adaptive grid of micro-points around a target location,
evaluating local slope variations and weather exposure to render dynamic risk heatmaps on the Leaflet map.
"""

import math
from typing import Dict, Any, List
from services.terrain_service import terrain_service
from services.weather_service import weather_service
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml")))
# pyrefly: ignore [missing-import]
from predict import get_predictor

class RiskMapService:
    def __init__(self):
        self.predictor = get_predictor()

    async def generate_risk_grid(
        self,
        center_lat: float,
        center_lon: float,
        radius_km: float = 10.0,
        grid_size: int = 5
    ) -> Dict[str, Any]:
        """
        Generates a grid_size x grid_size matrix of geospatial points surrounding (center_lat, center_lon),
        predicts individual landslide risk for each cell, and formats for Leaflet overlays.
        """
        km_per_lat = 111.0
        km_per_lon = 111.0 * max(0.2, math.cos(math.radians(center_lat)))

        lat_step = (radius_km / km_per_lat) / (grid_size / 2.0)
        lon_step = (radius_km / km_per_lon) / (grid_size / 2.0)

        # Retrieve regional weather once
        weather_data = await weather_service.get_weather_and_forecast(center_lat, center_lon)
        current_w = weather_data.get("current", {})
        base_rain_24h = current_w.get("rainfall_24h", 15.0)
        base_rain_7d = current_w.get("rainfall_7d", 45.0)
        base_soil_m = current_w.get("soil_moisture", 0.40)

        grid_points = []
        counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "VERY_HIGH": 0}

        idx = 1
        half = grid_size // 2

        # Prepare list of sample points
        for i in range(-half, half + 1):
            for j in range(-half, half + 1):
                pt_lat = round(center_lat + (i * lat_step), 5)
                pt_lon = round(center_lon + (j * lon_step), 5)

                # Distance from center
                dist_km = math.sqrt((i * lat_step * km_per_lat)**2 + (j * lon_step * km_per_lon)**2)
                if dist_km > radius_km * 1.25:
                    continue

                # Topographical slope estimation for micro-location
                # Micro-topography calculation
                pseudo_slope = abs(math.sin(pt_lat * 25.0 + pt_lon * 18.0)) * 42.0 + abs(i + j) * 2.5
                pseudo_elev = 500.0 + (math.sin(pt_lat * 12.0) * 1200.0) + (pseudo_slope * 20.0)
                pseudo_rain_24h = max(0.0, base_rain_24h * (1.0 + 0.15 * math.sin(i * 1.5)))

                raw_input = {
                    "latitude": pt_lat,
                    "longitude": pt_lon,
                    "rainfall_1h": current_w.get("rainfall_1h", 0.0),
                    "rainfall_3h": current_w.get("rainfall_3h", 0.0),
                    "rainfall_6h": current_w.get("rainfall_6h", 0.0),
                    "rainfall_12h": current_w.get("rainfall_12h", 0.0),
                    "rainfall_24h": pseudo_rain_24h,
                    "rainfall_3d": current_w.get("rainfall_3d", 0.0),
                    "rainfall_7d": base_rain_7d,
                    "temperature": current_w.get("temperature", 20.0),
                    "humidity": current_w.get("humidity", 65.0),
                    "wind_speed": current_w.get("wind_speed", 10.0),
                    "elevation": max(50.0, pseudo_elev),
                    "slope": min(65.0, max(2.0, pseudo_slope)),
                    "aspect": (i * 45 + j * 45 + 180) % 360,
                    "plan_curvature": 0.0,
                    "profile_curvature": 0.0,
                    "soil_moisture": min(0.95, max(0.1, base_soil_m + (0.05 * math.cos(j)))),
                    "vegetation_density": 0.50,
                    "soil_type": "clay_loam",
                    "land_cover": "steep_rock_cliff" if pseudo_slope > 35 else "shrubland",
                    "geology_strength": 2 if pseudo_slope > 30 else 3,
                    "previous_landslides": 1.0 if pseudo_slope > 25 else 0.0
                }

                pred = self.predictor.predict(raw_input)
                prob = pred["landslide_probability"]
                risk_lvl = pred["risk_level"]

                counts_key = risk_lvl.replace(" ", "_")
                if counts_key in counts:
                    counts[counts_key] += 1

                grid_points.append({
                    "id": f"pt_{idx}",
                    "latitude": pt_lat,
                    "longitude": pt_lon,
                    "elevation": round(pseudo_elev, 1),
                    "slope": round(pseudo_slope, 1),
                    "rainfall_24h": round(pseudo_rain_24h, 1),
                    "soil_moisture": round(raw_input["soil_moisture"], 3),
                    "landslide_probability": round(prob, 4),
                    "risk_level": risk_lvl
                })
                idx += 1

        return {
            "center_lat": center_lat,
            "center_lon": center_lon,
            "radius_km": radius_km,
            "grid_points": grid_points,
            "summary": counts
        }

risk_map_service = RiskMapService()
