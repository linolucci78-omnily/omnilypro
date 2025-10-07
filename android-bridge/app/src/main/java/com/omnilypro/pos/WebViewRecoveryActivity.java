package com.omnilypro.pos;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;

/**
 * Activity che gestisce il recovery automatico del WebView corrotto
 * Soluzione enterprise-ready per produzione
 */
public class WebViewRecoveryActivity extends Activity {
    private static final String TAG = "WebViewRecovery";
    private static final String RECOVERY_PREFS = "webview_recovery";
    private static final String KEY_LAST_RECOVERY = "last_recovery_time";
    private static final String KEY_RECOVERY_COUNT = "recovery_count";
    private static final long RECOVERY_WINDOW_MS = 300000; // 5 minuti
    private static final int MAX_AUTO_RECOVERIES = 3;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.i(TAG, "🔧 WebView Recovery Activity started");

        SharedPreferences prefs = getSharedPreferences(RECOVERY_PREFS, MODE_PRIVATE);
        long lastRecovery = prefs.getLong(KEY_LAST_RECOVERY, 0);
        int recoveryCount = prefs.getInt(KEY_RECOVERY_COUNT, 0);
        long now = System.currentTimeMillis();

        // Reset counter se sono passati più di 5 minuti
        if (now - lastRecovery > RECOVERY_WINDOW_MS) {
            recoveryCount = 0;
        }

        if (recoveryCount < MAX_AUTO_RECOVERIES) {
            // Auto-recovery automatico
            performAutoRecovery(prefs, recoveryCount, now);
        } else {
            // Troppi tentativi - mostra dialog manuale
            showManualRecoveryDialog();
        }
    }

    private void performAutoRecovery(SharedPreferences prefs, int recoveryCount, long now) {
        Log.i(TAG, "🔄 Performing auto-recovery (attempt " + (recoveryCount + 1) + "/" + MAX_AUTO_RECOVERIES + ")");

        // Aggiorna contatore
        prefs.edit()
            .putLong(KEY_LAST_RECOVERY, now)
            .putInt(KEY_RECOVERY_COUNT, recoveryCount + 1)
            .apply();

        // STEP 1: Cancella tutti i dati WebView dell'app
        try {
            android.webkit.WebStorage.getInstance().deleteAllData();
            android.webkit.WebView.clearClientCertPreferences(null);
            android.webkit.CookieManager.getInstance().removeAllCookies(null);
            android.webkit.CookieManager.getInstance().flush();

            // Cancella database
            String[] databases = {"webview.db", "webviewCache.db", "webview_databases.db"};
            for (String db : databases) {
                deleteDatabase(db);
            }

            // Cancella directory WebView
            java.io.File dataDir = getApplicationInfo().dataDir;
            deleteDir(new java.io.File(dataDir, "app_webview"));
            deleteDir(new java.io.File(dataDir, "cache/webview"));
            deleteDir(new java.io.File(dataDir, "app_chrome"));
            deleteDir(new java.io.File(dataDir, "app_webview/Service Worker"));

            Log.i(TAG, "✅ WebView data cleared successfully");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error clearing WebView data", e);
        }

        // STEP 2: Riavvia MainActivity con flag per bypassare splash
        Intent intent = new Intent(this, MainActivityFinal.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        intent.putExtra("recovery_mode", true);
        startActivity(intent);
        finish();
    }

    private void showManualRecoveryDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Reset Richiesto")
            .setMessage("L'app necessita di un reset per funzionare correttamente.\n\n" +
                    "Operazioni da eseguire:\n" +
                    "1. Chiudi questa app\n" +
                    "2. Vai in Impostazioni → App → Android System WebView\n" +
                    "3. Cancella Cache e Dati\n" +
                    "4. Riapri l'app")
            .setPositiveButton("OK", (dialog, which) -> finish())
            .setCancelable(false)
            .show();
    }

    private boolean deleteDir(java.io.File dir) {
        if (dir != null && dir.isDirectory()) {
            String[] children = dir.list();
            if (children != null) {
                for (String child : children) {
                    boolean success = deleteDir(new java.io.File(dir, child));
                    if (!success) return false;
                }
            }
            return dir.delete();
        } else if (dir != null && dir.isFile()) {
            return dir.delete();
        }
        return false;
    }

    /**
     * Reset manuale del contatore recovery (per testing)
     */
    public static void resetRecoveryCount(android.content.Context context) {
        context.getSharedPreferences(RECOVERY_PREFS, MODE_PRIVATE)
            .edit()
            .clear()
            .apply();
    }
}
