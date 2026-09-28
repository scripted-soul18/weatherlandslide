import React from 'react';
import {
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Layers,
  CloudSun
} from 'lucide-react';
import { CurrentWeather } from '../types';

interface WeatherCardProps {
  weather: CurrentWeather;
  isLoading?: boolean;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, isLoading = false }) => {
  return (
    <div className="w-full glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <CloudSun className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm tracking-wide">Live Weather Conditions</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 font-medium">
          {weather.weather_description}
        </span>
      </div>

      {/* Main Temperature & Weather Highlights */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Temperature */}
        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-white">
              {weather.temperature.toFixed(1)}°C
            </div>
            <div className="text-[11px] font-medium text-slate-400">Ambient Temp</div>
          </div>
        </div>

        {/* 24h Rainfall */}
        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-blue-300">
              {weather.rainfall_24h.toFixed(1)} <span className="text-sm font-normal text-slate-400">mm</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400">24h Rainfall</div>
          </div>
        </div>
      </div>

      {/* Sub-grid of detailed environmental metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Rainfall Windows */}
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60 flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 font-medium">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>Precipitation</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-200">
            {weather.rainfall_1h.toFixed(1)} mm <span className="text-[10px] text-slate-400 font-normal">/ 1h</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            7d: {weather.rainfall_7d.toFixed(1)} mm
          </span>
        </div>

        {/* Humidity */}
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60 flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 font-medium">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Humidity</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-200">
            {weather.humidity.toFixed(0)}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Relative</span>
        </div>

        {/* Wind */}
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60 flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 font-medium">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Wind</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-200">
            {weather.wind_speed.toFixed(1)} km/h
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
            <Compass className="w-2.5 h-2.5" /> {weather.wind_direction.toFixed(0)}°
          </span>
        </div>

        {/* Soil Moisture */}
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60 flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 font-medium">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Soil Saturation</span>
          </div>
          <span className="font-mono text-sm font-bold text-amber-300">
            {(weather.soil_moisture * 100).toFixed(0)}%
          </span>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                weather.soil_moisture > 0.65
                  ? 'bg-rose-500'
                  : weather.soil_moisture > 0.45
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, weather.soil_moisture * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
