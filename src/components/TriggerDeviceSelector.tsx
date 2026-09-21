import { useState, useMemo } from 'react';
import { 
  Car, 
  Bluetooth, 
  Plus, 
  Check, 
  Trash2, 
  Radio, 
  Headphones, 
  Watch, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckSquare, 
  Square,
  Sparkles,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { BluetoothDevice, DeviceType } from '../types';

interface TriggerDeviceSelectorProps {
  devices: BluetoothDevice[];
  onToggleTrigger: (deviceId: string) => void;
  onToggleAllCars: (enable: boolean) => void;
  onToggleConnection: (deviceId: string) => void;
  onAddDevice: (device: Omit<BluetoothDevice, 'id' | 'isConnected'>) => void;
  onDeleteDevice: (deviceId: string) => void;
  onScanWebBluetooth: () => Promise<void>;
  onFetchPairedDevices: () => Promise<void>;
  isScanning: boolean;
  scanError: string | null;
  connectDelaySeconds?: number;
  isNative?: boolean;
  onOpenPhoneBluetoothSettings?: () => void;
}

const CAR_PRESETS = [
  { name: 'BMW iDrive 8 / Operating System 8.5', brand: 'BMW' },
  { name: 'Tesla Model Y / Model 3', brand: 'Tesla' },
  { name: 'Mercedes-Benz MBUX', brand: 'Mercedes' },
  { name: 'Audi MMI Touch Response', brand: 'Audi' },
  { name: 'Porsche Communication Management (PCM)', brand: 'Porsche' },
  { name: 'Ford SYNC 4A', brand: 'Ford' },
  { name: 'Volkswagen Discover Pro / Car-Net', brand: 'Volkswagen' },
  { name: 'Toyota Smart Connect / Multimedia', brand: 'Toyota' },
  { name: 'Volvo Sensus / Google Built-in', brand: 'Volvo' },
  { name: 'Wireless Android Auto Dongle', brand: 'Ottocast / Carlinkit' },
];

export function TriggerDeviceSelector({
  devices,
  onToggleTrigger,
  onToggleAllCars,
  onToggleConnection,
  onAddDevice,
  onDeleteDevice,
  onScanWebBluetooth,
  onFetchPairedDevices,
  isScanning,
  scanError,
  connectDelaySeconds = 10,
  isNative = false,
  onOpenPhoneBluetoothSettings,
}: TriggerDeviceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cars' | 'triggers' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<DeviceType>('car');
  const [newCarBrand, setNewCarBrand] = useState('BMW');
  const [newMac, setNewMac] = useState('');

  // Counts
  const totalCars = devices.filter(d => d.type === 'car').length;
  const triggerCarsCount = devices.filter(d => d.isTriggerEnabled && d.type === 'car').length;
  const totalTriggerCount = devices.filter(d => d.isTriggerEnabled).length;
  const connectedTriggerDevices = devices.filter(d => d.isTriggerEnabled && d.isConnected);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // Search filter
      const matchesSearch = 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.carBrand && device.carBrand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        device.macAddress.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (selectedFilter === 'cars') return device.type === 'car';
      if (selectedFilter === 'triggers') return device.isTriggerEnabled;
      if (selectedFilter === 'inactive') return !device.isTriggerEnabled;
      return true;
    });
  }, [devices, searchQuery, selectedFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddDevice({
      name: newName.trim(),
      type: newType,
      carBrand: newType === 'car' ? newCarBrand : undefined,
      macAddress: newMac.trim() || `00:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
      isTriggerEnabled: true,
      rssi: -62,
    });

    setNewName('');
    setShowAddModal(false);
  };

  const handleAddPreset = (preset: { name: string; brand: string }) => {
    onAddDevice({
      name: preset.name,
      type: 'car',
      carBrand: preset.brand,
      macAddress: `FC:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
      isTriggerEnabled: true,
      rssi: -55,
    });
    setShowPresetDropdown(false);
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'car':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'headphones':
        return <Headphones className="w-5 h-5 text-indigo-500" />;
      case 'smartwatch':
        return <Watch className="w-5 h-5 text-teal-500" />;
      default:
        return <Bluetooth className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header section with Summary Badges */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Paired Cars & Bluetooth Triggers
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {triggerCarsCount} of {totalCars} Cars Armed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select precisely which cars automatically turn on your phone's Wi-Fi hotspot after {connectDelaySeconds} seconds.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Action: Sync Phone Bluetooth */}
            <button
              id="btn-sync-phone-bt"
              onClick={onFetchPairedDevices}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
              title="Query paired Bluetooth devices directly from phone memory"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <span>{isScanning ? 'Syncing...' : 'Sync Phone Bluetooth'}</span>
            </button>

            {/* If on Android Native, link directly to Android Bluetooth settings */}
            {isNative && onOpenPhoneBluetoothSettings && (
              <button
                id="btn-open-phone-bt-settings"
                onClick={onOpenPhoneBluetoothSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                title="Open Phone Bluetooth Settings to pair a new vehicle"
              >
                <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                <span>Pair in Settings</span>
              </button>
            )}

            {/* Quick Preset Dropdown */}
            <div className="relative">
              <button
                id="btn-quick-presets"
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                title="Add popular car models with 1 click"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Presets</span>
              </button>

              {showPresetDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100">
                    Quick-Add Vehicle:
                  </div>
                  {CAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddPreset(p)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold truncate">{p.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1 rounded ml-2">
                        {p.brand}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Custom Car */}
            <button
              id="btn-add-car-device"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Manually enter vehicle name and MAC address"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>
        </div>

        {/* Real Phone vs Web Mode Banner */}
        {isNative ? (
          <div className="mt-3.5 p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Android Paired Sync:</strong> Reading bonded Bluetooth devices directly from your phone. Toggle <strong>Trigger Hotspot</strong> for each vehicle.
              </span>
            </div>
            <button
              onClick={onFetchPairedDevices}
              disabled={isScanning}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-2.5 py-1 rounded-md shadow-2xs shrink-0 flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Syncing...' : 'Sync Paired List'}</span>
            </button>
          </div>
        ) : (
          <div className="mt-3.5 p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Car Selection:</strong> Select which cars trigger your hotspot. (When running on your Android phone, this reads paired vehicles from phone memory).
              </span>
            </div>
            <button
              onClick={onFetchPairedDevices}
              disabled={isScanning}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2.5 py-1 rounded-md shadow-2xs shrink-0 flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>
        )}

        {/* Filter bar & Search */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search paired cars or devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Devices ({devices.length})
            </button>
            <button
              onClick={() => setSelectedFilter('cars')}
              className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                selectedFilter === 'cars'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Car className="w-3 h-3" />
              Cars ({totalCars})
            </button>
            <button
              onClick={() => setSelectedFilter('triggers')}
              className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                selectedFilter === 'triggers'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-3 h-3" />
              Armed ({totalTriggerCount})
            </button>
            <button
              onClick={() => setSelectedFilter('inactive')}
              className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                selectedFilter === 'inactive'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Disabled
            </button>
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-select-all-cars"
              onClick={() => onToggleAllCars(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
              title="Enable all cars to trigger hotspot"
            >
              <CheckSquare className="w-3 h-3 text-blue-600" />
              Arm All Cars
            </button>
            <button
              id="btn-deselect-all-cars"
              onClick={() => onToggleAllCars(false)}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
              title="Disable hotspot trigger for all devices"
            >
              <Square className="w-3 h-3 text-slate-400" />
              Disarm All
            </button>
          </div>
        </div>
      </div>

      {scanError && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{scanError} (You can also select or add cars manually using the list below)</span>
        </div>
      )}

      {/* Device List */}
      <div className="divide-y divide-slate-100">
        {filteredDevices.map((device) => {
          const isTriggerActive = device.isTriggerEnabled;
          const isConnected = device.isConnected;

          return (
            <div
              key={device.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isConnected && isTriggerActive
                  ? 'bg-blue-50/50'
                  : isTriggerActive
                  ? 'bg-white hover:bg-blue-50/20'
                  : 'bg-slate-50/50 hover:bg-slate-50 opacity-80'
              }`}
            >
              {/* Left Column: Device Info */}
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-4 ring-emerald-100/70'
                    : isTriggerActive
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  {getDeviceIcon(device.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900">
                      {device.name}
                    </h4>
                    {device.carBrand && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {device.carBrand}
                      </span>
                    )}
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Connected Now
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Disconnected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="font-mono text-[11px] text-slate-400">
                      MAC: {device.macAddress}
                    </span>
                    {device.rssi && (
                      <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Radio className="w-3 h-3 text-slate-400" />
                        {device.rssi} dBm
                      </span>
                    )}
                    {device.isRealNativeDevice ? (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Smartphone className="w-2.5 h-2.5 text-emerald-600" />
                        Phone Paired
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        Preset / Custom
                      </span>
                    )}
                    {/* Trigger Status Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isTriggerActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {isTriggerActive ? (
                        <>
                          <Zap className="w-2.5 h-2.5 text-emerald-600" />
                          Triggers {connectDelaySeconds}s Hotspot
                        </>
                      ) : (
                        'Ignored (No Hotspot)'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Trigger Toggle Switch & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Connect / Disconnect Simulator Button */}
                <button
                  id={`btn-toggle-connection-${device.id}`}
                  onClick={() => onToggleConnection(device.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isConnected
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={isConnected ? 'Simulate Disconnecting Bluetooth' : 'Simulate Connecting Bluetooth'}
                >
                  {isConnected ? 'Disconnect' : 'Test Connect'}
                </button>

                {/* Hotspot Trigger Switch with Clear Label */}
                <label
                  htmlFor={`trigger-switch-${device.id}`}
                  className={`flex items-center gap-2.5 cursor-pointer select-none py-1.5 px-3 rounded-xl border transition-all ${
                    isTriggerActive
                      ? 'bg-blue-50/80 border-blue-200 hover:border-blue-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                  title={isTriggerActive ? 'Click to disable hotspot trigger for this car' : 'Click to enable hotspot trigger for this car'}
                >
                  <input
                    type="checkbox"
                    id={`trigger-switch-${device.id}`}
                    checked={isTriggerActive}
                    onChange={() => onToggleTrigger(device.id)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5.5 rounded-full transition-colors relative ${
                    isTriggerActive ? 'bg-blue-600' : 'bg-slate-300'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 shadow-xs transition-transform ${
                      isTriggerActive ? 'translate-x-5' : 'translate-x-0.75'
                    }`} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-xs font-bold leading-tight ${
                      isTriggerActive ? 'text-blue-900' : 'text-slate-600'
                    }`}>
                      {isTriggerActive ? 'Trigger Armed' : 'Ignored'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isTriggerActive ? 'Auto Wi-Fi ON' : 'No Action'}
                    </span>
                  </div>
                </label>

                {/* Delete button */}
                <button
                  onClick={() => onDeleteDevice(device.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove device from list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredDevices.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <Bluetooth className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No matching Bluetooth devices found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? `No devices match "${searchQuery}". Try clearing search.` : 'Click "Add Car" or "Car Presets" above to register your vehicle.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {connectedTriggerDevices.length > 0 ? (
              <strong className="text-slate-900 font-semibold">
                Currently triggering: {connectedTriggerDevices.map(d => d.name).join(', ')}
              </strong>
            ) : (
              <span>
                <strong>{triggerCarsCount}</strong> of <strong>{totalCars}</strong> cars configured to turn on Wi-Fi hotspot upon Bluetooth handshake.
              </span>
            )}
          </span>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Toggle the switch on any car to instantly include or exclude it.
        </span>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add Paired Car Bluetooth</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Car / Head Unit Bluetooth Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BMW iDrive 7, Tesla Model 3, Ford SYNC, VW BT"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Device Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DeviceType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="car">Car Infotainment / Head Unit</option>
                    <option value="headphones">Headphones / Audio</option>
                    <option value="smartwatch">Smartwatch</option>
                    <option value="other">Other Bluetooth Device</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Car Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BMW, Tesla, Audi, Ford"
                    value={newCarBrand}
                    onChange={(e) => setNewCarBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bluetooth MAC Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. FC:58:FA:7E:11:02"
                  value={newMac}
                  onChange={(e) => setNewMac(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  Save Car to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
