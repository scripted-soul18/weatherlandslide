export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';

export interface CurrentWeather {
  temperature: number;
  rainfall_1h: number;
  rainfall_3h: number;
  rainfall_6h: number;
  rainfall_12h: number;
  rainfall_24h: number;
  rainfall_3d: number;
  rainfall_7d: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  soil_moisture: number;
  weather_code: number;
  weather_description: string;
  timestamp: string;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  rainfall: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  soil_moisture: number;
}

export interface DailyForecastItem {
  date: string;
  max_temp: number;
  min_temp: number;
  total_rainfall: number;
  weather_code: number;
  weather_description: string;
}

export interface WeatherForecastResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  location_name?: string;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface TerrainInfo {
  latitude: number;
  longitude: number;
  elevation: number;
  slope: number;
  aspect: number;
  plan_curvature: number;
  profile_curvature: number;
  soil_type: string;
  land_cover: string;
  geology_strength: number;
  vegetation_density: number;
  data_limitations: string[];
}

export interface SHAPContribution {
  feature: string;
  label: string;
  contribution_pct: number;
  value: number;
}

export interface LandslidePredictionResponse {
  latitude: number;
  longitude: number;
  landslide_probability: number;
  risk_level: RiskLevel;
  confidence: number;
  factors: string[];
  shap_contributions: SHAPContribution[];
  feature_breakdown: Record<string, number>;
  model_version: string;
  disclaimer: string;
  timestamp: string;
  terrain?: TerrainInfo;
  weather_summary?: {
    temperature: number;
    humidity: number;
    rainfall_24h: number;
    rainfall_7d: number;
    wind_speed: number;
    description: string;
  };
}

export interface RiskGridPoint {
  id: string;
  latitude: number;
  longitude: number;
  elevation: number;
  slope: number;
  rainfall_24h: number;
  soil_moisture: number;
  landslide_probability: number;
  risk_level: RiskLevel;
}

export interface RiskMapResponse {
  center_lat: number;
  center_lon: number;
  radius_km: number;
  grid_points: RiskGridPoint[];
  summary: Record<string, number>;
}

export interface TimelineHorizonItem {
  time_offset: string;
  hours_from_now: number;
  timestamp: string;
  rainfall_mm: number;
  cumulative_rainfall_mm: number;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  landslide_probability: number;
  risk_level: RiskLevel;
}

export interface PredictionTimelineResponse {
  latitude: number;
  longitude: number;
  timeline: TimelineHorizonItem[];
}

export interface ModelMetricsResponse {
  best_model_name: string;
  features: string[];
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
    composite_score: number;
  };
  all_model_results: Record<string, any>;
  feature_importances: Record<string, number>;
  sample_count: number;
}

export interface SavedLocationItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  notes?: string;
  created_at: string;
}

export interface PredictionHistoryItem {
  id: number;
  latitude: number;
  longitude: number;
  location_name?: string;
  landslide_probability: number;
  risk_level: RiskLevel;
  confidence: number;
  rainfall_24h: number;
  timestamp: string;
}

export interface AlertItem {
  id: number;
  latitude: number;
  longitude: number;
  location_name?: string;
  risk_level: RiskLevel;
  probability: number;
  factors: string[];
  disclaimer: string;
  created_at: string;
}
