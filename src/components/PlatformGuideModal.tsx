import { useState } from 'react';
import { Smartphone, Download, Check, Copy, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';
import { AppSettings, BluetoothDevice } from '../types';
import { generateTaskerProfileXml, downloadFile } from '../utils/nativeExport';

interface PlatformGuideModalProps {
  devices: BluetoothDevice[];
  settings: AppSettings;
  onClose: () => void;
}

export function PlatformGuideModal({ devices, settings, onClose }: PlatformGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'tasker' | 'samsung' | 'macrodroid' | 'ios'>('tasker');
  const [copied, setCopied] = useState(false);

  const triggerDevices = devices.filter(d => d.isTriggerEnabled);
  const deviceListNames = triggerDevices.length > 0 ? triggerDevices.map(d => d.name).join(', ') : 'Your Car';

  const taskerXml = generateTaskerProfileXml(triggerDevices, settings);

  const handleDownloadTasker = () => {
    downloadFile('carlink_hotspot_profile.prf.xml', taskerXml, 'application/xml');
  };

  const handleCopyTasker = () => {
    navigator.clipboard.writeText(taskerXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-xs shrink-0 bg-slate-950 flex items-center justify-center p-0.5 z-10" title="Active Hotspot Icon">
                <img 
                  src="/carlink-active.jpg" 
                  alt="CarLink Active Hotspot" 
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shadow-xs shrink-0 bg-slate-950 flex items-center justify-center p-0.5 opacity-80" title="Inactive Hotspot Icon">
                <img 
                  src="/carlink-inactive.jpg" 
                  alt="CarLink Inactive Hotspot" 
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Phone Integration & Native Automations</h3>
              <p className="text-xs text-slate-500">Run this {settings.connectDelaySeconds}s ON / {settings.disconnectDelayMinutes}m OFF logic in the background on your phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-100 mt-4 pb-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tasker')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'tasker' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Android Tasker (Recommended)
          </button>
          <button
            onClick={() => setActiveTab('samsung')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'samsung' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Samsung Modes & Routines
          </button>
          <button
            onClick={() => setActiveTab('macrodroid')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'macrodroid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            MacroDroid
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'ios' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Apple iOS Shortcuts
          </button>
        </div>

        {/* Tab 1: Tasker */}
        {activeTab === 'tasker' && (
          <div className="mt-4 space-y-4 text-xs text-slate-600">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-blue-900">
              <p className="font-semibold mb-1">Pre-configured Tasker Profile Ready for Download</p>
              <p className="text-[11px] text-blue-800">
                This custom profile is tuned to your selected cars ({deviceListNames}), waits {settings.connectDelaySeconds}s upon connection to trigger Hotspot ON, and waits {settings.disconnectDelayMinutes}m upon disconnection before turning Hotspot OFF.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTasker}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Tasker Profile (.xml)
              </button>

              <button
                onClick={handleCopyTasker}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied XML' : 'Copy XML Code'}
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1">
              <li>Open <strong>Tasker</strong> on your Android phone.</li>
              <li>Long press the <strong>PROFILES</strong> tab and select <strong>Import Profile</strong>.</li>
              <li>Select the downloaded <code>carlink_hotspot_profile.prf.xml</code> file.</li>
              <li>Ensure Tasker has permission for <em>Write Secure Settings</em> or <em>Wi-Fi Hotspot Toggle</em>. Done!</li>
            </ol>
          </div>
        )}

        {/* Tab 2: Samsung Routines */}
        {activeTab === 'samsung' && (
          <div className="mt-4 space-y-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">For Samsung Galaxy users (built-in, no extra app needed):</p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">Step 1: Create the Car Hotspot Routine</p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
                <li>Go to <strong>Settings → Modes and Routines → Routines (+)</strong></li>
                <li><strong>If (Trigger):</strong> Select <strong>Bluetooth device connected</strong> → choose <strong>{deviceListNames}</strong></li>
                <li><strong>Then (Action):</strong> Add <strong>Wait before next action</strong> → Set to <strong>{settings.connectDelaySeconds} seconds</strong></li>
                <li>Add action: <strong>Connections → Mobile Hotspot → On</strong></li>
                <li><strong>When routine ends (Exit action):</strong> Set delay <strong>{settings.disconnectDelayMinutes} minutes</strong>, then <strong>Mobile Hotspot → Off</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: MacroDroid */}
        {activeTab === 'macrodroid' && (
          <div className="mt-4 space-y-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">MacroDroid 2-Macro Setup:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Macro 1: Car Connect</p>
                <p className="text-[11px] text-slate-500"><strong>Trigger:</strong> Bluetooth Connected ({deviceListNames})</p>
                <p className="text-[11px] text-slate-500"><strong>Action 1:</strong> Cancel Macro "Car Disconnect"</p>
                <p className="text-[11px] text-slate-500"><strong>Action 2:</strong> Wait {settings.connectDelaySeconds} seconds</p>
                <p className="text-[11px] text-slate-500"><strong>Action 3:</strong> Hotspot On</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Macro 2: Car Disconnect</p>
                <p className="text-[11px] text-slate-500"><strong>Trigger:</strong> Bluetooth Disconnected ({deviceListNames})</p>
                <p className="text-[11px] text-slate-500"><strong>Action 1:</strong> Wait {settings.disconnectDelayMinutes} minutes</p>
                <p className="text-[11px] text-slate-500"><strong>Action 2:</strong> Hotspot Off</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: iOS */}
        {activeTab === 'ios' && (
          <div className="mt-4 space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">Apple Shortcuts (iOS 16+ / 17+):</p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
                <li>Open the <strong>Shortcuts</strong> app → tap <strong>Automation</strong> → <strong>(+) New Automation</strong></li>
                <li>Select <strong>CarPlay</strong> (Connects) OR <strong>Bluetooth</strong> → select <strong>{deviceListNames}</strong></li>
                <li>Choose <strong>Run Immediately</strong> (without asking)</li>
                <li>Add action: <strong>Wait {settings.connectDelaySeconds} seconds</strong></li>
                <li>Add action: <strong>Set Personal Hotspot → Turn On</strong></li>
                <li>Create second automation for <strong>Bluetooth Disconnects</strong> → Wait {settings.disconnectDelayMinutes * 60} seconds → Set Personal Hotspot → Turn Off</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
