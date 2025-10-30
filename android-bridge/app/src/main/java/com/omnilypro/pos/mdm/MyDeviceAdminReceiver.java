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
        Log.i(TAG, "✅ Provisioning completato! Ricevuti dati di setup...");

        // Ricevi i dati extra dal provisioning JSON
        PersistableBundle extras = intent.getParcelableExtra("android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE");

        if (extras != null) {
            String setupToken = extras.getString("setup_token");
            String deviceName = extras.getString("device_name", "POS Device");
            String organizationId = extras.getString("organization_id", "");
            String storeLocation = extras.getString("store_location", "");

            Log.i(TAG, "📦 Setup Token: " + setupToken);
            Log.i(TAG, "📱 Device Name: " + deviceName);
            Log.i(TAG, "🏢 Organization ID: " + organizationId);
            Log.i(TAG, "📍 Store Location: " + storeLocation);

            // Salva i dati nelle SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences("OmnilyPOS", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("setup_token", setupToken)
                .putString("device_name", deviceName)
                .putString("organization_id", organizationId)
                .putString("store_location", storeLocation)
                .putBoolean("setup_completed", true)
                .putBoolean("provisioned_via_qr", true)
                .apply();

            Log.i(TAG, "✅ Dati di setup salvati con successo!");

            // Avvia l'app principale
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
                Log.i(TAG, "🚀 App principale avviata!");
            }
        } else {
            Log.w(TAG, "⚠️ Nessun dato extra ricevuto dal provisioning");
        }
    }
}
