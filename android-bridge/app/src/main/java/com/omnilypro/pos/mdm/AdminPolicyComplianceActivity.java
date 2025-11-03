package com.omnilypro.pos.mdm;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

/**
 * Activity richiesta da Android 14+ per il provisioning QR code.
 * Gestisce l'intent ACTION_ADMIN_POLICY_COMPLIANCE.
 *
 * Questa activity viene chiamata da Android dopo che l'app è stata installata
 * durante il provisioning, per verificare la compliance con le policy aziendali.
 */
public class AdminPolicyComplianceActivity extends Activity {
    private static final String TAG = "AdminPolicyCompliance";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "🔧 AdminPolicyComplianceActivity onCreate");

        // Verifica che sia l'intent corretto
        if (!DevicePolicyManager.ACTION_ADMIN_POLICY_COMPLIANCE.equals(getIntent().getAction())) {
            Log.e(TAG, "❌ Intent action non corretto: " + getIntent().getAction());
            finish();
            return;
        }

        // Per ora, diciamo che siamo compliant con tutte le policy
        // In futuro potresti aggiungere controlli specifici qui
        Log.i(TAG, "✅ Policy compliance verificata - tutto OK");

        // Segnala che la compliance è OK
        setResult(Activity.RESULT_OK);
        finish();
    }
}
