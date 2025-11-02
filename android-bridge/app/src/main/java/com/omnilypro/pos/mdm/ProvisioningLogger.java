package com.omnilypro.pos.mdm;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Logger che invia eventi di provisioning a Supabase in tempo reale
 */
public class ProvisioningLogger {
    private static final String TAG = "ProvisioningLogger";
    private static final String SUPABASE_URL = "https://sjvatdnvewohvswfrdiv.supabase.co/rest/v1/provisioning_logs";
    private static final String SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.y_AGPGd00o1oeAKhF5-tu7ZNJLy0x9bD5KOPqWnlMfk";

    /**
     * Invia un log a Supabase in modo asincrono
     */
    public static void log(final Context context, final String eventType, final String message) {
        // Log anche su Android per debugging via adb
        Log.i(TAG, "[" + eventType + "] " + message);
        log(context, eventType, message, null, null);
    }

    /**
     * Invia un log con errore a Supabase
     */
    public static void logError(final Context context, final String eventType, final String message, final Exception error) {
        String errorMsg = error != null ? error.getMessage() : null;
        String stackTrace = error != null ? Log.getStackTraceString(error) : null;
        log(context, eventType, message, errorMsg, stackTrace);
    }

    /**
     * Invia un log completo a Supabase
     */
    private static void log(final Context context, final String eventType, final String message,
                           final String errorMessage, final String stackTrace) {
        // Esegui in background per non bloccare il main thread
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Ottieni Android ID
                    String androidId = Settings.Secure.getString(context.getContentResolver(),
                                                                 Settings.Secure.ANDROID_ID);

                    // Crea JSON payload
                    JSONObject payload = new JSONObject();
                    payload.put("android_id", androidId != null ? androidId : "unknown");
                    payload.put("event_type", eventType);
                    payload.put("message", message);

                    if (errorMessage != null) {
                        payload.put("error_message", errorMessage);
                    }

                    if (stackTrace != null) {
                        payload.put("stack_trace", stackTrace);
                    }

                    // Aggiungi metadata
                    JSONObject metadata = new JSONObject();
                    metadata.put("android_version", Build.VERSION.SDK_INT);
                    metadata.put("device_model", Build.MODEL);
                    metadata.put("manufacturer", Build.MANUFACTURER);
                    metadata.put("app_version", "1.3.2");
                    payload.put("metadata", metadata);

                    // Invia a Supabase
                    URL url = new URL(SUPABASE_URL);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("apikey", SUPABASE_KEY);
                    conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_KEY);
                    conn.setRequestProperty("Prefer", "return=minimal");
                    conn.setDoOutput(true);

                    // Scrivi payload
                    try (OutputStream os = conn.getOutputStream()) {
                        byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                        os.write(input, 0, input.length);
                    }

                    int responseCode = conn.getResponseCode();
                    Log.i(TAG, "✅ Log inviato a Supabase: " + eventType + " - Response: " + responseCode);

                    conn.disconnect();

                } catch (Exception e) {
                    // Non propagare errori - il logging non deve mai bloccare l'app
                    Log.e(TAG, "❌ Errore invio log a Supabase (" + eventType + "): " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }).start();
    }
}
