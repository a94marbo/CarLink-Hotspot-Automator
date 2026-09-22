package com.carlink.hotspotautomator;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.lang.reflect.Method;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(
    name = "BluetoothBridge",
    permissions = {
        @Permission(
            strings = { Manifest.permission.BLUETOOTH_CONNECT },
            alias = "bluetoothConnect"
        ),
        @Permission(
            strings = { Manifest.permission.BLUETOOTH_SCAN },
            alias = "bluetoothScan"
        ),
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION },
            alias = "location"
        )
    }
)
public class BluetoothBridgePlugin extends Plugin {

    private BroadcastReceiver bluetoothReceiver = null;
    private WifiManager.LocalOnlyHotspotReservation hotspotReservation = null;
    private boolean isListening = false;

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("bluetoothConnect") != PermissionState.GRANTED) {
                requestPermissionForAlias("bluetoothConnect", call, "pairedDevicesPermissionCallback");
                return;
            }
        }
        fetchPairedDevices(call);
    }

    @PermissionCallback
    private void pairedDevicesPermissionCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("bluetoothConnect") == PermissionState.GRANTED) {
                fetchPairedDevices(call);
            } else {
                JSObject errorResult = new JSObject();
                errorResult.put("supported", true);
                errorResult.put("enabled", true);
                errorResult.put("devices", new JSArray());
                errorResult.put("count", 0);
                errorResult.put("permissionDenied", true);
                errorResult.put("message", "Bluetooth Connect permission was denied. Please grant Nearby Devices permission in phone settings.");
                call.resolve(errorResult);
            }
        } else {
            fetchPairedDevices(call);
        }
    }

    private void fetchPairedDevices(PluginCall call) {
        try {
            BluetoothManager bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = bluetoothManager != null ? bluetoothManager.getAdapter() : BluetoothAdapter.getDefaultAdapter();

            if (adapter == null) {
                JSObject result = new JSObject();
                result.put("supported", false);
                result.put("enabled", false);
                result.put("devices", new JSArray());
                result.put("count", 0);
                result.put("message", "Bluetooth is not supported on this phone.");
                call.resolve(result);
                return;
            }

            boolean isEnabled = adapter.isEnabled();
            if (!isEnabled) {
                JSObject result = new JSObject();
                result.put("supported", true);
                result.put("enabled", false);
                result.put("devices", new JSArray());
                result.put("count", 0);
                result.put("message", "Bluetooth is currently turned OFF. Please enable Bluetooth.");
                call.resolve(result);
                return;
            }

            Set<BluetoothDevice> pairedDevices = null;
            try {
                pairedDevices = adapter.getBondedDevices();
            } catch (SecurityException se) {
                JSObject errorResult = new JSObject();
                errorResult.put("supported", true);
                errorResult.put("enabled", true);
                errorResult.put("devices", new JSArray());
                errorResult.put("count", 0);
                errorResult.put("permissionDenied", true);
                errorResult.put("message", "SecurityException: Bluetooth Connect permission required: " + se.getMessage());
                call.resolve(errorResult);
                return;
            }

            JSArray devicesArray = new JSArray();

            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    JSObject devObj = new JSObject();
                    String name = null;
                    try {
                        name = device.getName();
                    } catch (SecurityException ignored) {}

                    String address = device.getAddress();
                    if (name == null || name.trim().isEmpty()) {
                        name = "Paired Device (" + address + ")";
                    }

                    devObj.put("id", "BT:" + address);
                    devObj.put("name", name);
                    devObj.put("macAddress", address);
                    devObj.put("isRealNativeDevice", true);
                    devObj.put("isBonded", true);

                    // Determine type & car brand
                    String deviceType = "other";
                    String carBrand = null;

                    try {
                        BluetoothClass btClass = device.getBluetoothClass();
                        if (btClass != null) {
                            int devClass = btClass.getDeviceClass();
                            int majorClass = btClass.getMajorDeviceClass();
                            devObj.put("deviceClass", devClass);
                            devObj.put("majorClass", majorClass);

                            if (devClass == BluetoothClass.Device.AUDIO_VIDEO_CAR_AUDIO ||
                                devClass == BluetoothClass.Device.AUDIO_VIDEO_HANDSFREE) {
                                deviceType = "car";
                            } else if (devClass == BluetoothClass.Device.AUDIO_VIDEO_HEADPHONES ||
                                       devClass == BluetoothClass.Device.AUDIO_VIDEO_WEARABLE_HEADSET) {
                                deviceType = "headphones";
                            } else if (majorClass == BluetoothClass.Device.Major.WEARABLE) {
                                deviceType = "smartwatch";
                            }
                        }
                    } catch (Exception ignored) {}

                    // Smart name inspection for automotive brands / infotainment systems
                    String lowerName = name.toLowerCase(Locale.ROOT);
                    String[] carBrands = {
                        "bmw", "audi", "mercedes", "mbux", "tesla", "ford", "sync", "mmi",
                        "porsche", "volvo", "toyota", "honda", "hyundai", "kia", "mazda",
                        "nissan", "subaru", "lexus", "chevrolet", "chevy", "gmc", "dodge",
                        "jeep", "ram", "volkswagen", "vw", "fiat", "alfa", "android auto",
                        "carplay", "carlinkit", "ottocast", "carlink", "infotainment", "car bt",
                        "my car", "car multimedia", "bluetooth car", "handsfree"
                    };

                    for (String brand : carBrands) {
                        if (lowerName.contains(brand)) {
                            deviceType = "car";
                            if (brand.equals("vw")) carBrand = "Volkswagen";
                            else if (brand.equals("chevy")) carBrand = "Chevrolet";
                            else if (brand.equals("mbux")) carBrand = "Mercedes-Benz";
                            else if (brand.equals("sync")) carBrand = "Ford";
                            else if (brand.equals("mmi")) carBrand = "Audi";
                            else carBrand = brand.substring(0, 1).toUpperCase(Locale.ROOT) + brand.substring(1);
                            break;
                        }
                    }

                    devObj.put("type", deviceType);
                    if (carBrand != null) {
                        devObj.put("carBrand", carBrand);
                    }

                    // Check profile connection state
                    boolean isConnected = false;
                    try {
                        int a2dpState = adapter.getProfileConnectionState(BluetoothProfile.A2DP);
                        int headsetState = adapter.getProfileConnectionState(BluetoothProfile.HEADSET);
                        if (a2dpState == BluetoothProfile.STATE_CONNECTED || headsetState == BluetoothProfile.STATE_CONNECTED) {
                            isConnected = true;
                        }
                    } catch (Exception ignored) {}

                    devObj.put("isConnected", isConnected);
                    devObj.put("rssi", -55);
                    devicesArray.put(devObj);
                }
            }

            JSObject result = new JSObject();
            result.put("supported", true);
            result.put("enabled", true);
            result.put("devices", devicesArray);
            result.put("count", devicesArray.length());
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to retrieve paired Bluetooth devices: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void isBluetoothEnabled(PluginCall call) {
        BluetoothManager bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter adapter = bluetoothManager != null ? bluetoothManager.getAdapter() : BluetoothAdapter.getDefaultAdapter();
        JSObject ret = new JSObject();
        ret.put("supported", adapter != null);
        ret.put("enabled", adapter != null && adapter.isEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void openBluetoothSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not open Bluetooth settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openHotspotSettings(PluginCall call) {
        try {
            Intent intent = new Intent();
            intent.setAction("android.settings.TETHER_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (intent.resolveActivity(getContext().getPackageManager()) != null) {
                getContext().startActivity(intent);
            } else {
                Intent fallback = new Intent(Settings.ACTION_WIRELESS_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not open Hotspot/Tethering settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isNativePlatform(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isNative", true);
        ret.put("platform", "android");
        ret.put("androidRelease", Build.VERSION.RELEASE);
        ret.put("sdkInt", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    @PluginMethod
    public void startBluetoothMonitor(PluginCall call) {
        try {
            if (bluetoothReceiver == null) {
                bluetoothReceiver = new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context context, Intent intent) {
                        String action = intent.getAction();
                        if (action == null) return;

                        if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(action) ||
                            BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(action) ||
                            BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {

                            BluetoothDevice device = null;
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice.class);
                            } else {
                                device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                            }

                            JSObject eventData = new JSObject();
                            String eventType = BluetoothDevice.ACTION_ACL_CONNECTED.equals(action) ? "connected" : "disconnected";
                            eventData.put("type", eventType);
                            eventData.put("action", action);

                            if (device != null) {
                                String name = null;
                                try {
                                    name = device.getName();
                                } catch (SecurityException ignored) {}
                                String address = device.getAddress();

                                if (name == null || name.trim().isEmpty()) {
                                    name = "Bluetooth Device (" + address + ")";
                                }

                                eventData.put("deviceName", name);
                                eventData.put("macAddress", address);
                                eventData.put("deviceId", "BT:" + address);
                            }

                            notifyListeners("bluetoothStateChange", eventData);
                        }
                    }
                };

                IntentFilter filter = new IntentFilter();
                filter.addAction(BluetoothDevice.ACTION_ACL_CONNECTED);
                filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
                filter.addAction(BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED);
                filter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);
                getContext().registerReceiver(bluetoothReceiver, filter);
                isListening = true;
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("listening", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not start Bluetooth listener: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void stopBluetoothMonitor(PluginCall call) {
        try {
            if (bluetoothReceiver != null) {
                getContext().unregisterReceiver(bluetoothReceiver);
                bluetoothReceiver = null;
                isListening = false;
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("listening", false);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not stop Bluetooth listener: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void setHotspotState(PluginCall call) {
        boolean enable = call.getBoolean("enable", true);
        Context context = getContext();

        try {
            WifiManager wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager == null) {
                call.reject("WifiManager is not available.");
                return;
            }

            if (enable) {
                // Try LocalOnlyHotspot on Android 8.0+ (API 26+)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                        requestPermissionForAlias("location", call, "locationHotspotPermissionCallback");
                        return;
                    }

                    if (hotspotReservation != null) {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("status", "already_active");
                        ret.put("method", "LocalOnlyHotspot");
                        call.resolve(ret);
                        return;
                    }

                    wifiManager.startLocalOnlyHotspot(new WifiManager.LocalOnlyHotspotCallback() {
                        @Override
                        public void onStarted(WifiManager.LocalOnlyHotspotReservation reservation) {
                            super.onStarted(reservation);
                            hotspotReservation = reservation;
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            ret.put("status", "active");
                            ret.put("method", "LocalOnlyHotspot");
                            try {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                    android.net.wifi.SoftApConfiguration config = reservation.getSoftApConfiguration();
                                    if (config != null) {
                                        ret.put("ssid", config.getSsid());
                                        ret.put("passphrase", config.getPassphrase());
                                    }
                                }
                            } catch (Exception ignored) {}
                            call.resolve(ret);

                            JSObject eventData = new JSObject();
                            eventData.put("status", "active");
                            notifyListeners("hotspotStatusChange", eventData);
                        }

                        @Override
                        public void onStopped() {
                            super.onStopped();
                            hotspotReservation = null;
                            JSObject eventData = new JSObject();
                            eventData.put("status", "stopped");
                            notifyListeners("hotspotStatusChange", eventData);
                        }

                        @Override
                        public void onFailed(int reason) {
                            super.onFailed(reason);
                            hotspotReservation = null;
                            // Fallback to launching system tethering settings so user can toggle in 1 click
                            tryLaunchTetherSettings();
                            JSObject ret = new JSObject();
                            ret.put("success", false);
                            ret.put("status", "settings_opened");
                            ret.put("reason", reason);
                            ret.put("message", "Android system restricted direct toggle; opened Hotspot Settings.");
                            call.resolve(ret);
                        }
                    }, new Handler(Looper.getMainLooper()));
                    return;
                } else {
                    // Pre-Oreo legacy reflection
                    try {
                        Method method = wifiManager.getClass().getMethod("setWifiApEnabled", android.net.wifi.WifiConfiguration.class, boolean.class);
                        method.invoke(wifiManager, null, true);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("status", "active");
                        call.resolve(ret);
                        return;
                    } catch (Exception ignored) {}
                }
            } else {
                // Disable hotspot
                if (hotspotReservation != null) {
                    hotspotReservation.close();
                    hotspotReservation = null;
                }

                // Try reflection for legacy tethering
                try {
                    Method method = wifiManager.getClass().getMethod("setWifiApEnabled", android.net.wifi.WifiConfiguration.class, boolean.class);
                    method.invoke(wifiManager, null, false);
                } catch (Exception ignored) {}

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("status", "off");
                call.resolve(ret);

                JSObject eventData = new JSObject();
                eventData.put("status", "off");
                notifyListeners("hotspotStatusChange", eventData);
                return;
            }

            // If direct activation could not be handled by API, open settings intent
            tryLaunchTetherSettings();
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("status", "settings_opened");
            ret.put("message", "Hotspot settings opened");
            call.resolve(ret);

        } catch (Exception e) {
            tryLaunchTetherSettings();
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("status", "settings_opened");
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void locationHotspotPermissionCallback(PluginCall call) {
        setHotspotState(call);
    }

    private void tryLaunchTetherSettings() {
        try {
            Intent intent = new Intent();
            intent.setAction("android.settings.TETHER_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (intent.resolveActivity(getContext().getPackageManager()) != null) {
                getContext().startActivity(intent);
            } else {
                Intent fallback = new Intent(Settings.ACTION_WIRELESS_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (bluetoothReceiver != null) {
            try {
                getContext().unregisterReceiver(bluetoothReceiver);
            } catch (Exception ignored) {}
            bluetoothReceiver = null;
        }
        if (hotspotReservation != null) {
            try {
                hotspotReservation.close();
            } catch (Exception ignored) {}
            hotspotReservation = null;
        }
    }
}
