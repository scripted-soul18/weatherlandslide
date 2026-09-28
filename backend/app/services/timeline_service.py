"""
Prediction Timeline Forecast Service.
Computes landslide risk evolution across time horizons (Now, +1h, +3h, +6h, +12h, +24h, +48h, +72h)
by simulating cumulative rainfall infiltration and soil saturation dynamics.
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from services.weather_service import weather_service
from services.terrain_service import terrain_service
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml")))
# pyrefly: ignore [missing-import]
from predict import get_predictor

class TimelineService:
    def __init__(self):
        self.predictor = get_predictor()

    async def generate_timeline(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Generates risk predictions for standard horizons (+0h to +72h).
        """
        weather_data = await weather_service.get_weather_and_forecast(latitude, longitude)
        terrain_data = await terrain_service.get_terrain_features(latitude, longitude)

        hourly_forecast = weather_data.get("hourly", [])
        current_w = weather_data.get("current", {})

        horizons = [
            ("Now", 0),
            ("+1 hour", 1),
            ("+3 hours", 3),
            ("+6 hours", 6),
            ("+12 hours", 12),
            ("+24 hours", 24),
            ("+48 hours", 48),
            ("+72 hours", 72)
        ]

        now = datetime.utcnow()
        timeline_items = []

        base_rain_24h = current_w.get("rainfall_24h", 0.0)
        base_soil_m = current_w.get("soil_moisture", 0.35)
        slope = terrain_data.get("slope", 15.0)

        accumulated_forecast_rain = 0.0

        for label, h_offset in horizons:
            timestamp = (now + timedelta(hours=h_offset)).strftime("%Y-%m-%d %H:%M")

            if h_offset == 0:
                h_temp = current_w.get("temperature", 20.0)
                h_humidity = current_w.get("humidity", 65.0)
                h_rain = current_w.get("rainfall_1h", 0.0)
                effective_24h_rain = base_rain_24h
                effective_soil_m = base_soil_m
            else:
                # Sum forecast precipitation up to this offset
                interval_rain = sum(
                    item.get("rainfall", 0.0)
                    for item in hourly_forecast[:min(len(hourly_forecast), h_offset)]
                )
                accumulated_forecast_rain = interval_rain

                # Forecast weather slice
                target_item = hourly_forecast[min(len(hourly_forecast) - 1, h_offset)] if hourly_forecast else {}
                h_temp = target_item.get("temperature", current_w.get("temperature", 20.0))
                h_humidity = target_item.get("humidity", current_w.get("humidity", 65.0))
                h_rain = target_item.get("rainfall", 0.0)

                # Simulated cumulative rolling 24h rain + progressive soil saturation
                effective_24h_rain = base_rain_24h + accumulated_forecast_rain
                saturation_gain = (accumulated_forecast_rain / 120.0) * 0.4
                effective_soil_m = min(0.95, base_soil_m + saturation_gain)

            raw_input = {
                "latitude": latitude,
                "longitude": longitude,
                "rainfall_1h": h_rain,
                "rainfall_3h": h_rain * 2.0,
                "rainfall_6h": min(effective_24h_rain, h_rain * 4.0),
                "rainfall_12h": min(effective_24h_rain, h_rain * 7.0),
                "rainfall_24h": effective_24h_rain,
                "rainfall_3d": current_w.get("rainfall_3d", 0.0) + accumulated_forecast_rain,
                "rainfall_7d": current_w.get("rainfall_7d", 0.0) + accumulated_forecast_rain,
                "temperature": h_temp,
                "humidity": h_humidity,
                "wind_speed": current_w.get("wind_speed", 10.0),
                "elevation": terrain_data.get("elevation", 300.0),
                "slope": slope,
                "aspect": terrain_data.get("aspect", 180.0),
                "plan_curvature": terrain_data.get("plan_curvature", 0.0),
                "profile_curvature": terrain_data.get("profile_curvature", 0.0),
                "soil_moisture": effective_soil_m,
                "vegetation_density": terrain_data.get("vegetation_density", 0.55),
                "soil_type": terrain_data.get("soil_type", "clay_loam"),
                "land_cover": terrain_data.get("land_cover", "shrubland"),
                "geology_strength": terrain_data.get("geology_strength", 3),
                "previous_landslides": 1.0 if slope > 22.0 else 0.0
            }

            pred = self.predictor.predict(raw_input)

            timeline_items.append({
                "time_offset": label,
                "hours_from_now": h_offset,
                "timestamp": timestamp,
                "rainfall_mm": round(h_rain, 2),
                "cumulative_rainfall_mm": round(effective_24h_rain, 2),
                "temperature": round(h_temp, 1),
                "humidity": round(h_humidity, 1),
                "soil_moisture": round(effective_soil_m, 3),
                "landslide_probability": pred["landslide_probability"],
                "risk_level": pred["risk_level"]
            })

        return {
            "latitude": latitude,
            "longitude": longitude,
            "timeline": timeline_items
        }

timeline_service = TimelineService()
