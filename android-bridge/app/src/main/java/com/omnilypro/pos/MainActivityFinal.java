package com.omnilypro.pos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.app.Presentation;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.hardware.display.DisplayManager;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.IsoDep;
import android.nfc.tech.MifareClassic;
import android.nfc.tech.MifareUltralight;
import android.nfc.tech.Ndef;
import android.nfc.tech.NdefFormatable;
import android.nfc.tech.NfcA;
import android.nfc.tech.NfcB;
import android.nfc.tech.NfcF;
import android.nfc.tech.NfcV;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

/*
import com.zcs.sdk.DriverManager;
import com.zcs.sdk.SdkData;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Sys;
import com.zcs.sdk.card.CardInfoEntity;
import com.zcs.sdk.card.CardReaderManager;
import com.zcs.sdk.card.CardReaderTypeEnum;
import com.zcs.sdk.card.RfCard;
import com.zcs.sdk.listener.OnSearchCardListener;
*/

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;

public class MainActivityFinal extends AppCompatActivity {

    private static final String TAG = "OmnilyPOS";

    /*
    private DriverManager mDriverManager;
    private Sys mSys;
    private ExecutorService mExecutor;
    private CardReaderManager mCardReadManager;
    private RfCard mRfCard;
    */
    private WebView webView;
    private Presentation customerPresentation;

    // Android NFC
    private NfcAdapter nfcAdapter;
    private PendingIntent nfcPendingIntent;
    private IntentFilter[] nfcIntentFilters;
    private String[][] nfcTechLists;
    private OmnilyPOSBridge bridge;

    private static final int REQUEST_PERMISSIONS_CODE = 101;
    private static final String[] PERMISSIONS = {
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CAMERA,
            Manifest.permission.NFC,
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "Activity Created");
        showSplashScreen();
        checkAndRequestPermissions();
    }

    private void startApp() {
        Log.d(TAG, "Permissions check complete. Initializing SDK and UI.");
        // initZcsSDK(); // Commented out
        setupNFC();
        setupWebView();
        setupCustomerDisplay();
        loadInitialUrl();
    }

    private void loadInitialUrl() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String url = "https://omnilypro.vercel.app?posomnily=true&v=" + timestamp + "&cb=" + timestamp + "&_t=" + timestamp;
        Log.d(TAG, "Loading initial URL: " + url);
        webView.loadUrl(url);
    }

    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> missingPermissions = new ArrayList<>();
            for (String permission : PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    missingPermissions.add(permission);
                }
            }
            if (!missingPermissions.isEmpty()) {
                ActivityCompat.requestPermissions(this, missingPermissions.toArray(new String[0]), REQUEST_PERMISSIONS_CODE);
            } else {
                startApp();
            }
        } else {
            startApp();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_PERMISSIONS_CODE) {
            boolean allGranted = true;
            for (int grantResult : grantResults) {
                if (grantResult != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) {
                Log.d(TAG, "All permissions granted by user.");
            } else {
                Log.w(TAG, "Not all permissions were granted. Hardware functions may be limited.");
                Toast.makeText(this, "Attenzione: permessi hardware negati. L'app potrebbe non funzionare correttamente.", Toast.LENGTH_LONG).show();
            }
            startApp();
        }
    }

    /*
    private void initZcsSDK() {
        mExecutor = java.util.concurrent.Executors.newSingleThreadExecutor();
        mExecutor.submit(() -> {
            try {
                mDriverManager = DriverManager.getInstance();
                mSys = mDriverManager.getBaseSysDevice();
                int status = mSys.sdkInit();
                if (status != SdkResult.SDK_OK) {
                    mSys.sysPowerOn();
                    Thread.sleep(1000);
                    status = mSys.sdkInit();
                }
                if (status == SdkResult.SDK_OK) {
                    mCardReadManager = mDriverManager.getCardReadManager();
                    mRfCard = mCardReadManager.getRFCard(); // Initialize RfCard object
                    Log.d(TAG, "ZCS SDK initialized successfully.");
                } else {
                    Log.e(TAG, "ZCS SDK init failed, status: " + status);
                }
            } catch (Exception e) {
                Log.e(TAG, "SDK init error: " + e.getMessage(), e);
            }
        });
    }
    */

    private void setupNFC() {
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);
        if (nfcAdapter == null) {
            Log.e(TAG, "NFC not supported on this device");
            return;
        }

        if (!nfcAdapter.isEnabled()) {
            Log.w(TAG, "NFC is not enabled");
            Toast.makeText(this, "Please enable NFC and try again", Toast.LENGTH_LONG).show();
            return;
        }

        Log.d(TAG, "NFC adapter initialized successfully");

        // Create a PendingIntent for NFC detection
        Intent intent = new Intent(this, getClass()).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        nfcPendingIntent = PendingIntent.getActivity(this, 0, intent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT);

        // Setup intent filters for NFC discovery
        IntentFilter ndef = new IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED);
        IntentFilter tech = new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED);
        IntentFilter tag = new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED);

        nfcIntentFilters = new IntentFilter[] { ndef, tech, tag };

        // Define supported NFC technologies
        nfcTechLists = new String[][] {
            new String[] { NfcA.class.getName() },
            new String[] { NfcB.class.getName() },
            new String[] { NfcF.class.getName() },
            new String[] { NfcV.class.getName() },
            new String[] { IsoDep.class.getName() },
            new String[] { MifareClassic.class.getName() },
            new String[] { MifareUltralight.class.getName() },
            new String[] { Ndef.class.getName() },
            new String[] { NdefFormatable.class.getName() }
        };
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (nfcAdapter != null) {
            nfcAdapter.enableForegroundDispatch(this, nfcPendingIntent, nfcIntentFilters, nfcTechLists);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (nfcAdapter != null) {
            nfcAdapter.disableForegroundDispatch(this);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleNfcIntent(intent);
    }

    private void handleNfcIntent(Intent intent) {
        String action = intent.getAction();
        if (NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action) ||
            NfcAdapter.ACTION_TECH_DISCOVERED.equals(action) ||
            NfcAdapter.ACTION_TAG_DISCOVERED.equals(action)) {

            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            if (tag != null) {
                Log.d(TAG, "NFC Tag detected: " + bridge.bytesToHex(tag.getId()));
                processNfcTag(tag);
            }
        }
    }

    private void processNfcTag(Tag tag) {
        try {
            String tagId = bridge.bytesToHex(tag.getId());
            Log.d(TAG, "Processing NFC tag with ID: " + tagId);

            // Reset reading state
            if (bridge != null) {
                bridge.setNFCReading(false);
            }

            runOnUiThread(() -> {
                String javascript = String.format("if (window.omnilyNFCResultHandler) { window.omnilyNFCResultHandler({success: true, cardNo: '%s', rfUid: '%s'}); }", tagId, tagId);
                webView.evaluateJavascript(javascript, null);
            });

            // Play success beep
            runOnUiThread(() -> {
                try {
                    android.media.ToneGenerator toneGen = new android.media.ToneGenerator(android.media.AudioManager.STREAM_NOTIFICATION, 100);
                    toneGen.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, 150);
                    toneGen.release();
                } catch (Exception e) {
                    Log.e(TAG, "Error playing beep", e);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Error processing NFC tag", e);

            // Reset reading state on error
            if (bridge != null) {
                bridge.setNFCReading(false);
            }

            runOnUiThread(() -> {
                String javascript = String.format("if (window.omnilyNFCResultHandler) { window.omnilyNFCResultHandler({success: false, error: '%s'}); }", e.getMessage());
                webView.evaluateJavascript(javascript, null);
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        webView = new WebView(this);

        // Cancella completamente la cache per forzare reload
        webView.clearCache(true);
        webView.clearHistory();
        webView.clearFormData();
        android.webkit.CookieManager.getInstance().removeAllCookies(null);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webSettings.setAllowFileAccess(false);

        // Force bridge recreation
        webView.removeJavascriptInterface("OmnilyPOS");
        bridge = new OmnilyPOSBridge();
        webView.addJavascriptInterface(bridge, "OmnilyPOS");

        Log.d(TAG, "🔧 Bridge CREATED with BEEP method!");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                Log.d(TAG, "🌐 JS Console: " + consoleMessage.message() + " -- From line "
                         + consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                return super.onConsoleMessage(consoleMessage);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page finished loading: " + url);

                // Inject bridge detection (without beep test)
                String javascript = "javascript:(function() {" +
                    "console.log('🔧 BRIDGE DETECTION: Checking window.OmnilyPOS...');" +
                    "if (window.OmnilyPOS) {" +
                        "console.log('✅ Bridge found:', Object.keys(window.OmnilyPOS));" +
                        "console.log('✅ Bridge available and ready');" +
                    "} else {" +
                        "console.log('❌ Bridge NOT found');" +
                    "}" +
                    "console.log('🌐 Current URL:', window.location.href);" +
                    "console.log('🔍 URL Search:', window.location.search);" +
                "})()";

                view.evaluateJavascript(javascript, null);
                setContentView(webView);
            }
        });
    }

    public class OmnilyPOSBridge {
        private volatile boolean isNFCReading = false;

        public void setNFCReading(boolean reading) {
            this.isNFCReading = reading;
        }

        @JavascriptInterface
        public void readNFCCard(String callbackName) {
            Log.d(TAG, "readNFCCard called with callback: " + callbackName);

            if (nfcAdapter == null) {
                Log.e(TAG, "NFC not supported on this device");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "NFC not supported on this device");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            if (!nfcAdapter.isEnabled()) {
                Log.e(TAG, "NFC is not enabled");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "NFC is not enabled");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            if (isNFCReading) {
                Log.w(TAG, "NFC reading already in progress.");
                return;
            }

            isNFCReading = true;
            Log.d(TAG, "🔍 NFC ready - waiting for tag to be presented...");

            // Store the callback name for when NFC tag is detected
            // The actual NFC reading will be handled by onNewIntent/handleNfcIntent
            showToast("Present NFC card to reader...");

            // Set a timeout to reset the reading state
            runOnUiThread(() -> {
                webView.postDelayed(() -> {
                    if (isNFCReading) {
                        isNFCReading = false;
                        Log.d(TAG, "NFC reading timeout");
                        try {
                            JSONObject result = new JSONObject();
                            result.put("success", false);
                            result.put("error", "NFC reading timeout");
                            runJsCallback(callbackName, result.toString());
                        } catch (Exception e) {
                            Log.e(TAG, "Error creating JSON timeout response", e);
                        }
                    }
                }, 30000); // 30 second timeout
            });
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> {
                Toast.makeText(MainActivityFinal.this, message, Toast.LENGTH_SHORT).show();
                Log.d(TAG, "Toast displayed: " + message);
            });
        }

        @JavascriptInterface
        public void beep() {
            Log.d(TAG, "🔍 BEEP() CHIAMATO! Stack trace:");
            Thread.dumpStack(); // Mostra da dove viene chiamato
            beep("1", "200"); // Default: 1 beep di 200ms
        }

        @JavascriptInterface
        public void beep(String count, String duration) {
            int tempBeepCount = 1;
            int tempBeepDuration = 200;

            try {
                tempBeepCount = Integer.parseInt(count);
                tempBeepDuration = Integer.parseInt(duration);
            } catch (NumberFormatException e) {
                Log.w(TAG, "Invalid beep parameters, using defaults");
            }

            final int beepCount = tempBeepCount;
            final int beepDuration = tempBeepDuration;

            Log.d(TAG, "🔊 BEEP(" + count + "," + duration + ") CHIAMATO!");
            Thread.dumpStack(); // Debug stack trace

            runOnUiThread(() -> {
                android.media.ToneGenerator toneGen = null;
                try {
                    toneGen = new android.media.ToneGenerator(android.media.AudioManager.STREAM_NOTIFICATION, 100);
                    for (int i = 0; i < beepCount; i++) {
                        toneGen.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, beepDuration);

                        // Pausa tra beep se più di uno
                        if (i < beepCount - 1) {
                            try {
                                Thread.sleep(beepDuration + 50); // Aspetta che finisca + pausa
                            } catch (InterruptedException ignored) {}
                        }
                    }
                    Log.d(TAG, "🎵 Played " + beepCount + " beep(s) successfully");
                } catch (Exception e) {
                    Log.e(TAG, "❌ Error playing beep sound", e);
                } finally {
                    if (toneGen != null) {
                        try {
                            toneGen.release();
                        } catch (Exception e) {
                            Log.w(TAG, "Error releasing ToneGenerator", e);
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public void registerNFCResultCallback(String callbackName) {
            Log.d(TAG, "registerNFCResultCallback called with: " + callbackName);
            // Store the callback name for future NFC operations
            // This method is for callback registration, actual callback happens in readNFCCardAsync
        }

        @JavascriptInterface
        public void readNFCCardAsync() {
            Log.d(TAG, "readNFCCardAsync called - using persistent callback");
            readNFCCard("omnilyNFCResultHandler");
        }

        @JavascriptInterface
        public void readNFCCardSync() {
            Log.d(TAG, "readNFCCardSync called - alias for readNFCCardAsync");
            readNFCCardAsync();
        }

        @JavascriptInterface
        public String getAvailableMethods() {
            String methods = "readNFCCard,readNFCCardAsync,readNFCCardSync,showToast,beep,registerNFCResultCallback,getBridgeVersion,getAvailableMethods";
            Log.d(TAG, "getAvailableMethods called - returning: " + methods);
            return methods;
        }

        @JavascriptInterface
        public String getBridgeVersion() {
            String version = "4.0.1-fixed-nfc";
            Log.d(TAG, "getBridgeVersion called - returning: " + version);
            return version;
        }

        private void runJsCallback(final String callbackName, final String result) {
            if (callbackName != null && !callbackName.isEmpty()) {
                runOnUiThread(() -> webView.evaluateJavascript(String.format("window.%s(%s)", callbackName, result), null));
            }
        }

        public String bytesToHex(byte[] bytes) {
            if (bytes == null) return "";
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02X", b));
            }
            return sb.toString();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (customerPresentation != null) {
            customerPresentation.dismiss();
        }
        /*
        if (mExecutor != null) {
            mExecutor.shutdownNow();
        }
        if (mSys != null) {
            mSys.sysPowerOff();
        }
        */
        Log.d(TAG, "Activity destroyed and SDK powered off");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private void setupCustomerDisplay() {
        try {
            DisplayManager displayManager = (DisplayManager) getSystemService(Context.DISPLAY_SERVICE);
            if (displayManager != null) {
                Display[] displays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION);
                if (displays.length > 0) {
                    customerPresentation = new CustomerPresentation(this, displays[0]);
                    customerPresentation.show();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting up customer display", e);
        }
    }

    private class CustomerPresentation extends Presentation {
        public CustomerPresentation(Context outerContext, Display display) {
            super(outerContext, display);
        }

        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            WebView customerWebView = new WebView(getContext());
            customerWebView.loadUrl("https://omnilypro.vercel.app?posomnily=true&customer=true");
            setContentView(customerWebView);
        }
    }

    private void showSplashScreen() {
        Log.d(TAG, "Splash screen rossa con OMNILY PRO e barra di caricamento");

        android.widget.LinearLayout splashLayout = new android.widget.LinearLayout(this);
        splashLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
        splashLayout.setGravity(android.view.Gravity.CENTER);
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#D32F2F")); // Sfondo rosso

        // Testo centrale
        android.widget.TextView titleText = new android.widget.TextView(this);
        titleText.setText("OMNILY PRO");
        titleText.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 36);
        titleText.setTextColor(android.graphics.Color.WHITE); // Testo bianco su sfondo rosso
        titleText.setGravity(android.view.Gravity.CENTER);
        titleText.setTypeface(null, android.graphics.Typeface.BOLD);

        android.widget.LinearLayout.LayoutParams textParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleText.setLayoutParams(textParams);

        // Barra di caricamento piccola
        android.widget.ProgressBar progressBar = new android.widget.ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(true);
        android.widget.LinearLayout.LayoutParams progressParams = new android.widget.LinearLayout.LayoutParams(
            200, // Larghezza ridotta
            8    // Altezza piccola
        );
        progressParams.setMargins(0, 30, 0, 0);
        progressBar.setLayoutParams(progressParams);

        splashLayout.addView(titleText);
        splashLayout.addView(progressBar);
        setContentView(splashLayout);
    }
    private void autoClickLogin(WebView webView) {}
}
