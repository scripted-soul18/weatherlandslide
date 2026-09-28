import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TopStatsBar } from './components/TopStatsBar';
import { WeatherCard } from './components/WeatherCard';
import { LandslideRiskCard } from './components/LandslideRiskCard';
import { AlertBanner } from './components/AlertBanner';
import { RiskTimeline } from './components/RiskTimeline';
import { WeatherCharts } from './components/WeatherCharts';
import { ModelMetricsModal } from './components/ModelMetricsModal';
import { SavedLocationsDrawer } from './components/SavedLocationsDrawer';
import { InteractiveMap } from './map/InteractiveMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import {
  WeatherForecastResponse,
  LandslidePredictionResponse,
  RiskMapResponse,
  PredictionTimelineResponse,
  AlertItem
} from './types';
import {
  fetchWeather,
  predictLandslide,
  fetchRiskMap,
  fetchTimeline,
  fetchLocationName,
  fetchAlerts
} from './services/api';

// Initial default location: Shimla (Mountainous terrain)
const DEFAULT_LAT = 31.1048;
const DEFAULT_LON = 77.1734;
const DEFAULT_NAME = 'Shimla, Himachal Pradesh, India';

function DashboardContent() {
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lon, setLon] = useState<number>(DEFAULT_LON);
  const [locationName, setLocationName] = useState<string>(DEFAULT_NAME);

  const [weatherData, setWeatherData] = useState<WeatherForecastResponse | null>(null);
  const [predictionData, setPredictionData] = useState<LandslidePredictionResponse | null>(null);
  const [riskMapData, setRiskMapData] = useState<RiskMapResponse | null>(null);
  const [timelineData, setTimelineData] = useState<PredictionTimelineResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavedOpen, setIsSavedOpen] = useState<boolean>(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);

  // Load all data for target coordinates
  const loadDataForLocation = useCallback(
    async (
      targetLat: number,
      targetLon: number,
      nameOverride?: string,
      customSimParams?: { rainfall_24h?: number; slope?: number; soil_moisture?: number }
    ) => {
      setIsLoading(true);
      setIsAlertDismissed(false);

      try {
        // Parallel fetch of weather, landslide prediction, spatial risk map, timeline, and reverse geocoding
        const [wData, pData, rData, tData, locInfo, activeAlerts] = await Promise.all([
          fetchWeather(targetLat, targetLon).catch(() => null),
          predictLandslide({
            latitude: targetLat,
            longitude: targetLon,
            ...customSimParams,
          }).catch(() => null),
          fetchRiskMap(targetLat, targetLon).catch(() => null),
          fetchTimeline(targetLat, targetLon).catch(() => null),
          nameOverride ? Promise.resolve({ display_name: nameOverride }) : fetchLocationName(targetLat, targetLon).catch(() => null),
          fetchAlerts().catch(() => []),
        ]);

        if (wData) setWeatherData(wData);
        if (pData) setPredictionData(pData);
        if (rData) setRiskMapData(rData);
        if (tData) setTimelineData(tData);
        if (nameOverride) {
          setLocationName(nameOverride);
        } else if (locInfo?.display_name) {
          setLocationName(locInfo.display_name);
        }
        setAlerts(activeAlerts || []);
      } catch (err) {
        console.error('Failed to load weather analysis data:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger on initial load or coordinate changes
  useEffect(() => {
    loadDataForLocation(lat, lon, locationName);
  }, [lat, lon]);

  const handleSelectCoordinates = (newLat: number, newLon: number, name?: string) => {
    setLat(newLat);
    setLon(newLon);
    if (name) setLocationName(name);
  };

  const handleSimulate = (params: { rainfall_24h?: number; slope?: number; soil_moisture?: number }) => {
    loadDataForLocation(lat, lon, locationName, params);
  };

  const handleRefresh = () => {
    loadDataForLocation(lat, lon, locationName);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-600 selection:text-white transition-colors duration-300">
      {/* Top Navigation Bar */}
      <Navbar
        onSelectCoordinates={handleSelectCoordinates}
        currentLat={lat}
        currentLon={lon}
        onOpenSavedLocations={() => setIsSavedOpen(true)}
        onOpenMetricsModal={() => setIsMetricsOpen(true)}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        alertCount={alerts.length}
        currentRiskLevel={predictionData?.risk_level}
      />

      {/* Main Analysis Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Safety Alert Banner (if Risk is HIGH or VERY HIGH and not dismissed) */}
        {predictionData && !isAlertDismissed && (
          <ErrorBoundary fallbackTitle="Alert Banner Error">
            <AlertBanner
              locationName={locationName}
              riskLevel={predictionData.risk_level}
              probability={predictionData.landslide_probability}
              factors={predictionData.factors}
              disclaimer={predictionData.disclaimer}
              onDismiss={() => setIsAlertDismissed(true)}
            />
          </ErrorBoundary>
        )}

        {/* Location & Terrain Overview Bar */}
        <ErrorBoundary fallbackTitle="Top Stats Bar Error">
          <TopStatsBar
            locationName={locationName}
            latitude={lat}
            longitude={lon}
            elevation={predictionData?.terrain?.elevation || weatherData?.elevation || 350}
            slope={predictionData?.terrain?.slope || 15}
            terrain={predictionData?.terrain}
            riskLevel={predictionData?.risk_level || 'LOW'}
            lastUpdated={predictionData?.timestamp || new Date().toISOString()}
          />
        </ErrorBoundary>

        {/* 2-Column Responsive Layout: Interactive Map + Weather & Risk Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Interactive Map (7 Cols) */}
          <div className="lg:col-span-7 h-[460px] sm:h-[560px] flex flex-col">
            <ErrorBoundary fallbackTitle="Interactive Map Display Notice">
              <InteractiveMap
                latitude={lat}
                longitude={lon}
                riskLevel={predictionData?.risk_level || 'LOW'}
                landslideProbability={predictionData?.landslide_probability || 0.1}
                gridPoints={riskMapData?.grid_points || []}
                onSelectLocation={handleSelectCoordinates}
                isLoading={isLoading}
              />
            </ErrorBoundary>
          </div>

          {/* Right Column: Live Weather + Landslide Risk Assessment (5 Cols) */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            {/* Live Weather Card */}
            <ErrorBoundary fallbackTitle="Weather Conditions Notice">
              {weatherData ? (
                <WeatherCard weather={weatherData.current} isLoading={isLoading} />
              ) : (
                <div className="glass-panel bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl h-48 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Loading meteorological conditions...</span>
                  </div>
                </div>
              )}
            </ErrorBoundary>

            {/* Landslide Hazard Risk Card */}
            <ErrorBoundary fallbackTitle="Landslide Hazard Model Notice">
              {predictionData ? (
                <LandslideRiskCard
                  prediction={predictionData}
                  onSimulate={handleSimulate}
                  isLoading={isLoading}
                />
              ) : (
                <div className="glass-panel bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Evaluating geotechnical landslide probability...</span>
                  </div>
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>

        {/* 72-Hour Prediction Timeline */}
        {timelineData && (
          <ErrorBoundary fallbackTitle="Risk Timeline Notice">
            <RiskTimeline timeline={timelineData.timeline} isLoading={isLoading} />
          </ErrorBoundary>
        )}

        {/* Meteorological Forecast Charts */}
        {weatherData && (
          <ErrorBoundary fallbackTitle="Weather Forecast Charts Notice">
            <WeatherCharts hourly={weatherData.hourly} daily={weatherData.daily} />
          </ErrorBoundary>
        )}
      </main>

      {/* Clean In-App Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 glass-panel bg-white/70 dark:bg-slate-950/70 py-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 transition-colors duration-300">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          TERRA-GUARD: Meteorological Forecasting & Geotechnical Risk Assessment Platform
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-lg mx-auto px-4">
          Real-time geotechnical and meteorological risk estimation. Always follow alerts from local disaster management authorities.
        </p>
      </footer>

      {/* Saved Locations & History Drawer */}
      <SavedLocationsDrawer
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        currentLat={lat}
        currentLon={lon}
        currentLocationName={locationName}
        onSelectLocation={handleSelectCoordinates}
      />

      {/* AI Model Metrics & Explainability Modal */}
      <ModelMetricsModal
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}

export default App;
