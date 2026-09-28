import React, { useState } from 'react';
import { Clock, CloudRain, ArrowRight } from 'lucide-react';
import { TimelineHorizonItem, RiskLevel } from '../types';

interface RiskTimelineProps {
  timeline: TimelineHorizonItem[];
  isLoading?: boolean;
}

const RISK_BADGES: Record<
  RiskLevel,
  { text: string; bg: string; border: string; color: string; dot: string }
> = {
  LOW: {
    text: 'LOW',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
    border: 'border-emerald-500/30',
    color: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  MODERATE: {
    text: 'MODERATE',
    bg: 'bg-amber-500/10 dark:bg-amber-500/10',
    border: 'border-amber-500/30',
    color: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  HIGH: {
    text: 'HIGH',
    bg: 'bg-orange-500/15 dark:bg-orange-500/15',
    border: 'border-orange-500/40',
    color: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  'VERY HIGH': {
    text: 'VERY HIGH',
    bg: 'bg-rose-500/15 dark:bg-rose-500/20',
    border: 'border-rose-500/50',
    color: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ timeline, isLoading = false }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!timeline || timeline.length === 0) {
    return null;
  }

  const selectedItem = timeline[selectedIdx] || timeline[0];
  const selectedBadge = RISK_BADGES[selectedItem.risk_level] || RISK_BADGES.LOW;

  return (
    <div className="w-full glass-panel bg-white/80 dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xl transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
              72-Hour Hazard Timeline Horizon
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Future cumulative rainfall & soil saturation progression
            </p>
          </div>
        </div>

        {/* Selected Horizon Summary Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs shadow-sm">
          <span className="text-slate-500 dark:text-slate-400">Forecast at <strong className="text-cyan-700 dark:text-cyan-300">{selectedItem.time_offset}</strong>:</span>
          <span className={`font-bold flex items-center gap-1.5 ${selectedBadge.color}`}>
            <span className={`w-2 h-2 rounded-full ${selectedBadge.dot}`} />
            {selectedItem.risk_level} ({Math.round(selectedItem.landslide_probability * 100)}%)
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-4">
        {timeline.map((item, idx) => {
          const badge = RISK_BADGES[item.risk_level] || RISK_BADGES.LOW;
          const isSelected = selectedIdx === idx;
          const prob = Math.round(item.landslide_probability * 100);

          return (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-500/10 dark:bg-slate-800/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/50'
                  : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.time_offset}</span>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              </div>

              <div className="space-y-1 mb-2">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                  <CloudRain className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>{item.cumulative_rainfall_mm.toFixed(1)} mm</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Sat: {(item.soil_moisture * 100).toFixed(0)}%
                </div>
              </div>

              <div className={`mt-auto pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold ${badge.color}`}>
                {prob}% {badge.text}
              </div>
            </button>
          );
        })}
      </div>

      {/* Table Comparison View */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="text-[11px] uppercase bg-slate-100/90 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
            <tr>
              <th className="px-4 py-2.5">Time Horizon</th>
              <th className="px-4 py-2.5">Interval Rain</th>
              <th className="px-4 py-2.5">Accumulated Rain</th>
              <th className="px-4 py-2.5">Temperature</th>
              <th className="px-4 py-2.5">Humidity</th>
              <th className="px-4 py-2.5">Soil Saturation</th>
              <th className="px-4 py-2.5 text-right">Hazard Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
            {timeline.map((row, idx) => {
              const badge = RISK_BADGES[row.risk_level] || RISK_BADGES.LOW;
              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-100/80 dark:hover:bg-slate-900/60 transition-colors cursor-pointer ${
                    selectedIdx === idx ? 'bg-slate-100/90 dark:bg-slate-900/70 font-semibold' : ''
                  }`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <td className="px-4 py-2 text-slate-900 dark:text-slate-100 font-sans font-bold flex items-center gap-1.5">
                    {selectedIdx === idx && <ArrowRight className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />}
                    {row.time_offset}
                  </td>
                  <td className="px-4 py-2 text-cyan-700 dark:text-cyan-300">{row.rainfall_mm.toFixed(1)} mm</td>
                  <td className="px-4 py-2 text-cyan-800 dark:text-cyan-400 font-bold">{row.cumulative_rainfall_mm.toFixed(1)} mm</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{row.temperature.toFixed(1)}°C</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{row.humidity.toFixed(0)}%</td>
                  <td className="px-4 py-2 text-amber-700 dark:text-amber-300">{(row.soil_moisture * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${badge.bg} ${badge.border} ${badge.color}`}>
                      {row.risk_level} ({Math.round(row.landslide_probability * 100)}%)
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
