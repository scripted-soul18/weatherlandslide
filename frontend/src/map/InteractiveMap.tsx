import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RiskGridPoint, RiskLevel } from '../types';
import { MapLegend } from './MapLegend';
import {
  Crosshair,
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Navigation,
  Layers,
  LocateFixed,
  Eye,
  EyeOff
} from 'lucide-react';

export type MapTileMode = 'satellite_hybrid' | 'terrain' | 'streets' | 'satellite_clean' | 'dark';

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  riskLevel: RiskLevel;
  landslideProbability: number;
  gridPoints: RiskGridPoint[];
  onSelectLocation: (lat: number, lon: number) => void;
  isLoading?: boolean;
}

const TILE_CONFIG: Record<
  MapTileMode,
  {
    url: string;
    subdomains: string[];
    maxZoom: number;
    maxNativeZoom?: number;
    attribution: string;
    label: string;
    category: 'satellite' | 'terrain' | 'streets' | 'dark';
  }
> = {
  satellite_hybrid: {
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Satellite',
    label: 'Google Satellite Hybrid',
    category: 'satellite',
  },
  satellite_clean: {
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Satellite Imagery',
    label: 'Google Satellite (Pure)',
    category: 'satellite',
  },
  terrain: {
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Terrain / Topo',
    label: 'Google Terrain (Topographic)',
    category: 'terrain',
  },
  streets: {
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Streets',
    label: 'Google Streets',
    category: 'streets',
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    maxZoom: 19,
    maxNativeZoom: 16,
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    label: 'Dark Canvas (Esri)',
    category: 'dark',
  },
};

const RISK_COLORS: Record<RiskLevel, { fill: string; stroke: string; glow: string }> = {
  LOW: { fill: '#10B981', stroke: '#059669', glow: 'rgba(16, 185, 129, 0.45)' },
  MODERATE: { fill: '#F59E0B', stroke: '#D97706', glow: 'rgba(245, 158, 11, 0.45)' },
  HIGH: { fill: '#F97316', stroke: '#EA580C', glow: 'rgba(249, 115, 22, 0.55)' },
  'VERY HIGH': { fill: '#EF4444', stroke: '#DC2626', glow: 'rgba(239, 68, 68, 0.65)' },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  riskLevel,
  landslideProbability,
  gridPoints,
  onSelectLocation,
  isLoading = false,
}) => {
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const gridLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Default to Google Satellite Hybrid for vivid satellite realism
  const [activeTile, setActiveTile] = useState<MapTileMode>('satellite_hybrid');
  const [showRiskGrid, setShowRiskGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      maxZoom: 20,
    });

    const cfg = TILE_CONFIG[activeTile];
    const tileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      maxNativeZoom: cfg.maxNativeZoom || cfg.maxZoom,
      subdomains: cfg.subdomains,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    gridLayerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      onSelectLocation(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    });

    // Invalidate size on mount after layout stabilizes
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Base Tile Layer dynamically
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const cfg = TILE_CONFIG[activeTile];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      maxNativeZoom: cfg.maxNativeZoom || cfg.maxZoom,
      subdomains: cfg.subdomains,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;

    // Bring risk grid overlay to front if present
    if (gridLayerGroupRef.current) {
      gridLayerGroupRef.current.eachLayer((layer: any) => {
        if (layer.bringToFront) layer.bringToFront();
      });
    }
  }, [activeTile]);

  // Update Map Position & Main Target Pin
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.flyTo([latitude, longitude], map.getZoom() < 10 ? 11 : map.getZoom(), {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    const colorConfig = RISK_COLORS[riskLevel] || RISK_COLORS.LOW;

    // Custom Glowing SVG Pin Icon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 46px; height: 46px;">
          <div style="
            position: absolute;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: ${colorConfig.glow};
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: relative;
            z-index: 10;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: ${colorConfig.fill};
            border: 3px solid #ffffff;
            box-shadow: 0 0 16px ${colorConfig.fill}, 0 2px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(customIcon);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    }

    markerRef.current.bindPopup(`
      <div style="padding: 6px; font-family: Inter, sans-serif; font-size: 12px; min-width: 150px;">
        <div style="font-weight: 800; color: ${colorConfig.stroke}; font-size: 13px; margin-bottom: 2px;">
          ${riskLevel} RISK (${(landslideProbability * 100).toFixed(1)}%)
        </div>
        <div style="font-family: monospace; font-size: 11px; opacity: 0.85;">
          Lat: <strong>${latitude.toFixed(4)}°</strong><br/>
          Lon: <strong>${longitude.toFixed(4)}°</strong>
        </div>
      </div>
    `);
  }, [latitude, longitude, riskLevel, landslideProbability]);

  // Update Spatial Risk Grid Overlays
  useEffect(() => {
    if (!gridLayerGroupRef.current) return;
    gridLayerGroupRef.current.clearLayers();

    if (!showRiskGrid || !gridPoints || gridPoints.length === 0) return;

    gridPoints.forEach((pt) => {
      const colorConfig = RISK_COLORS[pt.risk_level] || RISK_COLORS.LOW;

      const circleMarker = L.circleMarker([pt.latitude, pt.longitude], {
        radius: 12 + pt.landslide_probability * 12,
        fillColor: colorConfig.fill,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.5 + pt.landslide_probability * 0.35,
      });

      circleMarker.bindTooltip(
        `
        <div style="font-family: sans-serif; font-size: 11px; line-height: 1.45;">
          <strong style="color: ${colorConfig.stroke}; font-size: 12px;">${pt.risk_level} RISK</strong><br/>
          <strong>Probability:</strong> ${(pt.landslide_probability * 100).toFixed(1)}%<br/>
          <strong>Slope:</strong> ${pt.slope}° | <strong>Elevation:</strong> ${pt.elevation}m<br/>
          <strong>24h Rainfall:</strong> ${pt.rainfall_24h}mm<br/>
          <span style="opacity: 0.7; font-size: 10px;">Click to set as focus target</span>
        </div>
      `,
        { direction: 'top', offset: [0, -10] }
      );

      circleMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectLocation(pt.latitude, pt.longitude);
      });

      gridLayerGroupRef.current?.addLayer(circleMarker);
    });
  }, [gridPoints, showRiskGrid]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!containerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      containerWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => mapRef.current?.invalidateSize(), 300);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => mapRef.current?.invalidateSize(), 300);
      });
    }
  };

  // Recenter on target
  const handleRecenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([latitude, longitude], 13, { duration: 1 });
  };

  // Locate User GPS
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = Number(pos.coords.latitude.toFixed(5));
          const uLon = Number(pos.coords.longitude.toFixed(5));
          onSelectLocation(uLat, uLon);
          mapRef.current?.flyTo([uLat, uLon], 14, { duration: 1.2 });
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }
  };

  return (
    <div
      ref={containerWrapperRef}
      className={`relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl glass-panel group transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-[2000] rounded-none' : ''
      }`}
    >
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" id="interactive-leaflet-map" />

      {/* Top Left: Interactive Instructions Badge */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 pointer-events-none">
        <div className="glass-panel px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700/60 shadow-lg flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 pointer-events-auto">
          <Crosshair className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          <span className="font-medium">Click map to evaluate point risk</span>
        </div>
      </div>

      {/* Top Right: Layer Switcher & Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        {/* Layer Selector Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-md transition-all active:scale-95"
            title="Change Map Satellite / Terrain / Streets Mode"
          >
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">{TILE_CONFIG[activeTile].label.split(' ')[1] || 'Satellite'}</span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-[1100] space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                Base Imagery & Maps
              </div>

              {(Object.keys(TILE_CONFIG) as MapTileMode[]).map((mode) => {
                const item = TILE_CONFIG[mode];
                const isActive = activeTile === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      setActiveTile(mode);
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-white font-bold shadow-sm'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Map Action Stack */}
        <div className="flex flex-col gap-1.5 bg-white/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleRecenter}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-all active:scale-95"
            title="Recenter on Target Pin"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          <button
            onClick={handleLocateMe}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-all active:scale-95"
            title="Use My GPS Location"
          >
            <Navigation className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Map Legend Overlay */}
      <MapLegend
        tileLayer={activeTile}
        onTileChange={setActiveTile}
        showRiskGrid={showRiskGrid}
        onToggleRiskGrid={() => setShowRiskGrid(!showRiskGrid)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-sm z-[1100] flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 gap-3">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wide bg-white/80 dark:bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg">
            Evaluating terrain & meteorology...
          </span>
        </div>
      )}
    </div>
  );
};

