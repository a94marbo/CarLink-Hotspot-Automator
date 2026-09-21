import { Car, Wifi, Volume2, VolumeX, Smartphone, Settings, Sparkles } from 'lucide-react';
import { HotspotState } from '../types';

interface HeaderProps {
  hotspotState: HotspotState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onOpenSimulator: () => void;
  hasTriggerDevices: boolean;
}

export function Header({
  hotspotState,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenGuide,
  onOpenSimulator,
  hasTriggerDevices,
}: HeaderProps) {
  const getStatusBadge = () => {
    switch (hotspotState.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Hotspot Active
          </span>
        );
      case 'connecting_delay':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Triggering in {hotspotState.countdownRemaining}s
          </span>
        );
      case 'disconnecting_delay':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-600 border border-orange-500/20">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Disconnecting in {Math.floor(hotspotState.countdownRemaining / 60)}m {hotspotState.countdownRemaining % 60}s
          </span>
        );
      case 'off':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Monitoring Standby
          </span>
        );
    }
  };

  const isHotspotActive = hotspotState.status === 'active';
  const logoSrc = isHotspotActive ? '/carlink-active.jpg' : '/carlink-inactive.jpg';

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl overflow-hidden shadow-md shrink-0 bg-slate-950 flex items-center justify-center p-0.5 transition-all duration-300 ${
            isHotspotActive 
              ? 'border-2 border-emerald-400 ring-2 ring-emerald-400/40 shadow-emerald-500/20' 
              : 'border border-slate-700/30 ring-1 ring-slate-200'
          }`}
          title={isHotspotActive ? 'Hotspot Active: Wi-Fi Broadcasting' : 'Hotspot Inactive: Standby Mode'}
          >
            <img 
              src={logoSrc} 
              alt={isHotspotActive ? 'CarLink Hotspot Enabled' : 'CarLink Hotspot Inactive'} 
              className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                CarLink <span className={isHotspotActive ? "text-emerald-600 font-semibold" : "text-slate-600 font-semibold"}>Hotspot Automator</span>
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Intelligent vehicle Bluetooth tethering automation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-open-simulator"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
            title="Open Interactive Trip Simulator"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Drive</span> Simulator
          </button>

          <button
            id="btn-open-guide"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
            title="Phone Setup & Automation Guide"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Phone</span> Setup
          </button>

          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title={soundEnabled ? 'Mute Chimes' : 'Enable Audio Chimes'}
            aria-label="Toggle sound alerts"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Automation & Timer Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
