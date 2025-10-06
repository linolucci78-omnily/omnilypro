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
        try {
            pollCommands();
            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Error polling commands", e);
            return Result.retry();
        }
    }

    private void pollCommands() {
        // TODO: Recuperare device_id da SharedPreferences o registrazione
        // Per ora usiamo android_id come fallback
        String androidId = Settings.Secure.getString(
                getApplicationContext().getContentResolver(),
                Settings.Secure.ANDROID_ID
        );

        // In produzione, dovresti fare prima una query per ottenere device_id da android_id
        // Per ora usiamo device_id direttamente se cached
        if (cachedDeviceId == null) {
            Log.w(TAG, "Device not registered yet, skipping command poll");
            return;
        }

        SupabaseClient.getInstance().getPendingCommands(cachedDeviceId, new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.e(TAG, "Failed to poll commands", e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    String responseData = response.body().string();
                    Log.d(TAG, "Commands response: " + responseData);

                    try {
                        JsonArray commands = gson.fromJson(responseData, JsonArray.class);
                        for (JsonElement element : commands) {
                            JsonObject command = element.getAsJsonObject();
                            executeCommand(command);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error parsing commands", e);
                    }
                }
                response.close();
            }
        });
    }

    private void executeCommand(JsonObject command) {
        String commandId = command.get("id").getAsString();
        String commandType = command.get("command_type").getAsString();
        String commandTitle = command.has("command_title") ? command.get("command_title").getAsString() : "";

        Log.i(TAG, "Executing command: " + commandType + " (" + commandTitle + ")");

        // Update status to executing
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
            Log.e(TAG, "Error executing command: " + commandType, e);
            updateCommandStatus(commandId, MdmConfig.CMD_STATUS_FAILED, null, e.getMessage());
        }
    }

    private void updateCommandStatus(String commandId, String status, String resultData, String errorMessage) {
        SupabaseClient.getInstance().updateCommandStatus(commandId, status, resultData, errorMessage, new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.e(TAG, "Failed to update command status", e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) {
                Log.d(TAG, "Command status updated to: " + status);
                response.close();
            }
        });
    }

    // ============================================================================
    // Command Implementations
    // ============================================================================

    private boolean executeReboot() {
        try {
            Log.i(TAG, "Executing reboot...");
            PowerManager pm = (PowerManager) getApplicationContext().getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                // Requires REBOOT permission or system app
                pm.reboot("MDM Command");
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Reboot failed", e);
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
        try {
            Log.i(TAG, "Enabling kiosk mode...");
            // TODO: Implementare logica kiosk mode
            // Questo richiede Device Owner o admin privileges
            // Broadcast intent to MainActivity to enable kiosk
            Intent intent = new Intent("com.omnilypro.pos.KIOSK_MODE");
            intent.putExtra("enabled", true);
            getApplicationContext().sendBroadcast(intent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Kiosk ON failed", e);
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
            Log.i(TAG, "Locating device...");
            // TODO: Implementare invio posizione GPS
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Locate failed", e);
            return false;
        }
    }

    /**
     * Set device ID dopo registrazione
     */
    public static void setDeviceId(String deviceId) {
        cachedDeviceId = deviceId;
    }
}
