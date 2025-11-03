package com.omnilypro.pos.mdm;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

/**
 * Activity richiesta da Android 14+ per il provisioning QR code.
 * Gestisce l'intent ACTION_GET_PROVISIONING_MODE.
 *
 * Questa activity viene chiamata da Android durante il provisioning per
 * determinare quale modalità di provisioning utilizzare.
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

        // Imposta il risultato: vogliamo FULLY_MANAGED_DEVICE (Device Owner mode)
        Intent result = new Intent();
        result.putExtra(DevicePolicyManager.EXTRA_PROVISIONING_MODE,
                DevicePolicyManager.PROVISIONING_MODE_FULLY_MANAGED_DEVICE);

        Log.i(TAG, "✅ Provisioning mode impostato: FULLY_MANAGED_DEVICE");

        setResult(Activity.RESULT_OK, result);
        finish();
    }
}
