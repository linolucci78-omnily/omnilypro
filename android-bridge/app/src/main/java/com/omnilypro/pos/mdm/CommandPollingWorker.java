package com.omnilypro.pos.mdm;

import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Response;

/**
 * Worker che controlla comandi pending ogni 60 secondi
 */
public class CommandPollingWorker extends Worker {
    private static final String TAG = "CommandPollingWorker";
    private final Gson gson = new Gson();

    // Device ID storage key
    private static String cachedDeviceId = null;

    public CommandPollingWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "🔄 ========== COMMAND POLLING WORKER START ==========");
        try {
            pollCommands();
            Log.i(TAG, "✅ Command polling completed successfully");
            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "❌ Error polling commands", e);
            return Result.retry();
        }
    }

    private void pollCommands() {
        if (cachedDeviceId == null) {
            Log.e(TAG, "❌ Device UUID is NULL - cannot poll commands!");
            return;
        }

        Log.i(TAG, "🔍 Polling commands for device UUID: " + cachedDeviceId);
        Log.i(TAG, "📍 Query URL will be: /rest/v1/device_commands?device_id=eq." + cachedDeviceId + "&status=eq.pending");

        SupabaseClient.getInstance().getPendingCommands(cachedDeviceId, new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.e(TAG, "Failed to poll commands", e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    String responseData = response.body().string();
                    Log.i(TAG, "✅ Commands poll SUCCESS - Response code: " + response.code());
                    Log.i(TAG, "📦 Response data: " + responseData);

                    try {
                        JsonArray commands = gson.fromJson(responseData, JsonArray.class);
                        Log.i(TAG, "📋 Found " + commands.size() + " pending commands");

                        if (commands.size() == 0) {
                            Log.i(TAG, "📭 No pending commands to execute");
                        }

                        for (int i = 0; i < commands.size(); i++) {
                            JsonElement element = commands.get(i);
                            JsonObject command = element.getAsJsonObject();
                            Log.i(TAG, "🎯 Executing command " + (i + 1) + " of " + commands.size());
                            executeCommand(command);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Error parsing commands response", e);
                    }
                } else {
                    Log.w(TAG, "⚠️ Commands poll response NOT successful - Code: " + response.code());
                    if (response.body() != null) {
                        Log.w(TAG, "⚠️ Error body: " + response.body().string());
                    }
                }
                response.close();
            }
        });
    }

    private void executeCommand(JsonObject command) {
        Log.i(TAG, "🚀 ========== EXECUTING COMMAND ==========");
        Log.i(TAG, "📄 Full command JSON: " + command.toString());

        String commandId = command.get("id").getAsString();
        String commandType = command.get("command_type").getAsString();
        String commandTitle = "";
        if (command.has("command_title") && !command.get("command_title").isJsonNull()) {
            commandTitle = command.get("command_title").getAsString();
        }

        Log.i(TAG, "🎯 Command ID: " + commandId);
        Log.i(TAG, "🎯 Command Type: " + commandType);
        Log.i(TAG, "🎯 Command Title: " + commandTitle);

        // FEEDBACK VISIVO: Mostra Toast + Beep + Vibrazione
        showVisualFeedback("🎯 COMANDO MDM: " + commandType.toUpperCase());

        // Update status to executing
        Log.i(TAG, "📝 Updating command status to EXECUTING...");
        updateCommandStatus(commandId, MdmConfig.CMD_STATUS_EXECUTING, null, null);

        boolean success = false;
        String errorMessage = null;

        try {
            switch (commandType) {
                case MdmConfig.CMD_REBOOT:
                    success = executeReboot();
                    break;

                case MdmConfig.CMD_SHUTDOWN:
                    success = executeShutdown();
                    break;

                case MdmConfig.CMD_KIOSK_ON:
                    success = executeKioskOn();
                    break;

                case MdmConfig.CMD_KIOSK_OFF:
                    success = executeKioskOff();
                    break;

                case MdmConfig.CMD_UPDATE_APP:
                    JsonObject payload = command.has("payload") ? command.getAsJsonObject("payload") : null;
                    success = executeUpdateApp(payload);
                    break;

                case MdmConfig.CMD_SYNC_CONFIG:
                    success = executeSyncConfig();
                    break;

                case MdmConfig.CMD_LOCATE:
                    success = executeLocate();
                    break;

                default:
                    errorMessage = "Unknown command type: " + commandType;
                    Log.w(TAG, errorMessage);
                    break;
            }

            // Update command status
            String finalStatus = success ? MdmConfig.CMD_STATUS_COMPLETED : MdmConfig.CMD_STATUS_FAILED;
            Log.i(TAG, "📝 Command execution result: " + (success ? "SUCCESS ✅" : "FAILED ❌"));
            if (errorMessage != null) {
                Log.e(TAG, "❌ Error message: " + errorMessage);
            }
            Log.i(TAG, "📝 Updating command status to: " + finalStatus);
            updateCommandStatus(commandId, finalStatus, null, errorMessage);

            // Log activity
            SupabaseClient.getInstance().logActivity(
                    "command_execution",
                    "Command: " + commandType,
                    "Executed command: " + commandTitle,
                    success,
                    new Callback() {
                        @Override
                        public void onFailure(@NonNull Call call, @NonNull IOException e) {
                            Log.e(TAG, "Failed to log activity", e);
                        }

                        @Override
                        public void onResponse(@NonNull Call call, @NonNull Response response) {
                            response.close();
                        }
                    }
            );

        } catch (Exception e) {
            Log.e(TAG, "❌ EXCEPTION executing command: " + commandType, e);
            Log.e(TAG, "❌ Exception message: " + e.getMessage());
            updateCommandStatus(commandId, MdmConfig.CMD_STATUS_FAILED, null, e.getMessage());
        }

        Log.i(TAG, "🏁 ========== COMMAND EXECUTION END ==========");
    }

    private void updateCommandStatus(String commandId, String status, String resultData, String errorMessage) {
        Log.i(TAG, "📡 Updating command status - ID: " + commandId + ", Status: " + status);
        SupabaseClient.getInstance().updateCommandStatus(commandId, status, resultData, errorMessage, new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.e(TAG, "❌ Failed to update command status for ID: " + commandId, e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) {
                if (response.isSuccessful()) {
                    Log.i(TAG, "✅ Command status updated successfully to: " + status + " for ID: " + commandId);
                } else {
                    Log.w(TAG, "⚠️ Command status update failed with code: " + response.code() + " for ID: " + commandId);
                }
                response.close();
            }
        });
    }

    // ============================================================================
    // Command Implementations
    // ============================================================================

    private boolean executeReboot() {
        Log.i(TAG, "🔄 Attempting to REBOOT device...");
        try {
            PowerManager pm = (PowerManager) getApplicationContext().getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                Log.i(TAG, "✅ PowerManager obtained, requesting reboot...");
                // Requires REBOOT permission or system app
                pm.reboot("MDM Command");
                Log.i(TAG, "✅ Reboot command sent successfully");
                return true;
            } else {
                Log.e(TAG, "❌ PowerManager is NULL");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "❌ Reboot failed - PERMISSION DENIED (requires REBOOT permission)", e);
        } catch (Exception e) {
            Log.e(TAG, "❌ Reboot failed - Exception", e);
        }
        return false;
    }

    private boolean executeShutdown() {
        try {
            Log.i(TAG, "Executing shutdown...");
            PowerManager pm = (PowerManager) getApplicationContext().getSystemService(Context.POWER_SERVICE);
            if (pm != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN_MR1) {
                // Requires REBOOT permission or system app
                pm.reboot(null); // null = shutdown
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Shutdown failed", e);
        }
        return false;
    }

    private boolean executeKioskOn() {
        Log.i(TAG, "🔒 Attempting to enable KIOSK MODE...");
        try {
            // TODO: Implementare logica kiosk mode
            // Questo richiede Device Owner o admin privileges
            // Broadcast intent to MainActivity to enable kiosk
            Intent intent = new Intent("com.omnilypro.pos.KIOSK_MODE");
            intent.putExtra("enabled", true);
            getApplicationContext().sendBroadcast(intent);
            Log.i(TAG, "✅ Kiosk mode broadcast sent successfully");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "❌ Kiosk ON failed", e);
            return false;
        }
    }

    private boolean executeKioskOff() {
        try {
            Log.i(TAG, "Disabling kiosk mode...");
            // Broadcast intent to MainActivity to disable kiosk
            Intent intent = new Intent("com.omnilypro.pos.KIOSK_MODE");
            intent.putExtra("enabled", false);
            getApplicationContext().sendBroadcast(intent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Kiosk OFF failed", e);
            return false;
        }
    }

    private boolean executeUpdateApp(JsonObject payload) {
        try {
            Log.i(TAG, "Updating app...");
            if (payload == null) {
                Log.w(TAG, "No payload for update_app command");
                return false;
            }

            String apkUrl = payload.has("apk_url") ? payload.get("apk_url").getAsString() : null;
            String packageName = payload.has("package_name") ? payload.get("package_name").getAsString() : null;

            Log.d(TAG, "Update app: " + packageName + " from " + apkUrl);

            // TODO: Implementare download e installazione APK
            // Questo richiede permessi speciali o system app
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Update app failed", e);
            return false;
        }
    }

    private boolean executeSyncConfig() {
        try {
            Log.i(TAG, "Syncing configuration...");
            // TODO: Implementare sync configurazioni da backend
            // Broadcast intent to MainActivity
            Intent intent = new Intent("com.omnilypro.pos.SYNC_CONFIG");
            getApplicationContext().sendBroadcast(intent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Sync config failed", e);
            return false;
        }
    }

    private boolean executeLocate() {
        try {
            Log.i(TAG, "📍 Locating device - getting GPS position...");

            // Get GPS position
            android.location.LocationManager locationManager =
                (android.location.LocationManager) getApplicationContext().getSystemService(android.content.Context.LOCATION_SERVICE);

            if (locationManager == null) {
                Log.e(TAG, "❌ LocationManager not available");
                return false;
            }

            // Check permission
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                if (getApplicationContext().checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    Log.w(TAG, "⚠️ GPS permission not granted - returning last known location");
                }
            }

            // Get last known location (non blocca)
            android.location.Location location = null;
            try {
                location = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);
                if (location == null) {
                    location = locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER);
                }
            } catch (SecurityException e) {
                Log.w(TAG, "⚠️ GPS permission denied: " + e.getMessage());
            }

            if (location != null) {
                double latitude = location.getLatitude();
                double longitude = location.getLongitude();
                float accuracy = location.getAccuracy();
                long timestamp = location.getTime();

                Log.i(TAG, "✅ GPS Position found:");
                Log.i(TAG, "   📍 Latitude: " + latitude);
                Log.i(TAG, "   📍 Longitude: " + longitude);
                Log.i(TAG, "   📍 Accuracy: " + accuracy + "m");
                Log.i(TAG, "   📍 Timestamp: " + new java.util.Date(timestamp));

                // Invia posizione al server tramite SupabaseClient
                if (cachedDeviceId != null) {
                    Log.i(TAG, "📡 Sending GPS location to server...");
                    SupabaseClient.getInstance().updateDeviceLocation(
                        cachedDeviceId,
                        latitude,
                        longitude,
                        accuracy,
                        timestamp,
                        new Callback() {
                            @Override
                            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                                Log.e(TAG, "❌ Failed to update device location on server", e);
                            }

                            @Override
                            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                                if (response.isSuccessful()) {
                                    Log.i(TAG, "✅ GPS location updated on server successfully");
                                } else {
                                    Log.w(TAG, "⚠️ Failed to update location - Response code: " + response.code());
                                    if (response.body() != null) {
                                        Log.w(TAG, "⚠️ Error: " + response.body().string());
                                    }
                                }
                                response.close();
                            }
                        }
                    );
                } else {
                    Log.w(TAG, "⚠️ Device ID is null, cannot update location on server");
                }

                return true;
            } else {
                Log.w(TAG, "⚠️ No GPS location available - command succeeded but no position data");
                return true; // Comando eseguito con successo anche se no GPS
            }

        } catch (Exception e) {
            Log.e(TAG, "❌ Locate failed", e);
            return false;
        }
    }

    /**
     * Mostra feedback visivo quando viene eseguito un comando MDM
     */
    private void showVisualFeedback(final String message) {
        try {
            // Toast visibile
            new android.os.Handler(android.os.Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    android.widget.Toast.makeText(
                        getApplicationContext(),
                        message,
                        android.widget.Toast.LENGTH_LONG
                    ).show();
                }
            });

            // Beep sonoro
            android.media.ToneGenerator toneGen = new android.media.ToneGenerator(
                android.media.AudioManager.STREAM_NOTIFICATION, 100);
            toneGen.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, 200);
            new android.os.Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    toneGen.release();
                }
            }, 300);

            // Vibrazione
            android.os.Vibrator vibrator = (android.os.Vibrator) getApplicationContext()
                .getSystemService(android.content.Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                vibrator.vibrate(500); // 500ms
            }

            Log.i(TAG, "✅ Visual feedback shown: " + message);
        } catch (Exception e) {
            Log.e(TAG, "❌ Error showing visual feedback", e);
        }
    }

    /**
     * Set device ID dopo registrazione
     */
    public static void setDeviceId(String deviceId) {
        cachedDeviceId = deviceId;
    }
}
