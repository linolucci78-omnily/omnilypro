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

    // Handler per polling continuo ogni 1 minuto
    private android.os.Handler pollingHandler;
    private Runnable pollingRunnable;
    private static final long POLLING_INTERVAL_MS = 60000; // 1 minuto

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
        Log.i(TAG, "🚀 ========== MDM INITIALIZATION START ==========");

        // Controlla se dispositivo è già registrato
        if (isDeviceRegistered()) {
            String deviceId = getDeviceId();
            Log.i(TAG, "✅ Device already registered with ID: " + deviceId);

            // Mostra Device ID con Toast
            showDeviceIdToast(deviceId);

            // Se il deviceId è un android_id (non un UUID), dobbiamo recuperare l'UUID reale
            if (deviceId != null && !deviceId.contains("-")) {
                Log.d(TAG, "Device ID is android_id, fetching UUID...");
                fetchDeviceUuid();
            } else {
                CommandPollingWorker.setDeviceId(deviceId);
                SupabaseClient.setDeviceUuid(deviceId);
                startBackgroundWorkers();

                // POLLING IMMEDIATO - non aspettare WorkManager
                Log.i(TAG, "🔥 Starting IMMEDIATE command poll...");
                performImmediateCommandPoll();
            }
        } else {
            Log.d(TAG, "Device not registered, registering now...");
            registerDevice();
        }
    }

    /**
     * Esegue polling comandi IMMEDIATAMENTE senza aspettare WorkManager
     */
    private void performImmediateCommandPoll() {
        new Thread(() -> {
            try {
                String deviceId = getDeviceId();
                if (deviceId == null) {
                    Log.e(TAG, "❌ Cannot poll commands - Device ID is null");
                    return;
                }

                Log.i(TAG, "🔍 Immediate polling for device: " + deviceId);

                SupabaseClient.getInstance().getPendingCommands(deviceId, new Callback() {
                    @Override
                    public void onFailure(Call call, IOException e) {
                        Log.e(TAG, "❌ Immediate poll FAILED: " + e.getMessage(), e);
                    }

                    @Override
                    public void onResponse(Call call, Response response) throws IOException {
                        if (response.isSuccessful() && response.body() != null) {
                            String responseData = response.body().string();
                            Log.i(TAG, "✅ Immediate poll SUCCESS - Response: " + responseData);

                            try {
                                com.google.gson.JsonArray commands = new com.google.gson.Gson()
                                    .fromJson(responseData, com.google.gson.JsonArray.class);
                                Log.i(TAG, "📋 Found " + commands.size() + " pending commands");

                                if (commands.size() > 0) {
                                    Log.i(TAG, "🎯 Commands found! Triggering CommandPollingWorker...");
                                    // Triggera il worker per eseguire i comandi
                                    androidx.work.OneTimeWorkRequest commandWork =
                                        new androidx.work.OneTimeWorkRequest.Builder(CommandPollingWorker.class).build();
                                    androidx.work.WorkManager.getInstance(context).enqueue(commandWork);
                                } else {
                                    Log.i(TAG, "📭 No pending commands found");
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "❌ Error parsing commands response", e);
                            }
                        } else {
                            Log.w(TAG, "⚠️ Immediate poll response NOT successful: " + response.code());
                        }
                        response.close();
                    }
                });

            } catch (Exception e) {
                Log.e(TAG, "❌ Exception in immediate poll", e);
            }
        }).start();
    }

    /**
     * Mostra Toast con Device ID
     */
    private void showDeviceIdToast(String deviceId) {
        android.os.Handler mainHandler = new android.os.Handler(android.os.Looper.getMainLooper());
        mainHandler.post(() -> {
            android.widget.Toast.makeText(
                context,
                "MDM Device ID: " + (deviceId != null ? deviceId.substring(0, Math.min(8, deviceId.length())) + "..." : "NULL"),
                android.widget.Toast.LENGTH_LONG
            ).show();
        });
    }

    private void fetchDeviceUuid() {
        String androidId = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ANDROID_ID
        );

        // Query device per ottenere UUID
        SupabaseClient.getInstance().getDeviceByAndroidId(androidId, new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Failed to fetch device UUID", e);
                // Fallback: usa android_id
                CommandPollingWorker.setDeviceId(androidId);
                SupabaseClient.setDeviceUuid(androidId);
                startBackgroundWorkers();
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    Log.d(TAG, "Device fetch response: " + responseBody);

                    try {
                        com.google.gson.JsonArray jsonArray = new com.google.gson.Gson().fromJson(responseBody, com.google.gson.JsonArray.class);
                        if (jsonArray.size() > 0) {
                            com.google.gson.JsonObject deviceObj = jsonArray.get(0).getAsJsonObject();
                            String deviceUuid = deviceObj.get("id").getAsString();

                            Log.i(TAG, "✅ Fetched device UUID: " + deviceUuid);
                            saveDeviceId(deviceUuid);
                            CommandPollingWorker.setDeviceId(deviceUuid);
                SupabaseClient.setDeviceUuid(deviceUuid);
                            showDeviceIdToast(deviceUuid);
                        } else {
                            Log.w(TAG, "No device found, using android_id");
                            CommandPollingWorker.setDeviceId(androidId);
                SupabaseClient.setDeviceUuid(androidId);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error parsing device response", e);
                        CommandPollingWorker.setDeviceId(androidId);
                SupabaseClient.setDeviceUuid(androidId);
                    }
                } else {
                    Log.w(TAG, "Device fetch failed: " + response.code());
                    CommandPollingWorker.setDeviceId(androidId);
                SupabaseClient.setDeviceUuid(androidId);
                }
                startBackgroundWorkers();

                // POLLING IMMEDIATO dopo aver settato il device ID
                Log.i(TAG, "🔥 Starting IMMEDIATE command poll after device ID fetch...");
                performImmediateCommandPoll();

                response.close();
            }
        });
    }

    /**
     * Registra dispositivo su backend
     * Usa il device_id ricevuto dal QR provisioning invece di android_id
     */
    private void registerDevice() {
        // Leggi device_id dalle SharedPreferences (salvato durante provisioning)
        SharedPreferences prefs = context.getSharedPreferences("OmnilyPOS", Context.MODE_PRIVATE);
        String deviceId = prefs.getString("device_id", null);

        if (deviceId == null || deviceId.isEmpty()) {
            Log.e(TAG, "❌ No device_id found in SharedPreferences! Cannot register.");
            Log.e(TAG, "❌ Device must be provisioned via QR code first.");
            return;
        }

        String androidId = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ANDROID_ID
        );

        Log.i(TAG, "📱 Registering device with ID: " + deviceId);
        Log.i(TAG, "🔑 Android ID: " + androidId);

        // UPDATE device usando l'UUID (device_id) ricevuto dal QR
        JsonObject deviceData = new JsonObject();
        deviceData.addProperty("android_id", androidId); // Salva il vero android_id
        deviceData.addProperty("status", MdmConfig.STATUS_ONLINE);
        deviceData.addProperty("last_seen", System.currentTimeMillis());
        deviceData.addProperty("device_model", android.os.Build.MODEL);
        deviceData.addProperty("language", "it_IT");

        SupabaseClient.getInstance().updateDeviceByUuid(deviceId, deviceData, new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "❌ Failed to register device", e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    Log.i(TAG, "✅ Device registered successfully: " + responseBody);

                    try {
                        // Parse response per conferma
                        com.google.gson.JsonArray jsonArray = new com.google.gson.Gson().fromJson(responseBody, com.google.gson.JsonArray.class);
                        if (jsonArray.size() > 0) {
                            com.google.gson.JsonObject deviceObj = jsonArray.get(0).getAsJsonObject();
                            String deviceUuid = deviceObj.get("id").getAsString();

                            Log.i(TAG, "✅ Device UUID confirmed: " + deviceUuid);
                            saveDeviceId(deviceUuid);
                            markDeviceAsRegistered();
                            CommandPollingWorker.setDeviceId(deviceUuid);
                            SupabaseClient.setDeviceUuid(deviceUuid);
                            showDeviceIdToast(deviceUuid);
                            startBackgroundWorkers();

                            // POLLING IMMEDIATO dopo registrazione
                            Log.i(TAG, "🔥 Starting IMMEDIATE command poll after registration...");
                            performImmediateCommandPoll();
                        } else {
                            Log.e(TAG, "❌ Empty response from server");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Error parsing device response", e);
                    }
                } else {
                    String errorBody = response.body() != null ? response.body().string() : "no body";
                    Log.e(TAG, "❌ Registration failed: " + response.code() + " - " + errorBody);
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

        // NUOVO: Polling continuo ogni 1 minuto usando Handler (bypassa limite 15min di Android)
        startContinuousPolling();

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
        stopContinuousPolling();
        WorkManager.getInstance(context).cancelAllWorkByTag("mdm_heartbeat");
        WorkManager.getInstance(context).cancelAllWorkByTag("mdm_commands");
    }

    /**
     * Avvia polling continuo ogni 1 minuto usando Handler
     */
    private void startContinuousPolling() {
        if (pollingHandler == null) {
            pollingHandler = new android.os.Handler(android.os.Looper.getMainLooper());
        }

        pollingRunnable = new Runnable() {
            @Override
            public void run() {
                Log.i(TAG, "🔄 Continuous polling tick (every 1 minute)");
                performImmediateCommandPoll();

                // Ri-schedula per il prossimo minuto
                if (pollingHandler != null) {
                    pollingHandler.postDelayed(this, POLLING_INTERVAL_MS);
                }
            }
        };

        // Avvia il primo polling dopo 1 minuto
        pollingHandler.postDelayed(pollingRunnable, POLLING_INTERVAL_MS);
        Log.i(TAG, "✅ Continuous polling started (interval: 1 minute)");
    }

    /**
     * Ferma polling continuo
     */
    private void stopContinuousPolling() {
        if (pollingHandler != null && pollingRunnable != null) {
            pollingHandler.removeCallbacks(pollingRunnable);
            Log.i(TAG, "❌ Continuous polling stopped");
        }
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
     * Forza polling manuale dei comandi (per testing/debug)
     */
    public void forceCommandPoll() {
        Log.i(TAG, "🔧 MANUAL command poll triggered");
        performImmediateCommandPoll();
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

    /**
     * Ottieni Device ID corrente
     */
    public String getCurrentDeviceId() {
        return getDeviceId();
    }
}
