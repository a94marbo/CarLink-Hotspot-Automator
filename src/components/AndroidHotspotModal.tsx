import { Shield, Smartphone, Terminal, Cpu, CheckCircle2, AlertTriangle, ExternalLink, X, HelpCircle, Layers } from 'lucide-react';

interface AndroidHotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRooted?: boolean;
  onOpenSettings?: () => void;
}

export function AndroidHotspotModal({
  isOpen,
  onClose,
  isRooted = false,
  onOpenSettings,
}: AndroidHotspotModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Android Hotspot & Root Guide</h3>
              <p className="text-xs text-slate-500">How Wi-Fi tethering works on modern Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-sm text-slate-600">
          {/* Question 1: Is Hotspot Protected? */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
            <div className="flex items-center gap-2 font-semibold text-amber-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Is hotspot activation protected in Android?</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>YES.</strong> Since Android 7.1/8.0 and in all modern Android versions (Android 9 through 15), Google classified Wi-Fi tethering as a sensitive system operation requiring the <code className="bg-amber-200/60 px-1 rounded text-[11px]">TETHER_PRIVILEGED</code> permission. Google restricts third-party apps from silently toggling the phone's mobile Wi-Fi hotspot without root or user interaction.
            </p>
          </div>

          {/* Question 2: Does it require root? */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
              <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Does it require root access?</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>For 100% silent, 0-tap background activation:</strong> Yes, Android requires root access (Magisk, KernelSU) or ADB secure settings.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Your phone root status:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                isRooted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {isRooted ? '✓ Root Detected (0-Tap Auto-Enabled)' : 'Unrooted (1-Tap Mode Active)'}
              </span>
            </div>
          </div>

          {/* Question 3: Connected Clients explanation */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5">
            <div className="flex items-center gap-2 font-semibold text-indigo-950 mb-1">
              <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Why does Connected Clients show &quot;0 Devices Offline&quot;?</span>
            </div>
            <p className="text-xs text-indigo-900 leading-relaxed">
              When the hotspot is turned off, the client monitor shows &quot;Offline&quot;. Once the hotspot turns active, CarLink tracks your connected vehicle. Furthermore, on Android 10+, Google restricted apps from reading low-level <code className="bg-indigo-100 px-1 rounded text-[11px]">/proc/net/arp</code> routing tables, so CarLink pairs Wi-Fi broadcast status with Bluetooth vehicle handshake data.
            </p>
          </div>

          {/* Supported Setup Options */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> 3 Ways to Use CarLink on Your Phone
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">1. Standard 1-Tap Assist (No Root)</span>
                <p className="text-slate-500 mt-0.5">
                  When your car connects, CarLink waits for your configured delay buffer and directly launches the Hotspot settings so you can switch it ON with a single tap.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">2. Samsung Galaxy &quot;Modes &amp; Routines&quot; (0-Tap, No Root)</span>
                <p className="text-slate-500 mt-0.5">
                  If you have a Samsung phone: Open <em>Settings &gt; Modes and Routines &gt; + &gt; If: Bluetooth device connected (Car) &gt; Then: Mobile Hotspot On</em>. It toggles hotspot natively with 0 taps!
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">3. Root Access / Magisk (0-Tap Auto)</span>
                <p className="text-slate-500 mt-0.5">
                  If rooted, CarLink automatically runs system commands via <code className="bg-slate-100 px-1 rounded">su</code> to toggle the tethering engine silently in the background.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {onOpenSettings && (
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Hotspot Settings
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
