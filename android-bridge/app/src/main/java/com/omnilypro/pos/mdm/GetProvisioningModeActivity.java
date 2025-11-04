package com.omnilypro.pos.mdm;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.util.Log;

/**
 * Activity richiesta da Android 14+ per il provisioning QR code.
 * Gestisce l'intent ACTION_GET_PROVISIONING_MODE.
 *
 * Questa activity viene chiamata da Android durante il provisioning per
 * determinare quale modalità di provisioning utilizzare.
 *
 * IMPORTANTE: Su Android 14, i dati del provisioning vengono passati QUI,
 * non in onProfileProvisioningComplete che potrebbe non essere chiamato!
 */
public class GetProvisioningModeActivity extends Activity {
    private static final String TAG = "GetProvisioningMode";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "🔧 GetProvisioningModeActivity onCreate");

        // Verifica che sia l'intent corretto
        if (!DevicePolicyManager.ACTION_GET_PROVISIONING_MODE.equals(getIntent().getAction())) {
            Log.e(TAG, "❌ Intent action non corretto: " + getIntent().getAction());
            finish();
            return;
        }

        // ANDROID 14 FIX: Estrai e salva i dati del provisioning QUI
        try {
            PersistableBundle adminExtras = getIntent().getParcelableExtra(
                DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);

            if (adminExtras != null) {
                String setupToken = adminExtras.getString("setup_token");
                String deviceId = adminExtras.getString("device_id");
                String deviceName = adminExtras.getString("device_name");
                String organizationId = adminExtras.getString("organization_id");
                String storeLocation = adminExtras.getString("store_location");

                Log.i(TAG, "📦 Provisioning data received:");
                Log.i(TAG, "  Setup Token: " + setupToken);
                Log.i(TAG, "  Device ID: " + deviceId);
                Log.i(TAG, "  Device Name: " + deviceName);
                Log.i(TAG, "  Organization ID: " + organizationId);
                Log.i(TAG, "  Store Location: " + storeLocation);

                // Salva nelle SharedPreferences (stesso formato di MyDeviceAdminReceiver)
                SharedPreferences prefs = getSharedPreferences("OmnilyPOS", MODE_PRIVATE);
                prefs.edit()
                    .putString("setup_token", setupToken)
                    .putString("device_id", deviceId)
                    .putString("device_name", deviceName)
                    .putString("organization_id", organizationId)
                    .putString("store_location", storeLocation)
                    .putBoolean("setup_completed", true)
                    .putBoolean("provisioned_via_qr", true)
                    // NON settare device_registered=true qui! Deve essere settato DOPO la registrazione su Supabase
                    .apply();

                Log.i(TAG, "✅ Provisioning data saved to SharedPreferences!");
            } else {
                Log.w(TAG, "⚠️ No ADMIN_EXTRAS_BUNDLE found in intent");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error extracting provisioning data", e);
        }

        // Imposta il risultato: vogliamo FULLY_MANAGED_DEVICE (Device Owner mode)
        Intent result = new Intent();
        result.putExtra(DevicePolicyManager.EXTRA_PROVISIONING_MODE,
                DevicePolicyManager.PROVISIONING_MODE_FULLY_MANAGED_DEVICE);

        Log.i(TAG, "✅ Provisioning mode impostato: FULLY_MANAGED_DEVICE");

        setResult(Activity.RESULT_OK, result);
        finish();
    }
}
