package com.carlink.hotspotautomator;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
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
        )
    }
)
public class BluetoothBridgePlugin extends Plugin {

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
}
