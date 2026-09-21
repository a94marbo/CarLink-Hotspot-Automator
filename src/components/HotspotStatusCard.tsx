import { Wifi, WifiOff, Car, Clock, ShieldCheck, Smartphone, Zap, RotateCcw, FastForward, CheckCircle2 } from 'lucide-react';
import { HotspotState, AppSettings } from '../types';

interface HotspotStatusCardProps {
  hotspotState: HotspotState;
  settings: AppSettings;
  onManualTurnOn: () => void;
  onManualTurnOff: () => void;
  onCancelCountdown: () => void;
  onFastForwardCountdown: () => void;
  onEditTimers?: () => void;
}

export function HotspotStatusCard({
  hotspotState,
  settings,
  onManualTurnOn,
  onManualTurnOff,
  onCancelCountdown,
  onFastForwardCountdown,
  onEditTimers,
}: HotspotStatusCardProps) {
  const { status, countdownRemaining, countdownTotal, triggeredDeviceName, ssid, band, connectedClients } = hotspotState;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = countdownTotal > 0
    ? Math.max(0, Math.min(100, Math.round(((countdownTotal - countdownRemaining) / countdownTotal) * 100)))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header section with status background */}
      <div className={`p-5 sm:p-6 transition-colors duration-300 ${
        status === 'active'
          ? 'bg-emerald-50/70 border-b border-emerald-100'
          : status === 'connecting_delay'
          ? 'bg-amber-50/70 border-b border-amber-100'
          : status === 'disconnecting_delay'
          ? 'bg-orange-50/70 border-b border-orange-100'
          : 'bg-slate-50/70 border-b border-slate-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-md p-0.5 transition-all duration-300 ${
              status === 'active'
                ? 'bg-slate-950 ring-4 ring-emerald-200 border-2 border-emerald-400 shadow-emerald-500/20 animate-pulse'
                : status === 'connecting_delay'
                ? 'bg-slate-950 ring-4 ring-amber-200 border-2 border-amber-400'
                : status === 'disconnecting_delay'
                ? 'bg-slate-950 ring-4 ring-orange-200 border-2 border-orange-400'
                : 'bg-slate-950 ring-4 ring-slate-200 border border-slate-700'
            }`}>
              <img 
                src={status === 'active' ? '/carlink-active.jpg' : '/carlink-inactive.jpg'}
                alt={status === 'active' ? 'CarLink Hotspot Enabled' : 'CarLink Hotspot Inactive'}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <div 
                className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-xs ${
                  status === 'active' ? 'bg-emerald-500 ring-2 ring-emerald-300/60' : 'bg-rose-500 ring-2 ring-rose-300/60'
                }`}
                title={status === 'active' ? 'Hotspot Active' : 'Hotspot Off'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
                  Phone Wi-Fi Hotspot
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'connecting_delay'
                    ? 'bg-amber-100 text-amber-800'
                    : status === 'disconnecting_delay'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {status === 'active' && 'Broadcasting (ON)'}
                  {status === 'connecting_delay' && `Starting in ${countdownRemaining}s`}
                  {status === 'disconnecting_delay' && `Auto-Off in ${formatTime(countdownRemaining)}`}
                  {status === 'off' && 'Turned OFF'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {status === 'active' && 'Wi-Fi Hotspot is Active'}
                {status === 'connecting_delay' && `Activating Hotspot in ${countdownRemaining} Seconds`}
                {status === 'disconnecting_delay' && `Disconnect Grace Period: ${formatTime(countdownRemaining)}`}
                {status === 'off' && 'Hotspot Inactive (Waiting for Car)'}
              </h2>

              <p className="text-sm text-slate-600 mt-0.5">
                {status === 'active' && (
                  triggeredDeviceName
                    ? `Connected to car Bluetooth: "${triggeredDeviceName}". Providing high-speed internet.`
                    : 'Hotspot is transmitting. Connected devices have Internet access.'
                )}
                {status === 'connecting_delay' && (
                  `Car "${triggeredDeviceName || 'Bluetooth Device'}" connected! Waiting ${settings.connectDelaySeconds}s delay buffer before powering on hotspot.`
                )}
                {status === 'disconnecting_delay' && (
                  `Car disconnected. Hotspot will shut down after ${settings.disconnectDelayMinutes}m to protect phone battery unless reconnected.`
                )}
                {status === 'off' && (
                  `Automation rule armed: When selected car Bluetooth connects, hotspot turns ON after ${settings.connectDelaySeconds}s.`
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {status === 'off' && (
              <button
                id="btn-hotspot-force-on"
                onClick={onManualTurnOn}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Wifi className="w-4 h-4" />
                Manual Turn ON
              </button>
            )}

            {status === 'connecting_delay' && (
              <button
                id="btn-hotspot-cancel-delay"
                onClick={onCancelCountdown}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                Cancel Delay
              </button>
            )}

            {status === 'disconnecting_delay' && (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-hotspot-keep-on"
                  onClick={onCancelCountdown}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
                  title="Keep Hotspot ON indefinitely"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Keep Hotspot ON
                </button>
                <button
                  id="btn-hotspot-fast-forward"
                  onClick={onFastForwardCountdown}
                  className="p-2 rounded-xl text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
                  title="Fast-forward timer by 30 seconds"
                >
                  <FastForward className="w-4 h-4" />
                </button>
                <button
                  id="btn-hotspot-force-off-now"
                  onClick={onManualTurnOff}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                >
                  <WifiOff className="w-4 h-4" />
                  Turn Off Now
                </button>
              </div>
            )}

            {status === 'active' && (
              <button
                id="btn-hotspot-force-off"
                onClick={onManualTurnOff}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                <WifiOff className="w-4 h-4" />
                Turn Off Hotspot
              </button>
            )}
          </div>
        </div>

        {/* Progress bar during countdowns */}
        {(status === 'connecting_delay' || status === 'disconnecting_delay') && (
          <div className="mt-4 pt-3 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {status === 'connecting_delay'
                  ? `${settings.connectDelaySeconds}-Second Activation Buffer`
                  : `${settings.disconnectDelayMinutes}-Minute Disconnect Grace Timer`}
              </span>
              <span className="font-mono font-semibold">
                {status === 'connecting_delay' ? `${countdownRemaining}s remaining` : `${formatTime(countdownRemaining)} remaining`}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  status === 'connecting_delay' ? 'bg-amber-500' : 'bg-orange-500'
                }`}
                style={{ width: `${status === 'connecting_delay' ? progressPercent : 100 - progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid of details: SSID, Band, Car connection, Battery impact */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-slate-800 bg-white">
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium truncate">Hotspot Network</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{ssid}</p>
            <p className="text-[11px] text-slate-400">{band} • WPA3</p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium truncate">Trigger Device</p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {triggeredDeviceName || 'None Active'}
            </p>
            <p className="text-[11px] text-slate-400">
              {triggeredDeviceName ? 'Bluetooth Paired' : 'Awaiting Connection'}
            </p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium truncate">Connected Clients</p>
            <p className="text-sm font-semibold text-slate-900">
              {connectedClients.length} {connectedClients.length === 1 ? 'Device' : 'Devices'}
            </p>
            <p className="text-[11px] text-slate-400">
              {status === 'active' && connectedClients.length > 0
                ? connectedClients.map(c => c.name).join(', ')
                : status === 'active'
                ? 'Car connecting...'
                : 'Offline'}
            </p>
          </div>
        </div>

        <div 
          onClick={onEditTimers}
          className={`p-4 flex items-center gap-3 transition-colors ${onEditTimers ? 'cursor-pointer hover:bg-amber-50/30' : ''}`}
          title={onEditTimers ? 'Click to edit delay buffer and grace period' : undefined}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium truncate">Rule Timers</p>
              {onEditTimers && (
                <span className="text-[10px] text-blue-600 font-semibold hover:underline">Edit</span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {settings.connectDelaySeconds}s on / {settings.disconnectDelayMinutes}m off
            </p>
            <p className="text-[11px] text-slate-400">
              {settings.connectDelaySeconds === 10 && settings.disconnectDelayMinutes === 5 ? 'Default Timers' : 'Custom Timers'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
