import React, { useState } from 'react';
import { Clock, Timer, ShieldCheck, RotateCcw, Sliders, ChevronDown, ChevronUp, Sparkles, Zap, BatteryCharging } from 'lucide-react';
import { AppSettings } from '../types';

interface TimerConfigCardProps {
  settings: AppSettings;
  onUpdateTimers: (connectDelaySeconds: number, disconnectDelayMinutes: number) => void;
  onResetDefaults: () => void;
}

const CONNECT_DELAY_PRESETS = [
  { label: '0s (Instant)', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s (Default)', value: 10, isDefault: true },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

const DISCONNECT_GRACE_PRESETS = [
  { label: '1 min', value: 1 },
  { label: '2 min', value: 2 },
  { label: '5 min (Default)', value: 5, isDefault: true },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
];

export function TimerConfigCard({
  settings,
  onUpdateTimers,
  onResetDefaults,
}: TimerConfigCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isAtDefaults =
    settings.connectDelaySeconds === 10 && settings.disconnectDelayMinutes === 5;

  const handleConnectDelayChange = (value: number) => {
    const clamped = Math.max(0, Math.min(120, value));
    onUpdateTimers(clamped, settings.disconnectDelayMinutes);
  };

  const handleDisconnectGraceChange = (value: number) => {
    const clamped = Math.max(1, Math.min(60, value));
    onUpdateTimers(settings.connectDelaySeconds, clamped);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                Delay Buffer & Disconnect Grace Period
              </h3>
              {isAtDefaults ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Standard Defaults (10s / 5m)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Customized ({settings.connectDelaySeconds}s / {settings.disconnectDelayMinutes}m)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize how long your phone waits before activating the hotspot and after you leave your vehicle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAtDefaults && (
            <button
              id="btn-reset-timers-default"
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-700 transition-colors shadow-2xs"
              title="Reset both timers back to 10s delay and 5 min grace"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Restore Defaults (10s / 5m)</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Collapse section' : 'Expand section'}
            aria-label="Toggle timer options"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Controls */}
      {isExpanded && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left Column: Delay Buffer (Connect) */}
          <div className="space-y-3 md:pr-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <label htmlFor="input-connect-delay" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Car Connect Delay Buffer
                </label>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">
                <input
                  id="input-connect-delay"
                  type="number"
                  min="0"
                  max="120"
                  value={settings.connectDelaySeconds}
                  onChange={(e) => handleConnectDelayChange(parseInt(e.target.value) || 0)}
                  className="w-12 text-center text-xs font-bold font-mono text-blue-900 bg-transparent border-0 p-0 focus:outline-hidden"
                />
                <span className="text-[11px] font-bold text-blue-700">sec</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Stabilization buffer after car Bluetooth connects before the Wi-Fi hotspot powers ON. Prevents false triggers during brief stops.
            </p>

            {/* Stepper + Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleConnectDelayChange(settings.connectDelaySeconds - 1)}
                  disabled={settings.connectDelaySeconds <= 0}
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm disabled:opacity-30"
                  title="Decrease delay by 1 second"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={settings.connectDelaySeconds}
                  onChange={(e) => handleConnectDelayChange(parseInt(e.target.value) || 0)}
                  className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <button
                  onClick={() => handleConnectDelayChange(settings.connectDelaySeconds + 1)}
                  disabled={settings.connectDelaySeconds >= 60}
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm disabled:opacity-30"
                  title="Increase delay by 1 second"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
                {CONNECT_DELAY_PRESETS.map((p) => {
                  const isSelected = settings.connectDelaySeconds === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => handleConnectDelayChange(p.value)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : p.isDefault
                          ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Disconnect Grace Period */}
          <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <label htmlFor="input-disconnect-grace" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Disconnect Turn-Off Grace Period
                </label>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-0.5">
                <input
                  id="input-disconnect-grace"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.disconnectDelayMinutes}
                  onChange={(e) => handleDisconnectGraceChange(parseInt(e.target.value) || 1)}
                  className="w-12 text-center text-xs font-bold font-mono text-orange-900 bg-transparent border-0 p-0 focus:outline-hidden"
                />
                <span className="text-[11px] font-bold text-orange-700">min</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Grace window after car Bluetooth disconnects before turning off the hotspot. If you return to the car within this time, shutdown cancels immediately.
            </p>

            {/* Stepper + Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDisconnectGraceChange(settings.disconnectDelayMinutes - 1)}
                  disabled={settings.disconnectDelayMinutes <= 1}
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm disabled:opacity-30"
                  title="Decrease grace period by 1 minute"
                >
                  -
                </button>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={settings.disconnectDelayMinutes}
                  onChange={(e) => handleDisconnectGraceChange(parseInt(e.target.value) || 1)}
                  className="flex-1 accent-orange-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <button
                  onClick={() => handleDisconnectGraceChange(settings.disconnectDelayMinutes + 1)}
                  disabled={settings.disconnectDelayMinutes >= 30}
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm disabled:opacity-30"
                  title="Increase grace period by 1 minute"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
                {DISCONNECT_GRACE_PRESETS.map((p) => {
                  const isSelected = settings.disconnectDelayMinutes === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => handleDisconnectGraceChange(p.value)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                          : p.isDefault
                          ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary note */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Active Rule: When vehicle connects, hotspot turns ON after <strong>{settings.connectDelaySeconds}s</strong>; turns OFF after <strong>{settings.disconnectDelayMinutes}m</strong> away.
          </span>
        </div>
        <span className="font-medium text-slate-400 hidden sm:inline">
          Auto-saves in real time
        </span>
      </div>
    </div>
  );
}
