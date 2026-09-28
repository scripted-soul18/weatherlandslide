import React, { useEffect, useState } from 'react';
import {
  X,
  Bookmark,
  History,
  ShieldAlert,
  MapPin,
  Plus,
  ExternalLink,
  Clock,
  Loader2
} from 'lucide-react';
import { SavedLocationItem, PredictionHistoryItem, AlertItem, RiskLevel } from '../types';
import { fetchSavedLocations, saveLocation, fetchPredictionHistory, fetchAlerts } from '../services/api';

interface SavedLocationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat: number;
  currentLon: number;
  currentLocationName: string;
  onSelectLocation: (lat: number, lon: number, name?: string) => void;
}

const RISK_BADGES: Record<RiskLevel, { text: string; bg: string; color: string }> = {
  LOW: { text: 'LOW', bg: 'bg-emerald-500/10', color: 'text-emerald-700 dark:text-emerald-400' },
  MODERATE: { text: 'MODERATE', bg: 'bg-amber-500/10', color: 'text-amber-700 dark:text-amber-400' },
  HIGH: { text: 'HIGH', bg: 'bg-orange-500/15', color: 'text-orange-700 dark:text-orange-400' },
  'VERY HIGH': { text: 'VERY HIGH', bg: 'bg-rose-500/20', color: 'text-rose-700 dark:text-rose-400' },
};

export const SavedLocationsDrawer: React.FC<SavedLocationsDrawerProps> = ({
  isOpen,
  onClose,
  currentLat,
  currentLon,
  currentLocationName,
  onSelectLocation,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'alerts'>('saved');
  const [savedLocs, setSavedLocs] = useState<SavedLocationItem[]>([]);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newLocName, setNewLocName] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locs, hist, alt] = await Promise.all([
        fetchSavedLocations(),
        fetchPredictionHistory(),
        fetchAlerts(),
      ]);
      setSavedLocs(locs);
      setHistory(hist);
      setAlerts(alt);
    } catch (err) {
      console.error('Error loading history/saved:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    setIsSaving(true);
    try {
      await saveLocation(newLocName, currentLat, currentLon, newNotes);
      setNewLocName('');
      setNewNotes('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col glass-panel transition-colors duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Bookmarks & History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 p-1">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedLocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Alerts ({alerts.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400 animate-spin" />
              <span className="text-xs font-medium">Loading database records...</span>
            </div>
          ) : activeTab === 'saved' ? (
            <div className="space-y-4">
              {/* Form to save current location */}
              <form onSubmit={handleSaveCurrent} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Save Current Location
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {currentLocationName || `Coord: ${currentLat.toFixed(3)}°, ${currentLon.toFixed(3)}°`}
                </div>
                <input
                  type="text"
                  placeholder="Custom name (e.g. My Mountain Cabin)"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  required
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span>Save Location</span>
                </button>
              </form>

              {/* List of saved locations */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Bookmarks</div>
                {savedLocs.length === 0 ? (
                  <div className="text-xs text-slate-400 italic p-4 text-center">No saved locations yet.</div>
                ) : (
                  savedLocs.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc.latitude, loc.longitude, loc.name);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                            {loc.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prediction Log History</div>
              {history.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-4 text-center">No prediction history logged yet.</div>
              ) : (
                history.map((h) => {
                  const badge = RISK_BADGES[h.risk_level] || RISK_BADGES.LOW;
                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        onSelectLocation(h.latitude, h.longitude, h.location_name);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                          {h.location_name || `Point (${h.latitude.toFixed(3)}°, ${h.longitude.toFixed(3)}°)`}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <Clock className="w-2.5 h-2.5" /> {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span>•</span>
                          <span>24h Rain: {h.rainfall_24h.toFixed(1)}mm</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.bg} ${badge.color}`}>
                        {h.risk_level} ({(h.landslide_probability * 100).toFixed(0)}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hazard Alerts History</div>
              {alerts.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-4 text-center">No recent hazard alerts logged.</div>
              ) : (
                alerts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      onSelectLocation(alt.latitude, alt.longitude, alt.location_name);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-300 dark:border-rose-500/40 cursor-pointer transition-all space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-700 dark:text-rose-300">
                        {alt.risk_level} ALERT ({Math.round(alt.probability * 100)}%)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {alt.location_name || `Coordinates (${alt.latitude.toFixed(3)}°, ${alt.longitude.toFixed(3)}°)`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

