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

export interface BluetoothBridgePluginInterface {
  getPairedDevices(): Promise<PairedDevicesResult>;
  isBluetoothEnabled(): Promise<{ supported: boolean; enabled: boolean }>;
  openBluetoothSettings(): Promise<{ success: boolean }>;
  openHotspotSettings(): Promise<{ success: boolean }>;
  isNativePlatform(): Promise<{ isNative: boolean; platform: string; androidRelease?: string; sdkInt?: number }>;
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
