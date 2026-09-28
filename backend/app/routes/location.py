"""
Location & Terrain Geocoding API Endpoints.
"""

import httpx
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from services.terrain_service import terrain_service

router = APIRouter(tags=["Location"])
http_client = httpx.AsyncClient(timeout=8.0)

@router.get("/location")
async def search_location(
    q: Optional[str] = Query(None, description="Search query string"),
    lat: Optional[float] = Query(None, description="Latitude for reverse geocoding"),
    lon: Optional[float] = Query(None, description="Longitude for reverse geocoding")
):
    # Reverse Geocoding
    if lat is not None and lon is not None:
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=14"
            headers = {"User-Agent": "WeatherLandslidePredictionPlatform/1.0"}
            res = await http_client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                display_name = data.get("display_name", f"Coordinates ({lat:.3f}, {lon:.3f})")
                address = data.get("address", {})
                city = address.get("city") or address.get("town") or address.get("village") or address.get("county") or address.get("state")
                return {
                    "latitude": lat,
                    "longitude": lon,
                    "display_name": display_name,
                    "city": city or "Unknown Location",
                    "country": address.get("country", "")
                }
        except Exception:
            pass
        return {
            "latitude": lat,
            "longitude": lon,
            "display_name": f"Location ({lat:.3f}, {lon:.3f})",
            "city": f"{lat:.3f}°, {lon:.3f}°",
            "country": ""
        }

    # Forward Geocoding Search
    if not q:
        raise HTTPException(status_code=400, detail="Must provide either search query 'q' or 'lat'/'lon'")

    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={q}&limit=5"
        headers = {"User-Agent": "WeatherLandslidePredictionPlatform/1.0"}
        res = await http_client.get(url, headers=headers)
        if res.status_code == 200:
            results = res.json()
            return [
                {
                    "name": item.get("display_name"),
                    "latitude": float(item.get("lat")),
                    "longitude": float(item.get("lon")),
                    "type": item.get("type", "place")
                }
                for item in results
            ]
    except Exception as e:
        # Static popular location suggestions as fallback
        pass

    popular_defaults = [
        {"name": "Shimla, Himachal Pradesh, India", "latitude": 31.1048, "longitude": 77.1734, "type": "city"},
        {"name": "Wayand, Kerala, India", "latitude": 11.6854, "longitude": 76.1320, "type": "region"},
        {"name": "Seattle, Washington, USA", "latitude": 47.6062, "longitude": -122.3321, "type": "city"},
        {"name": "Interlaken, Bern, Switzerland", "latitude": 46.6863, "longitude": 7.8632, "type": "city"},
        {"name": "Petrópolis, Rio de Janeiro, Brazil", "latitude": -22.5050, "longitude": -43.1789, "type": "city"}
    ]
    return [p for p in popular_defaults if q.lower() in p["name"].lower()] or popular_defaults[:3]

@router.get("/terrain")
async def get_terrain(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0)
):
    try:
        return await terrain_service.get_terrain_features(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate terrain features: {str(e)}")
