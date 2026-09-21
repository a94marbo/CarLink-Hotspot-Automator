import { useState } from 'react';
import { Car, KeyRound, Wifi, WifiOff, ArrowRight, Play, RotateCcw, FastForward, CheckCircle2, ShieldCheck, Timer } from 'lucide-react';
import { BluetoothDevice, HotspotState, AppSettings } from '../types';

interface DriveSimulatorProps {
  devices: BluetoothDevice[];
  hotspotState: HotspotState;
  settings: AppSettings;
  onSimulateConnect: (device: BluetoothDevice) => void;
  onSimulateDisconnect: (device: BluetoothDevice) => void;
  onFastForward: () => void;
  onClose: () => void;
}

export function DriveSimulator({
  devices,
  hotspotState,
  settings,
  onSimulateConnect,
  onSimulateDisconnect,
  onFastForward,
  onClose,
}: DriveSimulatorProps) {
  const triggerDevices = devices.filter(d => d.isTriggerEnabled);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    triggerDevices[0]?.id || devices[0]?.id || ''
  );

  const activeCar = devices.find(d => d.id === selectedDeviceId) || devices[0];
  const isCarConnected = activeCar?.isConnected;

  const getActivePhase = () => {
    if (!isCarConnected && hotspotState.status === 'off') return 1;
    if (isCarConnected && hotspotState.status === 'connecting_delay') return 2;
    if (isCarConnected && hotspotState.status === 'active') return 3;
    if (!isCarConnected && hotspotState.status === 'disconnecting_delay') return 4;
    return 5;
  };

  const currentPhase = getActivePhase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden my-4">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-950 flex items-center justify-center p-0.5 transition-all duration-300 ${
            hotspotState.status === 'active' 
              ? 'border-2 border-emerald-400 ring-2 ring-emerald-400/40 shadow-emerald-500/30' 
              : 'border border-white/20 shadow-sm'
          }`}>
            <img 
              src={hotspotState.status === 'active' ? '/carlink-active.jpg' : '/carlink-inactive.jpg'} 
              alt={hotspotState.status === 'active' ? 'CarLink Hotspot Enabled' : 'CarLink Hotspot Inactive'} 
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>Interactive Car Trip Simulator</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                hotspotState.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-white/10 text-slate-300 border border-white/10'
              }`}>
                {hotspotState.status === 'active' ? 'Hotspot ON' : 'Hotspot OFF'}
              </span>
            </h3>
            <p className="text-xs text-blue-200">
              Test drive the real-time {settings.connectDelaySeconds}s turn-on and {settings.disconnectDelayMinutes}m auto-off automation flow
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Simulator Body */}
      <div className="p-6">
        {/* Step Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div className={`p-3 rounded-xl border transition-all ${
            currentPhase === 1
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100'
              : 'bg-slate-50 border-slate-200 opacity-70'
          }`}>
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Step 1</span>
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Enter Car & Start</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Car Bluetooth connects to phone</p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${
            currentPhase === 2
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
              : 'bg-slate-50 border-slate-200 opacity-70'
          }`}>
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Step 2</span>
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
              <Timer className="w-4 h-4 text-amber-600" />
              <span>{settings.connectDelaySeconds}s Delay Buffer</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Stabilization timer running</p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${
            currentPhase === 3
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100'
              : 'bg-slate-50 border-slate-200 opacity-70'
          }`}>
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Step 3</span>
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>Hotspot Active</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Car links to phone Wi-Fi</p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${
            currentPhase === 4
              ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-100'
              : 'bg-slate-50 border-slate-200 opacity-70'
          }`}>
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Step 4</span>
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span>{settings.disconnectDelayMinutes}m Grace Timer</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Auto-off when leaving car</p>
          </div>
        </div>

        {/* Selected Car Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-blue-600" />
            <div>
              <label htmlFor="select-simulator-car" className="text-xs font-bold text-slate-700 block">
                Select Test Vehicle:
              </label>
              <select
                id="select-simulator-car"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.isTriggerEnabled ? '(Trigger Armed)' : '(Trigger Disabled)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCarConnected ? (
              <button
                id="btn-sim-enter-car"
                onClick={() => activeCar && onSimulateConnect(activeCar)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                1. Start Engine (Connect Bluetooth)
              </button>
            ) : (
              <button
                id="btn-sim-leave-car"
                onClick={() => activeCar && onSimulateDisconnect(activeCar)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors"
              >
                <Car className="w-3.5 h-3.5 text-orange-400" />
                Turn Off Engine (Disconnect Bluetooth)
              </button>
            )}

            {hotspotState.status === 'disconnecting_delay' && (
              <button
                id="btn-sim-fast-forward"
                onClick={onFastForward}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300 transition-colors"
                title="Fast forward 60 seconds of disconnect timer"
              >
                <FastForward className="w-3.5 h-3.5" />
                Fast-Forward 60s
              </button>
            )}
          </div>
        </div>

        {/* Live Simulation Explanation */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">How this matches real-world driving:</p>
            <p className="text-blue-800">
              When you start your car, Bluetooth handshakes instantly, but powering on your phone's hotspot right away can cause false triggers or drain battery if you just turned the ignition for a second. The <strong>{settings.connectDelaySeconds}-second delay buffer</strong> ensures you're truly driving before broadcasting Wi-Fi.
            </p>
            <p className="text-blue-800">
              Likewise, when you stop at a gas station or step out briefly for 2 minutes, the <strong>{settings.disconnectDelayMinutes}-minute grace period</strong> keeps the hotspot alive so your car's navigation and Spotify don't drop offline if you get right back in!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
