package com.omnilypro.pos.mdm;

import android.util.Log;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
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
     * Aggiorna stato dispositivo (PATCH)
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
        data.addProperty("completed_at", System.currentTimeMillis());

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

        JsonObject data = new JsonObject();
        data.addProperty("activity_type", activityType);
        data.addProperty("activity_title", title);
        data.addProperty("activity_description", description);
        data.addProperty("success", success);
        data.addProperty("created_at", System.currentTimeMillis());

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
                .build();

        httpClient.newCall(request).enqueue(callback);
    }
}
