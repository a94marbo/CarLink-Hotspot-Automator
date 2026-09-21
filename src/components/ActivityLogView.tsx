import { ActivityLogItem } from '../types';
import { History, Trash2, Download, CheckCircle2, Clock, Wifi, WifiOff, AlertTriangle, Bluetooth } from 'lucide-react';
import { downloadFile } from '../utils/nativeExport';

interface ActivityLogViewProps {
  logs: ActivityLogItem[];
  onClearLogs: () => void;
}

export function ActivityLogView({ logs, onClearLogs }: ActivityLogViewProps) {
  const getLogIcon = (type: ActivityLogItem['type']) => {
    switch (type) {
      case 'bluetooth_connect':
        return <Bluetooth className="w-4 h-4 text-blue-600" />;
      case 'bluetooth_disconnect':
        return <Bluetooth className="w-4 h-4 text-slate-400" />;
      case 'countdown_started':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'countdown_cancelled':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'hotspot_on':
        return <Wifi className="w-4 h-4 text-emerald-600" />;
      case 'hotspot_off':
        return <WifiOff className="w-4 h-4 text-rose-500" />;
      case 'manual_override':
        return <AlertTriangle className="w-4 h-4 text-indigo-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleExport = () => {
    const text = logs.map(l => `[${l.timestamp.toISOString()}] [${l.type.toUpperCase()}] ${l.title}: ${l.description}`).join('\n');
    downloadFile(`carlink_hotspot_activity_${Date.now()}.txt`, text, 'text/plain');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Automation Activity & Event History</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Export Log File"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearLogs}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No events recorded yet. Connect a car Bluetooth device to observe live triggers.
          </div>
        ) : (
          logs.map((item) => (
            <div key={item.id} className="p-3.5 sm:px-5 flex items-start gap-3 hover:bg-slate-50/70 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {getLogIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 break-words">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
