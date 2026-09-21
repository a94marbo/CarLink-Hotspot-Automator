import { useState } from 'react';
import { Settings, Clock, Bell, Battery, Wifi, ShieldAlert, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<AppSettings>({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-xs shrink-0 bg-slate-950 flex items-center justify-center p-0.5 z-10" title="Hotspot Active Icon">
                <img 
                  src="/carlink-active.jpg" 
                  alt="CarLink Active Hotspot" 
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shadow-xs shrink-0 bg-slate-950 flex items-center justify-center p-0.5 opacity-80" title="Hotspot Inactive Icon">
                <img 
                  src="/carlink-inactive.jpg" 
                  alt="CarLink Inactive Hotspot" 
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">CarLink Automation & Timer Settings</h3>
              <p className="text-xs text-slate-500">Configure trigger delays and hotspot behavior</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-6">
          {/* Section 1: Timers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Delay Timers (Core Rules)</span>
            </div>

            {/* Connect Delay */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="modal-connect-delay" className="text-xs font-bold text-slate-800">
                  Car Bluetooth Connect Delay Buffer
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="modal-connect-delay"
                    type="number"
                    min="0"
                    max="120"
                    value={form.connectDelaySeconds}
                    onChange={(e) => setForm({ ...form, connectDelaySeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-14 text-center text-xs font-bold font-mono px-1 py-0.5 rounded bg-white border border-slate-300 text-blue-900"
                  />
                  <span className="text-xs font-bold text-blue-800">sec</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Wait time after car connects before turning on the Wi-Fi hotspot (Default: 10 seconds).
              </p>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={form.connectDelaySeconds}
                onChange={(e) => setForm({ ...form, connectDelaySeconds: parseInt(e.target.value) || 0 })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <button type="button" onClick={() => setForm({ ...form, connectDelaySeconds: 0 })} className="hover:text-slate-700">0s (Instant)</button>
                <button type="button" onClick={() => setForm({ ...form, connectDelaySeconds: 5 })} className="hover:text-slate-700">5s</button>
                <button type="button" onClick={() => setForm({ ...form, connectDelaySeconds: 10 })} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">10s (Default)</button>
                <button type="button" onClick={() => setForm({ ...form, connectDelaySeconds: 15 })} className="hover:text-slate-700">15s</button>
                <button type="button" onClick={() => setForm({ ...form, connectDelaySeconds: 30 })} className="hover:text-slate-700">30s</button>
              </div>
            </div>

            {/* Disconnect Delay */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="modal-disconnect-delay" className="text-xs font-bold text-slate-800">
                  Car Bluetooth Disconnect Grace Period
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="modal-disconnect-delay"
                    type="number"
                    min="1"
                    max="60"
                    value={form.disconnectDelayMinutes}
                    onChange={(e) => setForm({ ...form, disconnectDelayMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-14 text-center text-xs font-bold font-mono px-1 py-0.5 rounded bg-white border border-slate-300 text-orange-900"
                  />
                  <span className="text-xs font-bold text-orange-800">min</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Grace period after leaving car before turning off the hotspot to preserve phone battery (Default: 5 minutes).
              </p>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={form.disconnectDelayMinutes}
                onChange={(e) => setForm({ ...form, disconnectDelayMinutes: parseInt(e.target.value) || 1 })}
                className="w-full accent-orange-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <button type="button" onClick={() => setForm({ ...form, disconnectDelayMinutes: 1 })} className="hover:text-slate-700">1 min</button>
                <button type="button" onClick={() => setForm({ ...form, disconnectDelayMinutes: 3 })} className="hover:text-slate-700">3 min</button>
                <button type="button" onClick={() => setForm({ ...form, disconnectDelayMinutes: 5 })} className="font-bold text-orange-600 bg-orange-50 px-1 rounded">5 min (Default)</button>
                <button type="button" onClick={() => setForm({ ...form, disconnectDelayMinutes: 10 })} className="hover:text-slate-700">10 min</button>
                <button type="button" onClick={() => setForm({ ...form, disconnectDelayMinutes: 15 })} className="hover:text-slate-700">15 min</button>
              </div>
            </div>

            {/* Quick reset button inside timers */}
            {(form.connectDelaySeconds !== 10 || form.disconnectDelayMinutes !== 5) && (
              <button
                type="button"
                onClick={() => setForm({ ...form, connectDelaySeconds: 10, disconnectDelayMinutes: 5 })}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>↺ Reset timers to defaults (10s delay / 5 min grace)</span>
              </button>
            )}
          </div>

          {/* Section 2: Hotspot Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Wifi className="w-3.5 h-3.5 text-blue-600" />
              <span>Hotspot Network Identity</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hotspot SSID
                </label>
                <input
                  type="text"
                  value={form.hotspotSsid}
                  onChange={(e) => setForm({ ...form, hotspotSsid: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wi-Fi Frequency
                </label>
                <select
                  value={form.hotspotBand}
                  onChange={(e) => setForm({ ...form, hotspotBand: e.target.value as '5 GHz' | '2.4 GHz' })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5 GHz">5 GHz (Fastest for modern car navigation)</option>
                  <option value="2.4 GHz">2.4 GHz (Longer range & legacy headunits)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Smart Protections & Alerts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Feedback & Battery Protection</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">Audio Chimes</p>
                  <p className="text-[11px] text-slate-500">Play tone when hotspot activates or starts countdown</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.soundAlerts}
                  onChange={(e) => setForm({ ...form, soundAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">Smart Reconnect Cancellation</p>
                  <p className="text-[11px] text-slate-500">Cancel shutdown if car reconnects during the 5-minute timer</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoCancelIfReconnected}
                  onChange={(e) => setForm({ ...form, autoCancelIfReconnected: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">Low Battery Protection</p>
                  <p className="text-[11px] text-slate-500">Do not turn on hotspot if phone battery is under 15%</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.lowBatteryProtection}
                  onChange={(e) => setForm({ ...form, lowBatteryProtection: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
