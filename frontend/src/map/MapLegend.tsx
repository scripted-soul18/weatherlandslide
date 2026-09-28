import React from 'react';
import { Layers, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import { MapTileMode } from './InteractiveMap';

interface MapLegendProps {
  tileLayer: MapTileMode;
  onTileChange: (tile: MapTileMode) => void;
  showRiskGrid: boolean;
  onToggleRiskGrid: () => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  tileLayer,
  onTileChange,
  showRiskGrid,
  onToggleRiskGrid,
}) => {
  return (
    <div className="absolute bottom-6 right-6 z-[1000] glass-panel bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xl max-w-xs text-xs text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between gap-4 mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Landslide Risk Scale</span>
        </div>
        <button
          onClick={onToggleRiskGrid}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
            showRiskGrid
              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
          title="Toggle spatial heatmap grid circles"
        >
          {showRiskGrid ? <Eye className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
          <span>Grid</span>
        </button>
      </div>

      {/* Risk colors grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
          <span className="text-slate-700 dark:text-slate-300 text-[11px]">Low (0-20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"></span>
          <span className="text-slate-700 dark:text-slate-300 text-[11px]">Mod (20-50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]"></span>
          <span className="text-slate-700 dark:text-slate-300 text-[11px]">High (50-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
          <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px]">V.High (75-100%)</span>
        </div>
      </div>

      {/* Base Tile Mode Fast Selector */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium text-[11px]">
          <Layers className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Mode:
        </span>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onTileChange('satellite_hybrid')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              tileLayer === 'satellite_hybrid'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Google Satellite with Roads & Labels"
          >
            Satellite
          </button>
          <button
            onClick={() => onTileChange('terrain')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              tileLayer === 'terrain'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Google Topographic Relief"
          >
            Terrain
          </button>
          <button
            onClick={() => onTileChange('streets')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              tileLayer === 'streets'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Google Street Map"
          >
            Streets
          </button>
          <button
            onClick={() => onTileChange('dark')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              tileLayer === 'dark'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Dark Matter Canvas"
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
};

