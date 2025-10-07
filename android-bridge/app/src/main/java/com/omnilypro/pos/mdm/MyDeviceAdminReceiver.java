package com.omnilypro.pos.mdm;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
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
}
