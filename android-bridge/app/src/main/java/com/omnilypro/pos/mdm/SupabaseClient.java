package com.omnilypro.pos.mdm;

import android.util.Log;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

/**
 * Client per comunicazione con Supabase REST API
 */
public class SupabaseClient {
    private static final String TAG = "SupabaseClient";
    private static SupabaseClient instance;

    private final OkHttpClient httpClient;
    private final Gson gson;
    private final String supabaseUrl;
    private final String apiKey;

    // Device UUID cache for logging
    private static String cachedDeviceUuid = null;

    private SupabaseClient() {
        this.supabaseUrl = MdmConfig.SUPABASE_URL;
        this.apiKey = MdmConfig.SUPABASE_ANON_KEY;
        this.gson = new Gson();

        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    public static synchronized SupabaseClient getInstance() {
        if (instance == null) {
            instance = new SupabaseClient();
        }
        return instance;
    }

    /**
     * Aggiorna stato dispositivo tramite android_id (PATCH)
     * Usato per heartbeat dopo che il device è già registrato
     */
    public void updateDeviceStatus(String androidId, JsonObject deviceData, Callback callback) {
        String url = supabaseUrl + MdmConfig.DEVICES_ENDPOINT + "?android_id=eq." + androidId;

        RequestBody body = RequestBody.create(
                deviceData.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .patch(body)
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .build();

        httpClient.newCall(request).enqueue(callback);
    }

    /**
     * Aggiorna dispositivo tramite UUID (PATCH)
     * Usato durante la prima registrazione quando abbiamo il device_id dal QR
     */
    public void updateDeviceByUuid(String deviceUuid, JsonObject deviceData, Callback callback) {
        String url = supabaseUrl + MdmConfig.DEVICES_ENDPOINT + "?id=eq." + deviceUuid;

        RequestBody body = RequestBody.create(
                deviceData.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .patch(body)
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .build();

        Log.d(TAG, "🔄 Updating device by UUID: " + deviceUuid);
        httpClient.newCall(request).enqueue(callback);
    }

    /**
     * Recupera comandi pending per dispositivo (GET)
     */
    public void getPendingCommands(String deviceId, Callback callback) {
        String url = supabaseUrl + MdmConfig.COMMANDS_ENDPOINT
                + "?device_id=eq." + deviceId
                + "&status=eq." + MdmConfig.CMD_STATUS_PENDING
                + "&order=created_at.asc";

        Request request = new Request.Builder()
                .url(url)
                .get()
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .build();

        httpClient.newCall(request).enqueue(callback);
    }

    /**
     * Aggiorna status comando (PATCH)
     */
    public void updateCommandStatus(String commandId, String status, String resultData, String errorMessage, Callback callback) {
        String url = supabaseUrl + MdmConfig.COMMANDS_ENDPOINT + "?id=eq." + commandId;

        JsonObject data = new JsonObject();
        data.addProperty("status", status);

        // Timestamp ISO 8601 per Supabase (come per heartbeat)
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US);
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        String timestamp = sdf.format(new java.util.Date());
        data.addProperty("completed_at", timestamp);

        if (resultData != null) {
            data.addProperty("result_data", resultData);
        }
        if (errorMessage != null) {
            data.addProperty("error_message", errorMessage);
        }

        RequestBody body = RequestBody.create(
                data.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .patch(body)
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .build();

        httpClient.newCall(request).enqueue(callback);
    }

    /**
     * Get device by android_id (GET)
     */
    public void getDeviceByAndroidId(String androidId, Callback callback) {
        String url = supabaseUrl + MdmConfig.DEVICES_ENDPOINT + "?android_id=eq." + androidId;

        Request request = new Request.Builder()
                .url(url)
                .get()
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .build();

        httpClient.newCall(request).enqueue(callback);
    }

    /**
     * Registra dispositivo (POST) - prima volta
     */
    public void registerDevice(JsonObject deviceData, Callback callback) {
        String url = supabaseUrl + MdmConfig.DEVICES_ENDPOINT;

        RequestBody body = RequestBody.create(
                deviceData.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .build();

        httpClient.newCall(request).enqueue(callback);
    }

    /**
     * Log attività MDM (POST)
     */
    public void logActivity(String activityType, String title, String description, boolean success, Callback callback) {
        String url = supabaseUrl + MdmConfig.LOGS_ENDPOINT;

        // Timestamp ISO 8601 per Supabase
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        String timestamp = sdf.format(new Date());

        JsonObject data = new JsonObject();
        data.addProperty("activity_type", activityType);
        data.addProperty("activity_title", title);
        data.addProperty("activity_description", description);
        data.addProperty("success", success);
        data.addProperty("created_at", timestamp);

        // Aggiungi device_id se disponibile (necessario per RLS)
        if (cachedDeviceUuid != null) {
            data.addProperty("device_id", cachedDeviceUuid);
        } else {
            Log.w(TAG, "⚠️  logActivity: device UUID not set, log may be rejected by RLS");
        }

        RequestBody body = RequestBody.create(
                data.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")
                .build();

        httpClient.newCall(request).enqueue(callback);
    }

    /**
     * Set device UUID per logging attività
     */
    public static void setDeviceUuid(String deviceUuid) {
        cachedDeviceUuid = deviceUuid;
        Log.d(TAG, "Device UUID set for activity logging: " + deviceUuid);
    }

    /**
     * Aggiorna posizione GPS dispositivo (PATCH)
     */
    public void updateDeviceLocation(String deviceId, double latitude, double longitude, float accuracy, long timestamp, Callback callback) {
        String url = supabaseUrl + MdmConfig.DEVICES_ENDPOINT + "?id=eq." + deviceId;

        JsonObject locationData = new JsonObject();

        // Crea oggetto GPS con coordinate
        JsonObject gpsData = new JsonObject();
        gpsData.addProperty("latitude", latitude);
        gpsData.addProperty("longitude", longitude);
        gpsData.addProperty("accuracy", accuracy);
        gpsData.addProperty("timestamp", timestamp);

        // Timestamp ISO 8601 per last_location_update
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US);
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        String isoTimestamp = sdf.format(new java.util.Date(timestamp));

        locationData.add("last_location", gpsData);
        locationData.addProperty("last_location_update", isoTimestamp);

        RequestBody body = RequestBody.create(
                locationData.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .patch(body)
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .build();

        Log.d(TAG, "📍 Updating device location: " + url);
        Log.d(TAG, "📍 Location data: " + locationData.toString());

        httpClient.newCall(request).enqueue(callback);
    }
}
