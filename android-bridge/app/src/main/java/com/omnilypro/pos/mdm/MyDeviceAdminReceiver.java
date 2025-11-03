package com.omnilypro.pos.mdm;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PersistableBundle;
import android.util.Log;

import androidx.annotation.NonNull;

/**
 * Device Admin Receiver per MDM
 * Questo permette all'app di diventare Device Owner e avere permessi speciali
 */
public class MyDeviceAdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "MyDeviceAdminReceiver";

    @Override
    public void onEnabled(@NonNull Context context, @NonNull Intent intent) {
        super.onEnabled(context, intent);
        Log.i(TAG, "✅ Device Admin ENABLED - App has admin privileges");
        ProvisioningLogger.log(context, "DEVICE_ADMIN_ENABLED", "Device Admin abilitato con successo");
        // NON fare nulla qui - tutta la logica è in onProfileProvisioningComplete()
    }

    @Override
    public void onDisabled(@NonNull Context context, @NonNull Intent intent) {
        super.onDisabled(context, intent);
        Log.w(TAG, "⚠️ Device Admin DISABLED - App lost admin privileges");
    }

    @Override
    public CharSequence onDisableRequested(@NonNull Context context, @NonNull Intent intent) {
        Log.w(TAG, "⚠️ Someone is trying to disable Device Admin");
        return "WARNING: Disabling Device Admin will prevent MDM features from working!";
    }

    @Override
    public void onLockTaskModeEntering(@NonNull Context context, @NonNull Intent intent, @NonNull String pkg) {
        super.onLockTaskModeEntering(context, intent, pkg);
        Log.i(TAG, "🔒 Entering Lock Task Mode (Kiosk)");
    }

    @Override
    public void onLockTaskModeExiting(@NonNull Context context, @NonNull Intent intent) {
        super.onLockTaskModeExiting(context, intent);
        Log.i(TAG, "🔓 Exiting Lock Task Mode (Kiosk)");
    }

    @Override
    public void onProfileProvisioningComplete(@NonNull Context context, @NonNull Intent intent) {
        super.onProfileProvisioningComplete(context, intent);
        Log.i(TAG, "✅ onProfileProvisioningComplete chiamato!");
        ProvisioningLogger.log(context, "PROVISIONING_COMPLETE", "onProfileProvisioningComplete chiamato");

        // Ottieni DevicePolicyManager per completare il provisioning
        android.app.admin.DevicePolicyManager dpm = (android.app.admin.DevicePolicyManager)
            context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        android.content.ComponentName adminComponent = new android.content.ComponentName(context, MyDeviceAdminReceiver.class);

        // IMPORTANTE: Usa Bundle invece di PersistableBundle (fix da Gemini)
        android.os.Bundle adminExtras = intent.getBundleExtra(android.app.admin.DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);

        if (adminExtras != null) {
            String setupToken = adminExtras.getString("setup_token");
            String deviceId = adminExtras.getString("device_id");
            String deviceName = adminExtras.getString("device_name", "POS Device");
            String organizationId = adminExtras.getString("organization_id", "");
            String storeLocation = adminExtras.getString("store_location", "");

            Log.i(TAG, "📦 Setup Token: " + setupToken);
            Log.i(TAG, "🆔 Device ID: " + deviceId);
            Log.i(TAG, "📱 Device Name: " + deviceName);
            Log.i(TAG, "🏢 Organization ID: " + organizationId);
            Log.i(TAG, "📍 Store Location: " + storeLocation);

            ProvisioningLogger.log(context, "SETUP_DATA_RECEIVED",
                "DeviceID: " + deviceId + ", Device: " + deviceName + ", Org: " + organizationId + ", Location: " + storeLocation);

            // Salva i dati nelle SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences("OmnilyPOS", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("setup_token", setupToken)
                .putString("device_id", deviceId)
                .putString("device_name", deviceName)
                .putString("organization_id", organizationId)
                .putString("store_location", storeLocation)
                .putBoolean("setup_completed", true)
                .putBoolean("provisioned_via_qr", true)
                .apply();

            Log.i(TAG, "✅ Dati di setup salvati con successo!");
            ProvisioningLogger.log(context, "SETUP_DATA_SAVED", "Dati salvati in SharedPreferences");
        } else {
            Log.w(TAG, "⚠️ Nessun dato extra ricevuto dal provisioning");
            ProvisioningLogger.log(context, "WARNING_NO_EXTRAS", "Nessun dato extra ricevuto dal provisioning");
        }

        // IMPORTANTE: Imposta il nome dell'organizzazione (raccomandato da Gemini)
        if (dpm != null) {
            dpm.setOrganizationName(adminComponent, "OMNILY");
            Log.i(TAG, "✅ Organization name impostato");
        }

        // --- PASSAGGIO FONDAMENTALE (da Gemini) ---
        // Lancia l'activity principale per completare il setup
        // SENZA QUESTO IL PROVISIONING FALLISCE!
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launchIntent);
            Log.i(TAG, "🚀 MainActivity lanciata - provisioning completato!");
            ProvisioningLogger.log(context, "MAIN_ACTIVITY_LAUNCHED", "MainActivity lanciata - provisioning completato!");
        } else {
            Log.e(TAG, "❌ Impossibile ottenere launch intent!");
            ProvisioningLogger.log(context, "ERROR_NO_LAUNCH_INTENT", "Impossibile ottenere launch intent");
        }
    }
}
