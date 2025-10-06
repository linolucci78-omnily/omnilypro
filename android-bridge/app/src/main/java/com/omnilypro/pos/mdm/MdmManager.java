package com.omnilypro.pos.mdm;

import android.content.Context;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.util.Log;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.google.gson.JsonObject;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Response;

/**
 * Manager principale per funzionalità MDM
 * Inizializza e gestisce Heartbeat e Command Polling
 */
public class MdmManager {
    private static final String TAG = "MdmManager";
    private static final String PREFS_NAME = "mdm_prefs";
    private static final String KEY_DEVICE_ID = "device_id";
    private static final String KEY_DEVICE_REGISTERED = "device_registered";

    private static MdmManager instance;
    private final Context context;
    private final SharedPreferences prefs;

    private MdmManager(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized MdmManager getInstance(Context context) {
        if (instance == null) {
            instance = new MdmManager(context);
        }
        return instance;
    }

    /**
     * Inizializza sistema MDM
     * Registra dispositivo e avvia worker background
     */
    public void initialize() {
        Log.i(TAG, "Initializing MDM system...");

        // Controlla se dispositivo è già registrato
        if (isDeviceRegistered()) {
            Log.d(TAG, "Device already registered");
            String deviceId = getDeviceId();
            CommandPollingWorker.setDeviceId(deviceId);
            startBackgroundWorkers();
        } else {
            Log.d(TAG, "Device not registered, registering now...");
            registerDevice();
        }
    }

    /**
     * Registra dispositivo su backend
     */
    private void registerDevice() {
        String androidId = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ANDROID_ID
        );

        JsonObject deviceData = new JsonObject();
        deviceData.addProperty("android_id", androidId);
        deviceData.addProperty("name", "POS-" + androidId.substring(0, 8));
        deviceData.addProperty("device_model", android.os.Build.MODEL);
        deviceData.addProperty("status", MdmConfig.STATUS_ONLINE);
        deviceData.addProperty("language", "it_IT");

        SupabaseClient.getInstance().registerDevice(deviceData, new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Failed to register device", e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    String responseData = response.body().string();
                    Log.d(TAG, "Device registered: " + responseData);

                    // TODO: Parse response e salvare device_id
                    // Per ora usiamo android_id come device_id
                    saveDeviceId(androidId);
                    markDeviceAsRegistered();
                    CommandPollingWorker.setDeviceId(androidId);

                    // Avvia background workers
                    startBackgroundWorkers();
                } else {
                    Log.w(TAG, "Registration failed: " + response.code());
                }
                response.close();
            }
        });
    }

    /**
     * Avvia worker background per heartbeat e command polling
     */
    private void startBackgroundWorkers() {
        Log.i(TAG, "Starting background workers...");

        WorkManager workManager = WorkManager.getInstance(context);

        // Constraints: richiede connessione internet
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        // Heartbeat Worker - ogni 30 secondi
        PeriodicWorkRequest heartbeatWork = new PeriodicWorkRequest.Builder(
                HeartbeatWorker.class,
                30, TimeUnit.SECONDS // Intervallo minimo 15 minuti in produzione
        )
                .setConstraints(constraints)
                .addTag("mdm_heartbeat")
                .build();

        // Command Polling Worker - ogni 1 minuto
        PeriodicWorkRequest commandPollingWork = new PeriodicWorkRequest.Builder(
                CommandPollingWorker.class,
                1, TimeUnit.MINUTES // Intervallo minimo 15 minuti in produzione
        )
                .setConstraints(constraints)
                .addTag("mdm_commands")
                .build();

        // Enqueue workers (replace existing)
        workManager.enqueueUniquePeriodicWork(
                "mdm_heartbeat",
                ExistingPeriodicWorkPolicy.REPLACE,
                heartbeatWork
        );

        workManager.enqueueUniquePeriodicWork(
                "mdm_commands",
                ExistingPeriodicWorkPolicy.REPLACE,
                commandPollingWork
        );

        Log.i(TAG, "Background workers started");
    }

    /**
     * Stop MDM workers
     */
    public void stopWorkers() {
        Log.i(TAG, "Stopping MDM workers...");
        WorkManager.getInstance(context).cancelAllWorkByTag("mdm_heartbeat");
        WorkManager.getInstance(context).cancelAllWorkByTag("mdm_commands");
    }

    // ============================================================================
    // Preferences Management
    // ============================================================================

    private boolean isDeviceRegistered() {
        return prefs.getBoolean(KEY_DEVICE_REGISTERED, false);
    }

    private void markDeviceAsRegistered() {
        prefs.edit().putBoolean(KEY_DEVICE_REGISTERED, true).apply();
    }

    private void saveDeviceId(String deviceId) {
        prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply();
    }

    private String getDeviceId() {
        return prefs.getString(KEY_DEVICE_ID, null);
    }

    /**
     * Reset registrazione (per testing)
     */
    public void resetRegistration() {
        prefs.edit()
                .remove(KEY_DEVICE_REGISTERED)
                .remove(KEY_DEVICE_ID)
                .apply();
        stopWorkers();
        Log.i(TAG, "Device registration reset");
    }
}
