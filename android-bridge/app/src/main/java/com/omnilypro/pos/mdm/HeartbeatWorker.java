package com.omnilypro.pos.mdm;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.StatFs;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;
import androidx.core.app.ActivityCompat;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.google.gson.JsonObject;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Response;

/**
 * Worker che invia heartbeat (stato dispositivo) ogni 30 secondi
 */
public class HeartbeatWorker extends Worker {
    private static final String TAG = "HeartbeatWorker";

    public HeartbeatWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            sendHeartbeat();
            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Error sending heartbeat", e);
            return Result.retry();
        }
    }

    private void sendHeartbeat() {
        Context context = getApplicationContext();

        // Raccogli dati dispositivo
        String androidId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
        int batteryLevel = getBatteryLevel(context);
        String wifiSsid = getWifiSSID(context);
        float storageFreeGb = getStorageFreeGB();
        Location location = getLastKnownLocation(context);

        // Timestamp ISO 8601 per Supabase
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        String timestamp = sdf.format(new Date());

        // Crea JSON payload
        JsonObject deviceData = new JsonObject();
        deviceData.addProperty("status", MdmConfig.STATUS_ONLINE);
        deviceData.addProperty("last_seen", timestamp);
        deviceData.addProperty("battery_level", batteryLevel);
        deviceData.addProperty("wifi_ssid", wifiSsid);
        deviceData.addProperty("storage_free_gb", storageFreeGb);
        deviceData.addProperty("device_model", Build.MODEL);
        deviceData.addProperty("updated_at", timestamp);

        // Aggiungi coordinate GPS se disponibili
        if (location != null) {
            deviceData.addProperty("latitude", location.getLatitude());
            deviceData.addProperty("longitude", location.getLongitude());
            deviceData.addProperty("location_accuracy_meters", (int) location.getAccuracy());
            deviceData.addProperty("location_updated_at", timestamp);
            Log.d(TAG, "GPS coordinates: " + location.getLatitude() + ", " + location.getLongitude());
        } else {
            Log.w(TAG, "No GPS location available");
        }

        Log.d(TAG, "Sending heartbeat for device: " + androidId);
        Log.d(TAG, "Payload: " + deviceData.toString());

        // Invia a Supabase
        SupabaseClient.getInstance().updateDeviceStatus(androidId, deviceData, new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.e(TAG, "Failed to send heartbeat", e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseBody = response.body() != null ? response.body().string() : "no body";
                    Log.d(TAG, "Heartbeat sent successfully - Response: " + responseBody);
                } else {
                    String errorBody = response.body() != null ? response.body().string() : "no body";
                    Log.w(TAG, "Heartbeat failed: " + response.code() + " - " + errorBody);
                }
                response.close();
            }
        });
    }

    /**
     * Ottieni livello batteria
     */
    private int getBatteryLevel(Context context) {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = context.registerReceiver(null, ifilter);

            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                return (int) ((level / (float) scale) * 100);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting battery level", e);
        }
        return 0;
    }

    /**
     * Ottieni SSID WiFi connesso
     */
    private String getWifiSSID(Context context) {
        try {
            WifiManager wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null) {
                WifiInfo wifiInfo = wifiManager.getConnectionInfo();
                if (wifiInfo != null) {
                    String ssid = wifiInfo.getSSID();
                    if (ssid != null && !ssid.equals("<unknown ssid>")) {
                        // Rimuovi le virgolette
                        return ssid.replace("\"", "");
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting WiFi SSID", e);
        }
        return "Unknown";
    }

    /**
     * Ottieni storage libero in GB
     */
    private float getStorageFreeGB() {
        try {
            StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
            long bytesAvailable = stat.getBlockSizeLong() * stat.getAvailableBlocksLong();
            return bytesAvailable / (1024f * 1024f * 1024f); // Convert to GB
        } catch (Exception e) {
            Log.e(TAG, "Error getting storage", e);
            return 0;
        }
    }

    /**
     * Ottieni ultima posizione GPS conosciuta
     */
    private Location getLastKnownLocation(Context context) {
        try {
            LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) {
                Log.w(TAG, "LocationManager not available");
                return null;
            }

            // Controlla permessi GPS
            if (ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "GPS permission not granted");
                return null;
            }

            // Prova a ottenere posizione da GPS
            Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (gpsLocation != null) {
                Log.d(TAG, "GPS location found: " + gpsLocation.getLatitude() + ", " + gpsLocation.getLongitude());
                return gpsLocation;
            }

            // Fallback a Network provider (WiFi/Cell tower)
            Location networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            if (networkLocation != null) {
                Log.d(TAG, "Network location found: " + networkLocation.getLatitude() + ", " + networkLocation.getLongitude());
                return networkLocation;
            }

            Log.w(TAG, "No location available from any provider");
            return null;

        } catch (Exception e) {
            Log.e(TAG, "Error getting GPS location", e);
            return null;
        }
    }
}
