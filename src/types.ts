export type DeviceType = 'car' | 'headphones' | 'smartwatch' | 'obd' | 'speaker' | 'other';

export interface BluetoothDevice {
  id: string;
  name: string;
  macAddress: string;
  type: DeviceType;
  carBrand?: string;
  isConnected: boolean;
  isTriggerEnabled: boolean;
  lastConnectedAt?: number;
  rssi?: number;
  isRealNativeDevice?: boolean;
}

export type HotspotStatus = 'off' | 'connecting_delay' | 'active' | 'disconnecting_delay';

export interface ConnectedClient {
  id: string;
  name: string;
  ip: string;
  mac: string;
  connectedAt: number;
  dataUsageMb: number;
}

export interface HotspotState {
  status: HotspotStatus;
  countdownRemaining: number; // in seconds
  countdownTotal: number; // in seconds
  activeSince?: number;
  ssid: string;
  band: '5 GHz' | '2.4 GHz';
  security: 'WPA3 Personal' | 'WPA2 Personal';
  clientCount: number;
  connectedClients: ConnectedClient[];
  triggeredDeviceId?: string;
  triggeredDeviceName?: string;
}

export interface AppSettings {
  connectDelaySeconds: number; // default: 10
  disconnectDelayMinutes: number; // default: 5
  soundAlerts: boolean;
  vibrateAlerts: boolean;
  autoCancelIfReconnected: boolean;
  hotspotSsid: string;
  hotspotPassword: string;
  hotspotBand: '5 GHz' | '2.4 GHz';
  autoStartService: boolean;
  batteryThreshold: number; // percentage
  lowBatteryProtection: boolean;
}

export interface ActivityLogItem {
  id: string;
  timestamp: Date;
  type: 
    | 'bluetooth_connect'
    | 'bluetooth_disconnect'
    | 'countdown_started'
    | 'countdown_cancelled'
    | 'hotspot_on'
    | 'hotspot_off'
    | 'config_change'
    | 'manual_override';
  title: string;
  description: string;
  deviceName?: string;
  level: 'info' | 'success' | 'warning' | 'alert';
}
