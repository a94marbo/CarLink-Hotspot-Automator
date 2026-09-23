/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import { BluetoothDevice, DeviceType } from '../types';

export interface NativePairedDeviceRaw {
  id: string;
  name: string;
  macAddress: string;
  type: DeviceType;
  carBrand?: string;
  isConnected: boolean;
  isRealNativeDevice: boolean;
  isBonded?: boolean;
  deviceClass?: number;
  majorClass?: number;
  rssi?: number;
}

export interface PairedDevicesResult {
  supported: boolean;
  enabled: boolean;
  devices: NativePairedDeviceRaw[];
  count: number;
  message?: string;
  permissionDenied?: boolean;
}

export interface BluetoothStateChangeEvent {
  type: 'connected' | 'disconnected';
  action: string;
  deviceName?: string;
  macAddress?: string;
  deviceId?: string;
}

export interface HotspotToggleResult {
  success: boolean;
  status: 'active' | 'off' | 'settings_opened' | 'already_active';
  method?: string;
  ssid?: string;
  passphrase?: string;
  message?: string;
  error?: string;
  isProtectedByAndroid?: boolean;
  isRooted?: boolean;
}

export interface HotspotNativeStatusEvent {
  isActive: boolean;
  status: 'active' | 'off' | 'enabling' | 'disabling';
  stateCode?: number;
}

export interface BluetoothBridgePluginInterface {
  getPairedDevices(): Promise<PairedDevicesResult>;
  isBluetoothEnabled(): Promise<{ supported: boolean; enabled: boolean }>;
  openBluetoothSettings(): Promise<{ success: boolean }>;
  openHotspotSettings(): Promise<{ success: boolean }>;
  isNativePlatform(): Promise<{
    isNative: boolean;
    platform: string;
    androidRelease?: string;
    sdkInt?: number;
    isProtectedByAndroid?: boolean;
    isRooted?: boolean;
  }>;
  checkRootStatus(): Promise<{ isRooted: boolean; isProtectedByAndroid: boolean }>;
  getHotspotState(): Promise<{
    supported: boolean;
    enabled: boolean;
    status: 'active' | 'off';
    stateCode: number;
    isProtectedByAndroid: boolean;
    isRooted: boolean;
  }>;
  getConnectedClients(): Promise<{
    count: number;
    clients: Array<{ id: string; ip: string; mac: string; name: string; connectedAt: number; dataUsageMb: number }>;
    arpAccessible: boolean;
  }>;
  startBluetoothMonitor(): Promise<{ success: boolean; listening: boolean }>;
  stopBluetoothMonitor(): Promise<{ success: boolean; listening: boolean }>;
  setHotspotState(options: { enable: boolean }): Promise<HotspotToggleResult>;
  addListener(
    eventName: 'bluetoothStateChange',
    listenerFunc: (event: BluetoothStateChangeEvent) => void
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    eventName: 'hotspotStatusChange',
    listenerFunc: (event: { status: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    eventName: 'hotspotNativeStatusChange',
    listenerFunc: (event: HotspotNativeStatusEvent) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

export const BluetoothBridge = registerPlugin<BluetoothBridgePluginInterface>('BluetoothBridge');

/**
 * Returns true if running inside a native Android / iOS Capacitor container
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Common automotive keywords to detect car infotainment systems from name
 */
export const CAR_KEYWORDS = [
  'bmw', 'audi', 'mercedes', 'mbux', 'tesla', 'ford', 'sync', 'mmi',
  'porsche', 'volvo', 'toyota', 'honda', 'hyundai', 'kia', 'mazda',
  'nissan', 'subaru', 'lexus', 'chevrolet', 'chevy', 'gmc', 'dodge',
  'jeep', 'ram', 'volkswagen', 'vw', 'fiat', 'alfa', 'android auto',
  'carplay', 'carlinkit', 'ottocast', 'carlink', 'infotainment', 'car bt',
  'my car', 'car multimedia', 'bluetooth car', 'handsfree'
];

export function detectCarBrand(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower.includes('bmw')) return 'BMW';
  if (lower.includes('audi') || lower.includes('mmi')) return 'Audi';
  if (lower.includes('mercedes') || lower.includes('mbux')) return 'Mercedes-Benz';
  if (lower.includes('tesla')) return 'Tesla';
  if (lower.includes('ford') || lower.includes('sync')) return 'Ford';
  if (lower.includes('porsche')) return 'Porsche';
  if (lower.includes('volvo')) return 'Volvo';
  if (lower.includes('toyota')) return 'Toyota';
  if (lower.includes('honda')) return 'Honda';
  if (lower.includes('hyundai')) return 'Hyundai';
  if (lower.includes('kia')) return 'Kia';
  if (lower.includes('mazda')) return 'Mazda';
  if (lower.includes('volkswagen') || lower.includes('vw')) return 'Volkswagen';
  if (lower.includes('lexus')) return 'Lexus';
  if (lower.includes('chevrolet') || lower.includes('chevy')) return 'Chevrolet';
  if (lower.includes('jeep')) return 'Jeep';
  if (lower.includes('carplay') || lower.includes('android auto')) return 'Infotainment System';
  return undefined;
}

export function isCarDevice(name: string, deviceClass?: number): boolean {
  if (deviceClass === 0x420 || deviceClass === 0x408) {
    // AUDIO_VIDEO_CAR_AUDIO or AUDIO_VIDEO_HANDSFREE
    return true;
  }
  const lower = name.toLowerCase();
  return CAR_KEYWORDS.some(k => lower.includes(k));
}

/**
 * Query phone paired Bluetooth devices via native bridge, or fallback to Web Bluetooth
 */
export async function fetchPhonePairedDevices(): Promise<{
  success: boolean;
  isNative: boolean;
  devices: BluetoothDevice[];
  message: string;
}> {
  if (isNativeApp()) {
    try {
      const result = await BluetoothBridge.getPairedDevices();

      if (result.permissionDenied) {
        return {
          success: false,
          isNative: true,
          devices: [],
          message: result.message || 'Bluetooth Nearby Devices permission is required. Please grant permission in Android settings.',
        };
      }

      if (!result.enabled) {
        return {
          success: false,
          isNative: true,
          devices: [],
          message: 'Bluetooth is turned OFF on your phone. Please switch it ON to read paired cars.',
        };
      }

      const mappedDevices: BluetoothDevice[] = (result.devices || []).map(d => {
        const isCar = d.type === 'car' || isCarDevice(d.name, d.deviceClass);
        const carBrand = d.carBrand || detectCarBrand(d.name);
        return {
          id: d.id,
          name: d.name,
          macAddress: d.macAddress,
          type: isCar ? 'car' : (d.type || 'other'),
          carBrand: carBrand,
          isConnected: !!d.isConnected,
          isTriggerEnabled: isCar, // default armed for car devices!
          isRealNativeDevice: true,
          rssi: d.rssi || -55,
        };
      });

      return {
        success: true,
        isNative: true,
        devices: mappedDevices,
        message: `Found ${mappedDevices.length} paired Bluetooth device(s) on your phone.`,
      };
    } catch (err: unknown) {
      console.warn('Native Bluetooth query failed, falling back:', err);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        isNative: true,
        devices: [],
        message: `Could not read phone paired devices: ${msg}`,
      };
    }
  }

  // Running on Web / Browser / Preview: check Web Bluetooth getDevices()
  try {
    const nav = navigator as unknown as { bluetooth?: { getDevices?: () => Promise<Array<{ id: string; name?: string }>> } };
    if (nav.bluetooth?.getDevices) {
      const browserPaired = await nav.bluetooth.getDevices();
      if (browserPaired && browserPaired.length > 0) {
        const webDevices: BluetoothDevice[] = browserPaired.map(p => {
          const name = p.name || 'Bluetooth Vehicle';
          const isCar = isCarDevice(name);
          return {
            id: p.id,
            name,
            macAddress: `BT:${p.id.slice(0, 8).toUpperCase()}`,
            type: isCar ? 'car' : 'other',
            carBrand: detectCarBrand(name),
            isConnected: false,
            isTriggerEnabled: isCar,
            isRealNativeDevice: true,
            rssi: -58,
          };
        });
        return {
          success: true,
          isNative: false,
          devices: webDevices,
          message: `Retrieved ${webDevices.length} authorized device(s) from Web Bluetooth.`,
        };
      }
    }
  } catch (e) {
    console.debug('Web bluetooth check:', e);
  }

  // Browser preview mode message
  return {
    success: true,
    isNative: false,
    devices: [],
    message: 'Running in Web Browser mode. When installed as an APK on your phone, this reads real bonded Bluetooth devices from Android.',
  };
}

/**
 * Open phone Bluetooth settings intent
 */
export async function openPhoneBluetoothSettings(): Promise<boolean> {
  if (isNativeApp()) {
    try {
      await BluetoothBridge.openBluetoothSettings();
      return true;
    } catch (e) {
      console.warn('Failed to open native Bluetooth settings:', e);
    }
  }
  return false;
}

/**
 * Open phone Hotspot/Tethering settings intent
 */
export async function openPhoneHotspotSettings(): Promise<boolean> {
  if (isNativeApp()) {
    try {
      await BluetoothBridge.openHotspotSettings();
      return true;
    } catch (e) {
      console.warn('Failed to open native Hotspot settings:', e);
    }
  }
  return false;
}

/**
 * Start listening for real-time Bluetooth connection & disconnection events on Android
 */
export async function startNativeBluetoothMonitoring(
  onEvent: (event: BluetoothStateChangeEvent) => void
): Promise<(() => void) | null> {
  if (!isNativeApp()) {
    return null;
  }

  try {
    const handle = await BluetoothBridge.addListener('bluetoothStateChange', (event) => {
      onEvent(event);
    });
    await BluetoothBridge.startBluetoothMonitor();
    return () => {
      handle.remove();
      BluetoothBridge.stopBluetoothMonitor().catch(() => {});
    };
  } catch (err) {
    console.warn('Failed to start native Bluetooth monitor:', err);
    return null;
  }
}

/**
 * Turn phone Wi-Fi hotspot ON or OFF natively on Android
 */
export async function triggerNativeHotspot(enable: boolean): Promise<HotspotToggleResult> {
  if (isNativeApp()) {
    try {
      const result = await BluetoothBridge.setHotspotState({ enable });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Failed to trigger native hotspot:', err);
      // Fall back to opening settings so user can toggle immediately
      await openPhoneHotspotSettings();
      return {
        success: false,
        status: 'settings_opened',
        error: msg,
        message: 'Could not toggle hotspot directly, opened Hotspot settings.',
      };
    }
  }

  return {
    success: true,
    status: enable ? 'active' : 'off',
    message: 'Web preview simulation',
  };
}

/**
 * Query current hardware Wi-Fi AP state from Android
 */
export async function queryNativeHotspotState(): Promise<{
  supported: boolean;
  enabled: boolean;
  status: 'active' | 'off';
  isProtectedByAndroid: boolean;
  isRooted: boolean;
}> {
  if (isNativeApp()) {
    try {
      const res = await BluetoothBridge.getHotspotState();
      return {
        supported: res.supported,
        enabled: res.enabled,
        status: res.enabled ? 'active' : 'off',
        isProtectedByAndroid: !!res.isProtectedByAndroid,
        isRooted: !!res.isRooted,
      };
    } catch (e) {
      console.debug('Native hotspot state query:', e);
    }
  }
  return {
    supported: false,
    enabled: false,
    status: 'off',
    isProtectedByAndroid: true,
    isRooted: false,
  };
}

/**
 * Listen for native Android Wi-Fi AP state changes (e.g. user toggles in Android settings, Quick Settings, or routine)
 */
export async function listenToNativeHotspotState(
  onChange: (event: HotspotNativeStatusEvent) => void
): Promise<(() => void) | null> {
  if (!isNativeApp()) {
    return null;
  }
  try {
    const handle = await BluetoothBridge.addListener('hotspotNativeStatusChange', (ev) => {
      onChange(ev);
    });
    return () => {
      handle.remove();
    };
  } catch (err) {
    console.debug('Could not add hotspotNativeStatusChange listener:', err);
    return null;
  }
}

/**
 * Inspect connected Wi-Fi clients from Android (/proc/net/arp or internal list)
 */
export async function queryNativeConnectedClients(): Promise<Array<{
  id: string;
  ip: string;
  mac: string;
  name: string;
  connectedAt: number;
  dataUsageMb: number;
}>> {
  if (isNativeApp()) {
    try {
      const res = await BluetoothBridge.getConnectedClients();
      if (res && res.clients) {
        return res.clients;
      }
    } catch (e) {
      console.debug('Failed to query ARP clients:', e);
    }
  }
  return [];
}

/**
 * Check if the device is rooted (Magisk / KernelSU / su binary)
 */
export async function checkDeviceRootAccess(): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const res = await BluetoothBridge.checkRootStatus();
      return !!res.isRooted;
    } catch (e) {
      console.debug('Root check failed:', e);
    }
  }
  return false;
}

