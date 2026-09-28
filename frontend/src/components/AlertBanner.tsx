import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { RiskLevel } from '../types';

interface AlertBannerProps {
  locationName: string;
  riskLevel: RiskLevel;
  probability: number;
  factors: string[];
  disclaimer: string;
  onDismiss?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  locationName,
  riskLevel,
  probability,
  factors,
  disclaimer,
  onDismiss
}) => {
  // Only display alert banner for HIGH and VERY HIGH risk levels
  if (riskLevel !== 'HIGH' && riskLevel !== 'VERY HIGH') {
    return null;
  }

  const isVeryHigh = riskLevel === 'VERY HIGH';

  return (
    <div
      className={`w-full rounded-2xl p-4 mb-4 border transition-all duration-300 shadow-2xl relative overflow-hidden ${
        isVeryHigh
          ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-400 dark:border-rose-500/70 text-rose-950 dark:text-rose-100 danger-ring'
          : 'bg-orange-100 dark:bg-orange-950/80 border-orange-400 dark:border-orange-500/70 text-orange-950 dark:text-orange-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
              isVeryHigh
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300 animate-pulse'
                : 'bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-sm tracking-wider uppercase">
                ⚠ LANDSLIDE RISK ALERT
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isVeryHigh ? 'bg-rose-600 text-white' : 'bg-orange-600 text-white'
                }`}
              >
                {riskLevel} ({Math.round(probability * 100)}%)
              </span>
            </div>

            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Elevated geotechnical instability detected for: <strong className="text-slate-950 dark:text-white underline">{locationName}</strong>
            </p>

            <div className="flex flex-wrap gap-2 mb-2.5">
              {factors.map((factor, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium bg-white/70 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700/60 flex items-center gap-1 shadow-sm"
                >
                  • {factor}
                </span>
              ))}
            </div>

            <div className="text-[11px] opacity-90 italic pt-2 border-t border-slate-300 dark:border-slate-700/50">
              <strong>Official Disclaimer:</strong> {disclaimer}
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

