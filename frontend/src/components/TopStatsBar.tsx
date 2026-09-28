import React from 'react';
import { MapPin, Mountain, TrendingUp, Compass, Clock } from 'lucide-react';
import { TerrainInfo, RiskLevel } from '../types';

interface TopStatsBarProps {
  locationName: string;
  latitude: number;
  longitude: number;
  elevation: number;
  slope: number;
  terrain?: TerrainInfo;
  riskLevel: RiskLevel;
  lastUpdated: string;
}

const RISK_BADGES: Record<
  RiskLevel,
  { text: string; bg: string; border: string; color: string; dot: string }
> = {
  LOW: {
    text: 'Low Hazard Risk',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  MODERATE: {
    text: 'Moderate Hazard Risk',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  HIGH: {
    text: 'High Hazard Alert',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    color: 'text-orange-400',
    dot: 'bg-orange-400',
  },
  'VERY HIGH': {
    text: 'Critical Hazard Alert',
    bg: 'bg-rose-500/25',
    border: 'border-rose-500/50',
    color: 'text-rose-400',
    dot: 'bg-rose-400',
  },
};

export const TopStatsBar: React.FC<TopStatsBarProps> = ({
  locationName,
  latitude,
  longitude,
  elevation,
  slope,
  terrain,
  riskLevel,
  lastUpdated
}) => {
  const badge = RISK_BADGES[riskLevel] || RISK_BADGES.LOW;
  const timeFormatted = new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full glass-panel bg-slate-900/80 rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 transition-all duration-300">
      {/* Location Details */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <div className="relative w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0 shadow-lg shadow-rose-500/25">
          <span className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75" />
          <MapPin className="w-4 h-4 text-rose-500 relative z-10" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md" title={locationName}>
            {locationName || `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`}
          </h2>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
            <span>{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-sans text-slate-400">
              <Clock className="w-3 h-3" /> {timeFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Topographical Stats Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-sm">
          <Mountain className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] text-slate-400">Elevation:</span>
          <span className="font-mono font-bold text-slate-200">{elevation.toFixed(0)}m</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-sm">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400">Slope:</span>
          <span className="font-mono font-bold text-slate-200">{slope.toFixed(1)}°</span>
        </div>

        {terrain?.land_cover && (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-sm">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-400">Terrain:</span>
            <span className="font-semibold text-slate-200 capitalize">
              {terrain.land_cover.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Current Assessment Badge */}
        <div className={`px-3 py-1.5 rounded-xl border ${badge.bg} ${badge.border} flex items-center gap-2 shadow-sm`}>
          <span className={`w-2 h-2 rounded-full ${badge.dot} ${riskLevel === 'VERY HIGH' ? 'animate-ping' : ''}`} />
          <span className={`text-xs font-bold tracking-tight ${badge.color}`}>{badge.text}</span>
        </div>
      </div>
    </div>
  );
};
