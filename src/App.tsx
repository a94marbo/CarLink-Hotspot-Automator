/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { BluetoothDevice, HotspotState, AppSettings, ActivityLogItem } from './types';
import { playChime } from './utils/audio';
import { Header } from './components/Header';
import { HotspotStatusCard } from './components/HotspotStatusCard';
import { TriggerDeviceSelector } from './components/TriggerDeviceSelector';
import { DriveSimulator } from './components/DriveSimulator';
import { ActivityLogView } from './components/ActivityLogView';
import { SettingsModal } from './components/SettingsModal';
import { PlatformGuideModal } from './components/PlatformGuideModal';
import { TimerConfigCard } from './components/TimerConfigCard';
import { Sparkles, Car, ShieldCheck, Zap, Info } from 'lucide-react';
import { 
  fetchPhonePairedDevices, 
  isNativeApp, 
  openPhoneBluetoothSettings, 
  openPhoneHotspotSettings,
  startNativeBluetoothMonitoring,
  triggerNativeHotspot,
  BluetoothStateChangeEvent
} from './utils/bluetoothNative';

const INITIAL_DEVICES: BluetoothDevice[] = [
  {
    id: 'dev-bmw-1',
    name: 'BMW iDrive 7',
    macAddress: '9C:64:8B:12:44:A1',
    type: 'car',
    carBrand: 'BMW',
    isConnected: false,
    isTriggerEnabled: true,
    rssi: -58,
  },
  {
    id: 'dev-tesla-2',
    name: 'Tesla Model 3',
    macAddress: 'B4:52:7E:98:31:0C',
    type: 'car',
    carBrand: 'Tesla',
    isConnected: false,
    isTriggerEnabled: true,
    rssi: -64,
  },
  {
    id: 'dev-audi-3',
    name: 'Audi MMI 3G+',
    macAddress: '00:1E:4C:7A:3F:89',
    type: 'car',
    carBrand: 'Audi',
    isConnected: false,
    isTriggerEnabled: false,
    rssi: -72,
  },
  {
    id: 'dev-sony-4',
    name: 'Sony WH-1000XM5',
    macAddress: '70:26:05:3D:88:14',
    type: 'headphones',
    isConnected: false,
    isTriggerEnabled: false,
    rssi: -45,
  },
];

const INITIAL_SETTINGS: AppSettings = {
  connectDelaySeconds: 10,
  disconnectDelayMinutes: 5,
  soundAlerts: true,
  vibrateAlerts: true,
  autoCancelIfReconnected: true,
  hotspotSsid: 'Phone_InCar_Hotspot',
  hotspotPassword: 'fastconnection5g',
  hotspotBand: '5 GHz',
  autoStartService: true,
  batteryThreshold: 15,
  lowBatteryProtection: true,
};

export default function App() {
  const [devices, setDevices] = useState<BluetoothDevice[]>(() => {
    const saved = localStorage.getItem('carlink_devices');
    return saved ? JSON.parse(saved) : INITIAL_DEVICES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('carlink_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [hotspotState, setHotspotState] = useState<HotspotState>({
    status: 'off',
    countdownRemaining: 0,
    countdownTotal: 0,
    ssid: settings.hotspotSsid,
    band: settings.hotspotBand,
    security: 'WPA3 Personal',
    clientCount: 0,
    connectedClients: [],
  });

  const [logs, setLogs] = useState<ActivityLogItem[]>([
    {
      id: 'log-init',
      timestamp: new Date(),
      type: 'config_change',
      title: 'Automator Service Armed',
      description: `Monitoring Bluetooth. Trigger delay set to ${settings.connectDelaySeconds}s; disconnect delay set to ${settings.disconnectDelayMinutes}m.`,
      level: 'info',
    },
  ]);

  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('carlink_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('carlink_settings', JSON.stringify(settings));
    setHotspotState(prev => ({
      ...prev,
      ssid: settings.hotspotSsid,
      band: settings.hotspotBand,
    }));
  }, [settings]);

  // Dynamically update browser tab favicon & apple-touch-icon according to hotspot active/inactive state
  useEffect(() => {
    const isHotspotActive = hotspotState.status === 'active';
    const iconUrl = isHotspotActive ? '/carlink-active.jpg' : '/carlink-inactive.jpg';

    const favicons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
    favicons.forEach(link => {
      link.href = iconUrl;
    });
  }, [hotspotState.status]);

  // Helper to add activity log
  const addLog = (
    type: ActivityLogItem['type'],
    title: string,
    description: string,
    level: ActivityLogItem['level'] = 'info',
    deviceName?: string
  ) => {
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      title,
      description,
      level,
      deviceName,
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // Timer Tick Engine
  useEffect(() => {
    if (hotspotState.status === 'off' || hotspotState.status === 'active') {
      return;
    }

    const timer = setInterval(() => {
      setHotspotState(prev => {
        if (prev.status === 'connecting_delay') {
          if (prev.countdownRemaining <= 1) {
            // Trigger real native Android hotspot activation
            triggerNativeHotspot(true).catch(err => {
              console.warn('Native hotspot turn on error:', err);
            });

            // Hotspot Turn ON
            if (settings.soundAlerts) playChime('hotspot_on');
            if (settings.vibrateAlerts && navigator.vibrate) navigator.vibrate([100, 50, 100]);

            addLog(
              'hotspot_on',
              'Wi-Fi Hotspot Turned ON',
              `${settings.connectDelaySeconds}-second delay elapsed. Broadcasting SSID "${prev.ssid}". Car client connected.`,
              'success',
              prev.triggeredDeviceName
            );

            return {
              ...prev,
              status: 'active',
              countdownRemaining: 0,
              countdownTotal: 0,
              activeSince: Date.now(),
              clientCount: 1,
              connectedClients: [
                {
                  id: 'client-car',
                  name: prev.triggeredDeviceName ? `${prev.triggeredDeviceName} (Nav)` : 'Car Infotainment',
                  ip: '192.168.43.15',
                  mac: '8C:85:90:4B:92:FE',
                  connectedAt: Date.now(),
                  dataUsageMb: 12.4,
                },
              ],
            };
          }
          return {
            ...prev,
            countdownRemaining: prev.countdownRemaining - 1,
          };
        }

        if (prev.status === 'disconnecting_delay') {
          if (prev.countdownRemaining <= 1) {
            // Trigger real native Android hotspot deactivation
            triggerNativeHotspot(false).catch(err => {
              console.warn('Native hotspot turn off error:', err);
            });

            // Hotspot Turn OFF
            if (settings.soundAlerts) playChime('hotspot_off');
            if (settings.vibrateAlerts && navigator.vibrate) navigator.vibrate(200);

            addLog(
              'hotspot_off',
              'Wi-Fi Hotspot Turned OFF',
              `${settings.disconnectDelayMinutes}-minute disconnect grace period elapsed. Hotspot powered down to conserve phone battery.`,
              'info'
            );

            return {
              ...prev,
              status: 'off',
              countdownRemaining: 0,
              countdownTotal: 0,
              clientCount: 0,
              connectedClients: [],
              triggeredDeviceId: undefined,
              triggeredDeviceName: undefined,
            };
          }
          return {
            ...prev,
            countdownRemaining: prev.countdownRemaining - 1,
          };
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hotspotState.status, settings]);

  // Handle toggling trigger setting for a device
  const handleToggleTrigger = (deviceId: string) => {
    setDevices(prev =>
      prev.map(d => {
        if (d.id === deviceId) {
          const nextState = !d.isTriggerEnabled;
          addLog(
            'config_change',
            nextState ? 'Trigger Enabled' : 'Trigger Disabled',
            `Device "${d.name}" will ${nextState ? 'now' : 'no longer'} trigger Wi-Fi hotspot on connect.`,
            'info',
            d.name
          );
          return { ...d, isTriggerEnabled: nextState };
        }
        return d;
      })
    );
  };

  // Handle Bluetooth device connect/disconnect event (from UI simulator, test button, or real native ACL broadcast)
  const handleToggleConnection = (identifier: string, forceState?: boolean) => {
    // Lookup by id or by MAC address
    const target = devices.find(d => d.id === identifier || d.macAddress === identifier);
    if (!target) return;

    const shouldConnect = forceState !== undefined ? forceState : !target.isConnected;

    if (shouldConnect) {
      // Connecting
      setDevices(prev => prev.map(d => (d.id === target.id || d.macAddress === target.macAddress ? { ...d, isConnected: true, lastConnectedAt: Date.now() } : d)));
      if (settings.soundAlerts) playChime('device_connected');

      addLog(
        'bluetooth_connect',
        `Bluetooth Connected: ${target.name}`,
        `Device handshake confirmed. ${target.isTriggerEnabled ? `Armed for ${settings.connectDelaySeconds}s hotspot activation.` : 'Not configured as trigger.'}`,
        'info',
        target.name
      );

      if (target.isTriggerEnabled) {
        // If we were in the middle of a shutdown timer, cancel it!
        if (hotspotState.status === 'disconnecting_delay' && settings.autoCancelIfReconnected) {
          setHotspotState(prev => ({
            ...prev,
            status: 'active',
            countdownRemaining: 0,
            countdownTotal: 0,
            triggeredDeviceId: target.id,
            triggeredDeviceName: target.name,
          }));
          addLog(
            'countdown_cancelled',
            'Disconnect Grace Timer Cancelled',
            `Car "${target.name}" reconnected during the ${settings.disconnectDelayMinutes}-minute grace window. Hotspot remains ACTIVE.`,
            'success',
            target.name
          );
        } else if (hotspotState.status === 'off') {
          // Start the connect delay timer
          setHotspotState(prev => ({
            ...prev,
            status: 'connecting_delay',
            countdownRemaining: settings.connectDelaySeconds,
            countdownTotal: settings.connectDelaySeconds,
            triggeredDeviceId: target.id,
            triggeredDeviceName: target.name,
          }));
          addLog(
            'countdown_started',
            `${settings.connectDelaySeconds}-Second Activation Delay Started`,
            `Car "${target.name}" connected. Starting ${settings.connectDelaySeconds}s countdown before turning on hotspot.`,
            'warning',
            target.name
          );
        }
      }
    } else {
      // Disconnecting
      setDevices(prev => prev.map(d => (d.id === target.id || d.macAddress === target.macAddress ? { ...d, isConnected: false } : d)));
      if (settings.soundAlerts) playChime('device_disconnected');

      addLog(
        'bluetooth_disconnect',
        `Bluetooth Disconnected: ${target.name}`,
        `Device connection terminated.`,
        'info',
        target.name
      );

      // Check if any other trigger device is still connected
      const otherTriggerConnected = devices.some(d => (d.id !== target.id && d.macAddress !== target.macAddress) && d.isTriggerEnabled && d.isConnected);

      if (!otherTriggerConnected && target.isTriggerEnabled) {
        if (hotspotState.status === 'connecting_delay') {
          // Abort turn-on if disconnected before buffer finished
          setHotspotState(prev => ({
            ...prev,
            status: 'off',
            countdownRemaining: 0,
            countdownTotal: 0,
            triggeredDeviceId: undefined,
            triggeredDeviceName: undefined,
          }));
          addLog(
            'countdown_cancelled',
            'Activation Aborted',
            `Car disconnected before the ${settings.connectDelaySeconds}s buffer finished. Hotspot was not turned on.`,
            'warning',
            target.name
          );
        } else if (hotspotState.status === 'active') {
          // Start disconnect countdown
          const totalSec = settings.disconnectDelayMinutes * 60;
          setHotspotState(prev => ({
            ...prev,
            status: 'disconnecting_delay',
            countdownRemaining: totalSec,
            countdownTotal: totalSec,
          }));
          addLog(
            'countdown_started',
            `${settings.disconnectDelayMinutes}-Minute Auto-Off Countdown Initiated`,
            `Car disconnected. Hotspot will shut down in ${settings.disconnectDelayMinutes} minutes to save phone battery unless reconnected.`,
            'warning',
            target.name
          );
        }
      }
    }
  };

  // Add custom device
  const handleAddDevice = (deviceData: Omit<BluetoothDevice, 'id' | 'isConnected'>) => {
    const newDevice: BluetoothDevice = {
      ...deviceData,
      id: `dev-custom-${Date.now()}`,
      isConnected: false,
    };
    setDevices(prev => [newDevice, ...prev]);
    addLog('config_change', 'New Device Added', `Registered "${newDevice.name}" as an automator device.`, 'info', newDevice.name);
  };

  // Delete device
  const handleDeleteDevice = (deviceId: string) => {
    const target = devices.find(d => d.id === deviceId);
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    if (target) {
      addLog('config_change', 'Device Removed', `Removed "${target.name}" from Bluetooth registry.`, 'info');
    }
  };

  // Batch toggle triggers for all car devices
  const handleToggleAllCars = (enable: boolean) => {
    setDevices(prev =>
      prev.map(d => {
        if (d.type === 'car') {
          return { ...d, isTriggerEnabled: enable };
        }
        return d;
      })
    );
    addLog(
      'config_change',
      enable ? 'All Cars Armed' : 'All Cars Disarmed',
      `Bulk updated trigger configuration: Hotspot automation ${enable ? 'ENABLED' : 'DISABLED'} for all registered cars.`,
      'info'
    );
  };

  // Direct timer update handler for editable delay buffer and grace period
  const handleUpdateTimers = (connectDelaySeconds: number, disconnectDelayMinutes: number) => {
    setSettings(prev => ({
      ...prev,
      connectDelaySeconds,
      disconnectDelayMinutes,
    }));
    addLog(
      'config_change',
      'Timers Updated',
      `Car connect delay buffer adjusted to ${connectDelaySeconds}s; Disconnect grace period adjusted to ${disconnectDelayMinutes}m.`,
      'info'
    );
  };

  // Reset timers back to defaults (10s delay / 5m grace)
  const handleResetDefaultTimers = () => {
    setSettings(prev => ({
      ...prev,
      connectDelaySeconds: 10,
      disconnectDelayMinutes: 5,
    }));
    addLog(
      'config_change',
      'Timers Restored to Defaults',
      'Reset timing rules to standard defaults: 10 seconds connect delay buffer and 5 minutes disconnect grace period.',
      'info'
    );
  };

  // Auto-sync paired Bluetooth cars & start live ACL connection monitoring on phone startup
  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    // 1. Initial bonded paired device scan
    handleFetchPairedDevices();

    // 2. Start real-time native Bluetooth ACL connection broadcast monitor
    let cleanupFn: (() => void) | null = null;
    let isMounted = true;

    startNativeBluetoothMonitoring((event: BluetoothStateChangeEvent) => {
      if (!isMounted) return;
      const isConnected = event.type === 'connected';
      const devName = event.deviceName || 'Vehicle Infotainment';
      const mac = event.macAddress || '';

      // Check if device is in our list, if not auto-register it
      setDevices(prev => {
        const existingIdx = prev.findIndex(d => (mac && d.macAddress === mac) || d.name === devName);
        if (existingIdx >= 0) {
          const current = prev[existingIdx];
          // If already in that state, keep
          if (current.isConnected === isConnected) return prev;

          const updated = [...prev];
          updated[existingIdx] = {
            ...current,
            isConnected,
            lastConnectedAt: isConnected ? Date.now() : current.lastConnectedAt,
          };
          return updated;
        } else if (isConnected) {
          // New device detected in real-time
          const newDev: BluetoothDevice = {
            id: `dev-auto-${mac.replace(/:/g, '') || Date.now()}`,
            name: devName,
            macAddress: mac || '00:00:00:00:00:00',
            type: 'car',
            carBrand: 'Detected Vehicle',
            isConnected: true,
            isTriggerEnabled: true,
            isRealNativeDevice: true,
            lastConnectedAt: Date.now(),
          };
          return [newDev, ...prev];
        }
        return prev;
      });

      // Pass event into automator logic
      handleToggleConnection(mac || devName, isConnected);
    }).then(cleanup => {
      cleanupFn = cleanup;
    }).catch(err => {
      console.warn('Native Bluetooth monitor error:', err);
    });

    return () => {
      isMounted = false;
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, []);

  // Fetch paired Bluetooth devices from phone (Native Android) or Web Bluetooth / Local
  const handleFetchPairedDevices = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await fetchPhonePairedDevices();
      if (!res.success) {
        setScanError(res.message);
        addLog('config_change', 'Bluetooth Sync Alert', res.message, 'warning');
        return;
      }

      if (res.devices.length === 0) {
        setScanError(res.message || 'No paired Bluetooth devices detected.');
        addLog('config_change', 'Bluetooth Sync', res.message, 'info');
        return;
      }

      let addedCount = 0;
      let updatedCount = 0;

      setDevices(prev => {
        const next = [...prev];
        res.devices.forEach(newDev => {
          const existingIdx = next.findIndex(d => d.macAddress === newDev.macAddress || d.id === newDev.id);
          if (existingIdx >= 0) {
            next[existingIdx] = {
              ...next[existingIdx],
              name: newDev.name,
              isConnected: newDev.isConnected,
              isRealNativeDevice: true,
              type: newDev.type,
              carBrand: newDev.carBrand || next[existingIdx].carBrand,
            };
            updatedCount++;
          } else {
            next.unshift(newDev);
            addedCount++;
          }
        });
        return next;
      });

      addLog(
        'config_change',
        res.isNative ? 'Phone Paired Devices Synced' : 'Bluetooth Devices Synced',
        res.isNative
          ? `Read ${res.devices.length} paired Bluetooth device(s) directly from your Android phone (${addedCount} new added).`
          : res.message,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(`Failed to read paired Bluetooth devices: ${msg}`);
      addLog('config_change', 'Bluetooth Sync Error', msg, 'alert');
    } finally {
      setIsScanning(false);
    }
  };

  // Web Bluetooth API Integration
  const handleScanWebBluetooth = async () => {
    setIsScanning(true);
    setScanError(null);

    const nav = navigator as unknown as { bluetooth?: { requestDevice: (opts: unknown) => Promise<unknown> } };
    if (!nav.bluetooth) {
      setIsScanning(false);
      setScanError('Web Bluetooth is not supported in this browser or iframe. You can manage and test car devices directly below.');
      return;
    }

    try {
      // Request device with common services
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information', 0x1800, 0x1801],
      }) as { id: string; name?: string; gatt?: { connect: () => Promise<unknown>; connected: boolean } };

      const deviceName = device.name || 'Discovered Bluetooth Device';

      // Check if already in list
      const existing = devices.find(d => d.id === device.id);
      if (!existing) {
        const newBtDevice: BluetoothDevice = {
          id: device.id,
          name: deviceName,
          macAddress: `BT:${device.id.slice(0, 8)}`,
          type: 'car',
          isConnected: true,
          isTriggerEnabled: true,
          isRealNativeDevice: true,
          rssi: -50,
        };
        setDevices(prev => [newBtDevice, ...prev]);
        addLog('bluetooth_connect', `Paired via Web Bluetooth: ${deviceName}`, 'Connected directly through browser Bluetooth adapter.', 'success', deviceName);

        // Trigger connection logic
        setHotspotState(prev => ({
          ...prev,
          status: 'connecting_delay',
          countdownRemaining: settings.connectDelaySeconds,
          countdownTotal: settings.connectDelaySeconds,
          triggeredDeviceId: newBtDevice.id,
          triggeredDeviceName: newBtDevice.name,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (!errorMsg.includes('User cancelled')) {
        setScanError(`Bluetooth scan: ${errorMsg}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Manual Controls
  const handleManualTurnOn = async () => {
    if (settings.soundAlerts) playChime('hotspot_on');
    setHotspotState(prev => ({
      ...prev,
      status: 'active',
      countdownRemaining: 0,
      countdownTotal: 0,
      activeSince: Date.now(),
      clientCount: 1,
      connectedClients: [
        {
          id: 'client-manual',
          name: 'Authorized Device',
          ip: '192.168.43.20',
          mac: '44:61:32:89:12:11',
          connectedAt: Date.now(),
          dataUsageMb: 4.2,
        },
      ],
    }));
    addLog('manual_override', 'Manual Hotspot Activation', 'User manually forced Wi-Fi hotspot ON.', 'info');

    // Natively toggle phone hotspot
    try {
      const res = await triggerNativeHotspot(true);
      if (res.status === 'settings_opened') {
        addLog('manual_override', 'Android Tethering Settings', 'Opened Hotspot & Tethering settings to enable.', 'warning');
      } else if (res.success) {
        addLog('hotspot_on', 'Native Hotspot Active', res.ssid ? `Broadcasting SSID "${res.ssid}".` : 'Android Wi-Fi Hotspot is broadcasting.', 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Error activating native hotspot manually:', err);
      addLog('manual_override', 'Hotspot Activation Warning', msg, 'alert');
    }
  };

  const handleManualTurnOff = async () => {
    if (settings.soundAlerts) playChime('hotspot_off');
    setHotspotState(prev => ({
      ...prev,
      status: 'off',
      countdownRemaining: 0,
      countdownTotal: 0,
      clientCount: 0,
      connectedClients: [],
      triggeredDeviceId: undefined,
      triggeredDeviceName: undefined,
    }));
    addLog('manual_override', 'Manual Hotspot Turn OFF', 'User manually powered down Wi-Fi hotspot.', 'info');

    // Natively toggle phone hotspot off
    try {
      await triggerNativeHotspot(false);
      addLog('hotspot_off', 'Native Hotspot Deactivated', 'Android Wi-Fi Hotspot powered down.', 'info');
    } catch (err: unknown) {
      console.warn('Error deactivating native hotspot manually:', err);
    }
  };

  const handleCancelCountdown = () => {
    if (hotspotState.status === 'connecting_delay') {
      setHotspotState(prev => ({
        ...prev,
        status: 'off',
        countdownRemaining: 0,
        countdownTotal: 0,
        triggeredDeviceId: undefined,
        triggeredDeviceName: undefined,
      }));
      addLog('countdown_cancelled', 'Delay Cancelled', '10-second startup delay aborted by user.', 'info');
    } else if (hotspotState.status === 'disconnecting_delay') {
      // Keep ON
      setHotspotState(prev => ({
        ...prev,
        status: 'active',
        countdownRemaining: 0,
        countdownTotal: 0,
      }));
      addLog('countdown_cancelled', 'Shutdown Cancelled', 'Disconnect auto-off cancelled. Hotspot remains ON indefinitely.', 'success');
    }
  };

  // Fast-forward countdown for easy testing
  const handleFastForwardCountdown = () => {
    setHotspotState(prev => {
      if (prev.status === 'disconnecting_delay') {
        const next = Math.max(2, prev.countdownRemaining - 30);
        return { ...prev, countdownRemaining: next };
      }
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* App Header */}
      <Header
        hotspotState={hotspotState}
        soundEnabled={settings.soundAlerts}
        onToggleSound={() => setSettings(s => ({ ...s, soundAlerts: !s.soundAlerts }))}
        onOpenSettings={() => setShowSettings(true)}
        onOpenGuide={() => setShowGuide(true)}
        isNative={isNativeApp()}
        hasTriggerDevices={devices.some(d => d.isTriggerEnabled)}
        isSimulatorActive={showSimulator}
        onCloseSimulator={() => setShowSimulator(false)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Core Hotspot Status Card */}
        <HotspotStatusCard
          hotspotState={hotspotState}
          settings={settings}
          onManualTurnOn={handleManualTurnOn}
          onManualTurnOff={handleManualTurnOff}
          onCancelCountdown={handleCancelCountdown}
          onFastForwardCountdown={handleFastForwardCountdown}
          onEditTimers={() => setShowSettings(true)}
          onOpenHotspotSettings={isNativeApp() ? openPhoneHotspotSettings : undefined}
        />

        {/* Dedicated Delay Buffer & Disconnect Grace Period Configurator */}
        <TimerConfigCard
          settings={settings}
          onUpdateTimers={handleUpdateTimers}
          onResetDefaults={handleResetDefaultTimers}
        />

        {/* Interactive Drive Simulator (Tucked inside Config Menu, can be opened when testing) */}
        {showSimulator && (
          <DriveSimulator
            devices={devices}
            hotspotState={hotspotState}
            settings={settings}
            onSimulateConnect={(dev) => handleToggleConnection(dev.id)}
            onSimulateDisconnect={(dev) => handleToggleConnection(dev.id)}
            onFastForward={handleFastForwardCountdown}
            onClose={() => setShowSimulator(false)}
          />
        )}

        {/* Rule Summary Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Active Automation Logic:
              </p>
              <p className="text-slate-600">
                Car Bluetooth Connects &rarr; <strong>Wait {settings.connectDelaySeconds} seconds</strong> &rarr; Hotspot ON | Car Disconnects &rarr; <strong>Wait {settings.disconnectDelayMinutes} minutes</strong> &rarr; Hotspot OFF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 rounded-lg font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 transition-colors shrink-0"
            >
              Change Timers
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="px-3 py-1.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors shrink-0"
            >
              Export to Phone
            </button>
          </div>
        </div>

        {/* Grid: Bluetooth Device Trigger Selector & Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <TriggerDeviceSelector
              devices={devices}
              onToggleTrigger={handleToggleTrigger}
              onToggleAllCars={handleToggleAllCars}
              onToggleConnection={handleToggleConnection}
              onAddDevice={handleAddDevice}
              onDeleteDevice={handleDeleteDevice}
              onScanWebBluetooth={handleScanWebBluetooth}
              onFetchPairedDevices={handleFetchPairedDevices}
              isScanning={isScanning}
              scanError={scanError}
              connectDelaySeconds={settings.connectDelaySeconds}
              isNative={isNativeApp()}
              onOpenPhoneBluetoothSettings={openPhoneBluetoothSettings}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <ActivityLogView
              logs={logs}
              onClearLogs={() => setLogs([])}
            />

            {/* Quick Informational Tip */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Why this dual-delay rule is optimal:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                1. <strong>{settings.connectDelaySeconds}s Connect Delay:</strong> Avoids turning on battery-heavy tethering when walking past your car or starting the engine momentarily.
              </p>
              <p className="text-slate-600 leading-relaxed">
                2. <strong>{settings.disconnectDelayMinutes}m Disconnect Grace:</strong> When pumping gas or picking up coffee, your phone maintains the car's Wi-Fi hotspot session instead of repeatedly toggling off and on.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
          showSimulator={showSimulator}
          onToggleSimulator={(show) => setShowSimulator(show)}
          onOpenBluetoothSettings={openPhoneBluetoothSettings}
          onOpenHotspotSettings={openPhoneHotspotSettings}
          isNative={isNativeApp()}
        />
      )}

      {/* Platform Native Automation Guide Modal */}
      {showGuide && (
        <PlatformGuideModal
          devices={devices}
          settings={settings}
          onClose={() => setShowGuide(false)}
        />
      )}
    </div>
  );
}
