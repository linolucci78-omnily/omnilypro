package com.omnilypro.pos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.app.Presentation;
import android.app.admin.DevicePolicyManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
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
import android.text.Layout;
import android.text.Layout.Alignment;
import android.util.Log;
import android.view.Display;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.RenderProcessGoneDetail;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.zcs.sdk.DriverManager;
import com.zcs.sdk.SdkData;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Sys;
import com.zcs.sdk.HQrsanner;
import com.zcs.sdk.card.CardInfoEntity;
import com.zcs.sdk.card.CardReaderManager;
import com.zcs.sdk.card.CardReaderTypeEnum;
import com.zcs.sdk.card.RfCard;
import com.zcs.sdk.listener.OnSearchCardListener;
import com.zcs.sdk.pin.pinpad.PinPadManager;
import com.zcs.sdk.pin.PinAlgorithmMode;
import com.zcs.sdk.Printer;
import com.zcs.sdk.print.PrnStrFormat;
import com.zcs.sdk.print.PrnTextStyle;
import com.zcs.sdk.print.PrnAlignTypeEnum;
import com.zcs.sdk.print.PrnFontSizeTypeEnum;

import org.json.JSONObject;
import org.json.JSONException;

import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import com.google.zxing.BarcodeFormat;

import com.omnilypro.pos.mdm.MdmManager;
import com.omnilypro.pos.mdm.MyDeviceAdminReceiver;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;

public class MainActivityFinal extends AppCompatActivity {

    private static final String TAG = "OmnilyPOS";
    private static final int QR_SCAN_REQUEST_CODE = 100;

    private DriverManager mDriverManager;
    private Sys mSys;
    private ExecutorService mExecutor;
    private CardReaderManager mCardReadManager;
    private PinPadManager mPinPadManager;
    private RfCard mRfCard;
    private HQrsanner mHQrsanner;
    private Printer mPrinter;
    private WebView webView;
    private Presentation customerPresentation;

    // Android NFC
    private NfcAdapter nfcAdapter;
    private PendingIntent nfcPendingIntent;
    private IntentFilter[] nfcIntentFilters;
    private String[][] nfcTechLists;
    private OmnilyPOSBridge bridge;

    // Bridge re-injection handler for SPA navigation
    private android.os.Handler bridgeHandler;
    private Runnable bridgeInjector;

    // QR Code scanning
    private String currentQRCallback;

    // MDM - Device Admin
    private DevicePolicyManager mDevicePolicyManager;
    private ComponentName mAdminComponent;
    private BroadcastReceiver mdmCommandReceiver;

    private static final int REQUEST_PERMISSIONS_CODE = 101;
    private static final int FILE_CHOOSER_REQUEST_CODE = 102;
    private android.webkit.ValueCallback<android.net.Uri[]> filePathCallback;

    private static final String[] PERMISSIONS = {
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.CAMERA,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CAMERA,
            Manifest.permission.NFC,
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
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
        initZcsSDK();
        setupNFC();
        setupWebView();
        setupCustomerDisplay();

        // Inizializza Device Admin per MDM
        setupDeviceAdmin();

        // Inizializza sistema MDM
        Log.i(TAG, "Initializing MDM system...");
        MdmManager.getInstance(this).initialize();
        Log.i(TAG, "MDM system initialized successfully");

        // Registra BroadcastReceiver per comandi MDM
        registerMdmCommandReceiver();

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
                    mHQrsanner = mDriverManager.getHQrsannerDriver(); // Initialize QR scanner
                    mPinPadManager = mDriverManager.getPadManager(); // Initialize PinPad
                    mPrinter = mDriverManager.getPrinter(); // Initialize Printer
                    Log.d(TAG, "ZCS SDK initialized successfully with Printer support.");
                } else {
                    Log.e(TAG, "ZCS SDK init failed, status: " + status);
                }
            } catch (Exception e) {
                Log.e(TAG, "SDK init error: " + e.getMessage(), e);
            }
        });
    }

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

        // NFC will be enabled only on demand
        Log.d(TAG, "NFC configured - will be enabled on demand only");
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "onResume() - NFC not auto-enabled");
        // NFC not auto-enabled - only when requested by JavaScript
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Disattiva il NFC solo se non c'è una lettura attiva in corso
        // Questo previene la disattivazione prematura durante una lettura in corso
        if (bridge != null && bridge.isNFCEnabled && !bridge.isNFCReading) {
            bridge.disableNFCReading();
        }
    }

    // Metodo pubblico per disattivare NFC dall'esterno
    public void disableNFCReading() {
        if (bridge != null) {
            bridge.disableNFCReading();
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

            // CONTROLLO CRITICO: Se il NFC non dovrebbe essere attivo, ignora completamente
            if (bridge == null || !bridge.isNFCEnabled) {
                Log.w(TAG, "🚫 NFC tag ignored - NFC not enabled by app (tag: " + tagId + ")");
                return;
            }

            Log.d(TAG, "Processing NFC tag with ID: " + tagId);

            // Usa il callback salvato o fallback su omnilyNFCResultHandler
            final String callbackToUse = bridge.currentNFCCallback != null ? bridge.currentNFCCallback : "omnilyNFCResultHandler";

            try {
                JSONObject result = new JSONObject();
                result.put("success", true);
                result.put("cardNo", tagId);
                result.put("rfUid", tagId);

                // Prima invia il risultato al JavaScript
                bridge.runJsCallback(callbackToUse, result.toString());

                // Poi disabilita NFC con un piccolo delay per permettere al callback di completarsi
                // Questo evita che onResume venga chiamato prima che il callback sia processato
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    if (bridge != null) {
                        bridge.setNFCReading(false);
                        bridge.disableNFCReading();
                        Log.d(TAG, "NFC disabled after successful callback delivery");
                    }
                }, 100); // 100ms delay per permettere al JavaScript di processare il risultato

            } catch (Exception e) {
                Log.e(TAG, "Error creating JSON success response", e);
            }

            // Reset callback
            bridge.currentNFCCallback = null;

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

            Log.d(TAG, "NFC card read successfully, NFC disabled");

        } catch (Exception e) {
            Log.e(TAG, "Error processing NFC tag", e);

            // Usa il callback salvato o fallback su omnilyNFCResultHandler
            final String callbackToUse = bridge.currentNFCCallback != null ? bridge.currentNFCCallback : "omnilyNFCResultHandler";

            try {
                JSONObject result = new JSONObject();
                result.put("success", false);
                result.put("error", e.getMessage());
                bridge.runJsCallback(callbackToUse, result.toString());

                // Disabilita NFC anche in caso di errore, ma con delay
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    if (bridge != null) {
                        bridge.setNFCReading(false);
                        bridge.disableNFCReading();
                        Log.d(TAG, "NFC disabled after error callback delivery");
                    }
                }, 100);
            } catch (Exception jsonError) {
                Log.e(TAG, "Error creating JSON error response", jsonError);
                // In caso di errore critico, disabilita comunque il NFC
                if (bridge != null) {
                    bridge.setNFCReading(false);
                    bridge.disableNFCReading();
                }
            }

            // Reset callback
            bridge.currentNFCCallback = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Handle file chooser result
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback == null) {
                Log.w(TAG, "⚠️ File chooser callback is null");
                return;
            }

            android.net.Uri[] results = null;

            if (resultCode == RESULT_OK) {
                if (data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new android.net.Uri[]{android.net.Uri.parse(dataString)};
                        Log.d(TAG, "✅ File selezionato: " + dataString);
                    }
                }
            } else {
                Log.d(TAG, "📸 Selezione file annullata");
            }

            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
            return;
        }

        // Handle ZXing QR scan result
        IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (result != null) {
            handleQRScanResult(result);
        }
    }

    private void handleQRScanResult(IntentResult result) {
        Log.d(TAG, "QR scan result received");

        String callbackToUse = currentQRCallback != null ? currentQRCallback : "omnilyQRResultHandler";

        try {
            JSONObject jsonResult = new JSONObject();

            if (result.getContents() == null) {
                // User cancelled the scan
                Log.d(TAG, "QR scan cancelled by user");
                jsonResult.put("success", false);
                jsonResult.put("cancelled", true);
                jsonResult.put("error", "Scansione annullata dall'utente");
            } else {
                // Successful scan
                String qrContent = result.getContents();
                String qrFormat = result.getFormatName();
                Log.d(TAG, "QR scan successful: " + qrContent + " (format: " + qrFormat + ")");

                jsonResult.put("success", true);
                jsonResult.put("content", qrContent);
                jsonResult.put("format", qrFormat);
                jsonResult.put("qrCode", qrContent); // Alias for compatibility

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
            }

            // Send result to JavaScript
            if (bridge != null) {
                bridge.runJsCallback(callbackToUse, jsonResult.toString());
            }

        } catch (Exception e) {
            Log.e(TAG, "Error processing QR scan result", e);
            try {
                JSONObject errorResult = new JSONObject();
                errorResult.put("success", false);
                errorResult.put("error", "Errore processamento risultato: " + e.getMessage());
                if (bridge != null) {
                    bridge.runJsCallback(callbackToUse, errorResult.toString());
                }
            } catch (Exception jsonE) {
                Log.e(TAG, "Error creating error response", jsonE);
            }
        } finally {
            // Reset the callback
            currentQRCallback = null;
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

        // Rimosso supporto window.open per evitare apertura browser esterni

        // Force bridge recreation
        webView.removeJavascriptInterface("OmnilyPOS");
        bridge = new OmnilyPOSBridge();
        webView.addJavascriptInterface(bridge, "OmnilyPOS");

        Log.i(TAG, "🔧 Bridge CREATED with BEEP method!");

        // Setup periodic bridge re-injection for SPA navigation
        bridgeHandler = new android.os.Handler(android.os.Looper.getMainLooper());
        bridgeInjector = new Runnable() {
            @Override
            public void run() {
                // Re-inject bridge to ensure it's always available
                try {
                    webView.removeJavascriptInterface("OmnilyPOS");
                    webView.addJavascriptInterface(bridge, "OmnilyPOS");

                    // Force verification in JavaScript context
                    webView.evaluateJavascript(
                        "(function() {" +
                        "  console.log('🔧 Bridge verification from Android:', typeof window.OmnilyPOS);" +
                        "  if (typeof window.OmnilyPOS === 'undefined') {" +
                        "    console.error('❌ Bridge NOT visible in JS context!');" +
                        "  } else {" +
                        "    console.log('✅ Bridge IS visible in JS context!');" +
                        "  }" +
                        "})()",
                        null
                    );

                    Log.i(TAG, "🔄 Bridge re-injected (periodic)");
                } catch (Exception e) {
                    Log.e(TAG, "❌ Error re-injecting bridge: " + e.getMessage());
                }
                // Re-schedule every 3 seconds
                bridgeHandler.postDelayed(this, 3000);
            }
        };
        // Start periodic injection
        bridgeHandler.postDelayed(bridgeInjector, 3000);
        Log.i(TAG, "✅ Periodic bridge re-injection started (every 3s)");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                Log.d(TAG, "🌐 JS Console: " + consoleMessage.message() + " -- From line "
                         + consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                return super.onConsoleMessage(consoleMessage);
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                Log.w(TAG, "🚫 BLOCCATO window.open() - popup non consentito");
                return false; // Blocca TUTTI i tentativi di aprire nuove finestre
            }

            @Override
            public boolean onShowFileChooser(WebView webView, android.webkit.ValueCallback<android.net.Uri[]> filePathCallback,
                                            WebChromeClient.FileChooserParams fileChooserParams) {
                Log.d(TAG, "📸 File chooser richiesto");

                // Chiudi il file chooser precedente se esiste
                if (MainActivityFinal.this.filePathCallback != null) {
                    MainActivityFinal.this.filePathCallback.onReceiveValue(null);
                }

                MainActivityFinal.this.filePathCallback = filePathCallback;

                // Crea intent per selezionare immagini
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");

                // Aggiungi opzione per fotocamera
                Intent takePictureIntent = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);

                // Crea chooser con entrambe le opzioni
                Intent chooserIntent = Intent.createChooser(intent, "Seleziona immagine");
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[] { takePictureIntent });

                try {
                    startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                    Log.d(TAG, "✅ File chooser aperto");
                } catch (Exception e) {
                    MainActivityFinal.this.filePathCallback = null;
                    Log.e(TAG, "❌ Errore apertura file chooser: " + e.getMessage());
                    return false;
                }

                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page finished loading: " + url);

                // Re-inject bridge ogni volta per SPA navigation
                // ⚠️ NON creare un nuovo bridge! Usa quello esistente per preservare lo stato NFC
                Log.d(TAG, "🔧 Re-injecting EXISTING bridge for SPA compatibility...");
                view.removeJavascriptInterface("OmnilyPOS");
                view.addJavascriptInterface(bridge, "OmnilyPOS");
                Log.d(TAG, "✅ Bridge re-injected (preserved state)!");

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

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // Callback nativo Android per rilevare crash del processo renderer WebView
                Log.e(TAG, "🚨 ========== RENDER PROCESS GONE ==========");
                Log.e(TAG, "🚨 WebView renderer process crashed!");
                Log.e(TAG, "🚨 Crash: " + detail.didCrash());
                Log.e(TAG, "🚨 Priority at exit: " + detail.rendererPriorityAtExit());
                Log.e(TAG, "🚨 Triggering automatic recovery...");

                // Distruggi il WebView corrotto
                if (view != null) {
                    view.destroy();
                }

                // Triggera recovery automatico tramite WebViewRecoveryActivity
                Intent recoveryIntent = new Intent(MainActivityFinal.this, WebViewRecoveryActivity.class);
                recoveryIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(recoveryIntent);
                finish();

                return true; // Indica che abbiamo gestito il crash
            }
        });
    }

    public class      OmnilyPOSBridge {
        private volatile boolean isNFCReading = false;
        public volatile boolean isNFCEnabled = false;
        private volatile String currentNFCCallback = null;

        public void setNFCReading(boolean reading) {
            this.isNFCReading = reading;
        }

        private void enableNFCReading() {
            if (nfcAdapter != null && !isNFCEnabled) {
                runOnUiThread(() -> {
                    nfcAdapter.enableForegroundDispatch(MainActivityFinal.this, nfcPendingIntent, nfcIntentFilters, nfcTechLists);
                    isNFCEnabled = true;
                    Log.d(TAG, "NFC enabled for reading");
                });
            }
        }

        public void disableNFCReading() {
            if (nfcAdapter != null && isNFCEnabled) {
                runOnUiThread(() -> {
                    nfcAdapter.disableForegroundDispatch(MainActivityFinal.this);
                    isNFCEnabled = false;
                    isNFCReading = false;
                    Log.d(TAG, "NFC disabled");
                });
            }
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
                // Se già in lettura, fermalo (toggle)
                Log.d(TAG, "NFC reading in progress - stopping");
                isNFCReading = false;
                disableNFCReading();

                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "NFC reading cancelled by user");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON cancel response", e);
                }
                return;
            }

            // Salva il callback per quando il tag viene rilevato
            currentNFCCallback = callbackName;

            // Enable NFC only when needed
            enableNFCReading();

            isNFCReading = true;
            Log.d(TAG, "NFC enabled and ready for card reading");

            showToast("Present NFC card to reader... Press again to cancel");

            // Set a timeout to reset the reading state
            runOnUiThread(() -> {
                webView.postDelayed(() -> {
                    if (isNFCReading) {
                        isNFCReading = false;
                        disableNFCReading();
                        currentNFCCallback = null;
                        Log.d(TAG, "NFC reading timeout - NFC disabled");
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
        public void stopNFCReading() {
            Log.d(TAG, "stopNFCReading called - disattivando NFC");
            disableNFCReading();
        }

        @JavascriptInterface
        public void unregisterNFCResultCallback(String callbackName) {
            Log.d(TAG, "unregisterNFCResultCallback called with: " + callbackName + " - disattivando NFC");
            disableNFCReading();
        }

        @JavascriptInterface
        public void readQRCode(String callbackName) {
            Log.d(TAG, "readQRCode called with callback: " + callbackName);

            // Store the callback for QR result
            currentQRCallback = callbackName;

            runOnUiThread(() -> {
                try {
                    // Initialize ZXing QR scanner
                    IntentIntegrator integrator = new IntentIntegrator(MainActivityFinal.this);
                    integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE);
                    integrator.setPrompt("Inquadra il codice QR\n\nPremi INDIETRO per annullare");
                    integrator.setCameraId(0);  // Use back camera
                    integrator.setBeepEnabled(true);
                    integrator.setBarcodeImageEnabled(false);
                    integrator.setOrientationLocked(true);
                    integrator.setTimeout(30000); // Timeout di 30 secondi
                    integrator.setCaptureActivity(com.journeyapps.barcodescanner.CaptureActivity.class);

                    Log.d(TAG, "Starting ZXing QR scanner activity...");
                    integrator.initiateScan();

                } catch (Exception e) {
                    Log.e(TAG, "Error starting QR scanner", e);
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Errore avvio scanner: " + e.getMessage());
                        runJsCallback(callbackName, result.toString());
                    } catch (Exception jsonE) {
                        Log.e(TAG, "Error creating error response", jsonE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void readQRCodeAsync() {
            Log.d(TAG, "readQRCodeAsync called - using default callback");
            readQRCode("omnilyQRResultHandler");
        }

        @JavascriptInterface
        public void cancelQRScanner() {
            Log.d(TAG, "cancelQRScanner called - cancelling current QR scan");

            runOnUiThread(() -> {
                try {
                    // Se c'è una callback in attesa, invia risultato di cancellazione
                    if (currentQRCallback != null) {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("cancelled", true);
                        result.put("message", "Scansione annullata dall'utente");
                        runJsCallback(currentQRCallback, result.toString());
                        currentQRCallback = null;
                    }

                    // Chiudi l'activity dello scanner se è aperta
                    finishActivity(IntentIntegrator.REQUEST_CODE);

                } catch (Exception e) {
                    Log.e(TAG, "Error cancelling QR scanner", e);
                }
            });
        }

        @JavascriptInterface
        public void updateCustomerDisplay(String messageData) {
            Log.d(TAG, "updateCustomerDisplay chiamato con dati: " + messageData);

            runOnUiThread(() -> {
                try {
                    // Se abbiamo un customer display attivo, invia i dati
                    if (customerPresentation != null && customerPresentation instanceof CustomerPresentation) {
                        Log.d(TAG, "📤 Invio dati al customer display: " + messageData);
                        ((CustomerPresentation) customerPresentation).sendDataToDisplay(messageData);
                    } else {
                        Log.w(TAG, "⚠️ Customer display non attivo");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Errore invio dati customer display", e);
                }
            });
        }

        @JavascriptInterface
        public String getAvailableMethods() {
            String methods = "readNFCCard,readNFCCardAsync,readNFCCardSync,readQRCode,readQRCodeAsync,cancelQRScanner,showToast,beep,registerNFCResultCallback,unregisterNFCResultCallback,stopNFCReading,updateCustomerDisplay,inputAmount,inputAmountAsync,printReceipt,printText,printQRCode,printBarcode,cutPaper,initPrinter,testPrinter,getNetworkInfo,getBridgeVersion,getAppVersion,getAvailableMethods";
            Log.d(TAG, "getAvailableMethods called - returning: " + methods);
            return methods;
        }

        @JavascriptInterface
        public String getBridgeVersion() {
            String version = "4.3.0-pinpad-input-" + System.currentTimeMillis();
            Log.d(TAG, "getBridgeVersion called - returning: " + version);
            return version;
        }

        @JavascriptInterface
        public String getAppVersion() {
            Log.d(TAG, "getAppVersion called");
            try {
                android.content.pm.PackageInfo pInfo = getPackageManager()
                    .getPackageInfo(getPackageName(), 0);
                String version = pInfo.versionName;
                Log.d(TAG, "getAppVersion returning: " + version);
                return version;
            } catch (Exception e) {
                Log.e(TAG, "Error getting app version: " + e.getMessage());
                return "N/A";
            }
        }

        @JavascriptInterface
        public void inputAmount(String callbackName) {
            Log.d(TAG, "inputAmount called with callback: " + callbackName);

            if (mPinPadManager == null) {
                Log.e(TAG, "PinPad not initialized");
                runOnUiThread(() -> {
                    String script = callbackName + "('ERROR: PinPad not available');";
                    webView.evaluateJavascript(script, null);
                });
                return;
            }

            runOnUiThread(() -> {
                try {
                    Log.d(TAG, "Attempting PinPad input for amount...");

                    // Try different approach - use inputOnlinePin with minimal parameters
                    mPinPadManager.inputOnlinePin(MainActivityFinal.this,
                        (byte) 1,    // min 1 digit
                        (byte) 8,    // max 8 digits (99999.99)
                        30,          // 30 second timeout (reduced)
                        true,        // sound enabled
                        "",          // empty account number
                        (byte) 0,    // key index 0
                        PinAlgorithmMode.ANSI_X_9_8, // standard algorithm
                        new PinPadManager.OnPinPadInputListener() {
                            @Override
                            public void onSuccess(byte[] data) {
                                runOnUiThread(() -> {
                                    if (data != null) {
                                        // Convert bytes to amount string
                                        String amountStr = new String(data).trim();
                                        // Format as decimal (add decimal point if needed)
                                        if (amountStr.length() > 2) {
                                            String euros = amountStr.substring(0, amountStr.length() - 2);
                                            String cents = amountStr.substring(amountStr.length() - 2);
                                            amountStr = euros + "." + cents;
                                        } else if (amountStr.length() == 2) {
                                            amountStr = "0." + amountStr;
                                        } else if (amountStr.length() == 1) {
                                            amountStr = "0.0" + amountStr;
                                        }

                                        Log.d(TAG, "Amount input success: " + amountStr);
                                        String script = callbackName + "('" + amountStr + "');";
                                        webView.evaluateJavascript(script, null);
                                    } else {
                                        Log.e(TAG, "Amount input failed - no data");
                                        String script = callbackName + "('ERROR: No data received');";
                                        webView.evaluateJavascript(script, null);
                                    }
                                });
                            }

                            @Override
                            public void onError(int errorCode) {
                                Log.e(TAG, "PinPad error code: " + errorCode);
                                runOnUiThread(() -> {
                                    String script = callbackName + "('ERROR: Code " + errorCode + "');";
                                    webView.evaluateJavascript(script, null);
                                });
                            }
                        });
                } catch (Exception e) {
                    Log.e(TAG, "Error starting amount input: " + e.getMessage());
                    String script = callbackName + "('ERROR: " + e.getMessage() + "');";
                    webView.evaluateJavascript(script, null);
                }
            });
        }

        @JavascriptInterface
        public void inputAmountAsync() {
            Log.d(TAG, "inputAmountAsync called - using default callback");
            inputAmount("omnilyAmountInputHandler");
        }

        // ============================================================================
        // METODI DI STAMPA - ZCS PRINTER SDK
        // ============================================================================

        @JavascriptInterface
        public void initPrinter(String callbackName) {
            Log.d(TAG, "initPrinter called with callback: " + callbackName);

            if (mPrinter == null) {
                Log.e(TAG, "Printer not initialized");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "Printer not available");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            mExecutor.submit(() -> {
                try {
                    // Check printer status instead of trying to init
                    int status = mPrinter.getPrinterStatus();
                    JSONObject result = new JSONObject();

                    if (status == SdkResult.SDK_OK) {
                        result.put("success", true);
                        result.put("message", "Printer ready");
                        Log.d(TAG, "Printer ready for use");
                    } else {
                        result.put("success", false);
                        result.put("error", "Printer status error: " + status);
                        Log.e(TAG, "Printer status error: " + status);
                    }

                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error checking printer", e);
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Printer error: " + e.getMessage());
                        runJsCallback(callbackName, result.toString());
                    } catch (Exception jsonE) {
                        Log.e(TAG, "Error creating error response", jsonE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void printText(String text, String callbackName) {
            Log.d(TAG, "printText called with text: " + text + ", callback: " + callbackName);

            if (mPrinter == null) {
                Log.e(TAG, "Printer not initialized");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "Printer not available");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            mExecutor.submit(() -> {
                try {
                    // Add extra lines for manual paper tearing (using spaces instead of empty lines)
                    String textWithFeed = text + "\n \n \n \n \n \n ";

                    // Create format object for normal text
                    PrnStrFormat format = new PrnStrFormat();
                    format.setTextSize(24);
                    format.setAli(Layout.Alignment.ALIGN_NORMAL);

                    // Print text using proper format
                    mPrinter.setPrintAppendString(textWithFeed, format);

                    // Start printing
                    int printStatus = mPrinter.setPrintStart();
                    JSONObject result = new JSONObject();
                    if (printStatus == SdkResult.SDK_OK) {
                        result.put("success", true);
                        result.put("message", "Text printed successfully");
                        Log.d(TAG, "Text printed successfully with paper feed");
                    } else {
                        result.put("success", false);
                        result.put("error", "Print start failed with status: " + printStatus);
                        Log.e(TAG, "Print start failed with status: " + printStatus);
                    }

                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error printing text", e);
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Print error: " + e.getMessage());
                        runJsCallback(callbackName, result.toString());
                    } catch (Exception jsonE) {
                        Log.e(TAG, "Error creating error response", jsonE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void printQRCode(String data, String callbackName) {
            Log.d(TAG, "printQRCode called with data: " + data + ", callback: " + callbackName);

            if (mPrinter == null) {
                Log.e(TAG, "Printer not initialized");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "Printer not available");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            mExecutor.submit(() -> {
                try {
                    // Print QR code with correct ZCS API signature from Gemini
                    mPrinter.setPrintAppendQRCode(data, 200, 200, Alignment.ALIGN_CENTER);

                    // Add extra lines for manual paper tearing (using spaces instead of empty lines)
                    PrnStrFormat format = new PrnStrFormat();
                    format.setTextSize(24);
                    format.setAli(Layout.Alignment.ALIGN_NORMAL);
                    mPrinter.setPrintAppendString("\n \n \n \n \n \n ", format);

                    int status = SdkResult.SDK_OK;

                    JSONObject result = new JSONObject();
                    if (status == SdkResult.SDK_OK) {
                        // Start printing
                        int printStatus = mPrinter.setPrintStart();
                        if (printStatus == SdkResult.SDK_OK) {
                            result.put("success", true);
                            result.put("message", "QR code printed successfully");
                            Log.d(TAG, "QR code printed successfully with paper feed");
                        } else {
                            result.put("success", false);
                            result.put("error", "Print start failed with status: " + printStatus);
                            Log.e(TAG, "Print start failed with status: " + printStatus);
                        }
                    } else {
                        result.put("success", false);
                        result.put("error", "Print QR code failed with status: " + status);
                        Log.e(TAG, "Print QR code failed with status: " + status);
                    }

                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error printing QR code", e);
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Print error: " + e.getMessage());
                        runJsCallback(callbackName, result.toString());
                    } catch (Exception jsonE) {
                        Log.e(TAG, "Error creating error response", jsonE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void printBarcode(String data, String callbackName) {
            Log.d(TAG, "printBarcode called with data: " + data + ", callback: " + callbackName);

            if (mPrinter == null) {
                Log.e(TAG, "Printer not initialized");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "Printer not available");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            mExecutor.submit(() -> {
                try {
                    // Print barcode with correct ZCS API signature from Gemini
                    mPrinter.setPrintAppendBarCode(MainActivityFinal.this, data, 200, 100, true, Alignment.ALIGN_CENTER, BarcodeFormat.CODE_128);
                    int status = SdkResult.SDK_OK;

                    JSONObject result = new JSONObject();
                    if (status == SdkResult.SDK_OK) {
                        // Start printing
                        int printStatus = mPrinter.setPrintStart();
                        if (printStatus == SdkResult.SDK_OK) {
                            result.put("success", true);
                            result.put("message", "Barcode printed successfully");
                            Log.d(TAG, "Barcode printed successfully");
                        } else {
                            result.put("success", false);
                            result.put("error", "Print start failed with status: " + printStatus);
                            Log.e(TAG, "Print start failed with status: " + printStatus);
                        }
                    } else {
                        result.put("success", false);
                        result.put("error", "Print barcode failed with status: " + status);
                        Log.e(TAG, "Print barcode failed with status: " + status);
                    }

                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error printing barcode", e);
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Print error: " + e.getMessage());
                        runJsCallback(callbackName, result.toString());
                    } catch (Exception jsonE) {
                        Log.e(TAG, "Error creating error response", jsonE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void cutPaper(String callbackName) {
            Log.d(TAG, "cutPaper called with callback: " + callbackName);

            if (mPrinter == null) {
                Log.e(TAG, "Printer not initialized");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "Printer not available");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            mExecutor.submit(() -> {
                try {
                    // Cut paper using correct method
                    int status = mPrinter.openPrnCutter((byte) 1);

                    JSONObject result = new JSONObject();
                    if (status == SdkResult.SDK_OK) {
                        result.put("success", true);
                        result.put("message", "Paper cut successfully");
                        Log.d(TAG, "Paper cut successfully");
                    } else {
                        result.put("success", false);
                        result.put("error", "Cut paper failed with status: " + status);
                        Log.e(TAG, "Cut paper failed with status: " + status);
                    }

                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error cutting paper", e);
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Cut error: " + e.getMessage());
                        runJsCallback(callbackName, result.toString());
                    } catch (Exception jsonE) {
                        Log.e(TAG, "Error creating error response", jsonE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void printReceipt(String receiptData, String callbackName) {
            Log.d(TAG, "printReceipt called with callback: " + callbackName);

            if (mPrinter == null) {
                Log.e(TAG, "Printer not initialized");
                try {
                    JSONObject result = new JSONObject();
                    result.put("success", false);
                    result.put("error", "Printer not available");
                    runJsCallback(callbackName, result.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error creating JSON error response", e);
                }
                return;
            }

            mExecutor.submit(() -> {
                try {
                    JSONObject receipt = new JSONObject(receiptData);

                    // No need to initialize printer for receipt printing

                    // Store name (large font, center)
                    String storeName = receipt.optString("storeName", "");
                    if (!storeName.isEmpty()) {
                        PrnStrFormat headerFormat = new PrnStrFormat();
                        headerFormat.setTextSize(30);
                        headerFormat.setAli(Layout.Alignment.ALIGN_CENTER);
                        headerFormat.setStyle(PrnTextStyle.BOLD);
                        mPrinter.setPrintAppendString(storeName, headerFormat);

                        PrnStrFormat normalFormat = new PrnStrFormat();
                        normalFormat.setTextSize(24);
                        normalFormat.setAli(Layout.Alignment.ALIGN_NORMAL);
                        mPrinter.setPrintAppendString("\n", normalFormat);
                    }

                    // Store info
                    String storeAddress = receipt.optString("storeAddress", "");
                    String storePhone = receipt.optString("storePhone", "");
                    String storeTax = receipt.optString("storeTax", "");

                    PrnStrFormat normalFormat = new PrnStrFormat();
                    normalFormat.setTextSize(24);
                    normalFormat.setAli(Layout.Alignment.ALIGN_NORMAL);

                    if (!storeAddress.isEmpty()) {
                        mPrinter.setPrintAppendString(storeAddress + "\n", normalFormat);
                    }
                    if (!storePhone.isEmpty()) {
                        mPrinter.setPrintAppendString(storePhone + "\n", normalFormat);
                    }
                    if (!storeTax.isEmpty()) {
                        mPrinter.setPrintAppendString("P.IVA: " + storeTax + "\n", normalFormat);
                    }

                    // Separator
                    mPrinter.setPrintAppendString("----------------------------------------\n", normalFormat);

                    // Receipt info
                    String receiptNumber = receipt.optString("receiptNumber", "");
                    String timestamp = receipt.optString("timestamp", "");
                    String cashier = receipt.optString("cashier", "");

                    if (!receiptNumber.isEmpty()) {
                        mPrinter.setPrintAppendString("Scontrino: " + receiptNumber + "\n", normalFormat);
                    }
                    if (!timestamp.isEmpty()) {
                        mPrinter.setPrintAppendString("Data: " + timestamp + "\n", normalFormat);
                    }
                    if (!cashier.isEmpty()) {
                        mPrinter.setPrintAppendString("Cassiere: " + cashier + "\n", normalFormat);
                    }

                    // Separator
                    mPrinter.setPrintAppendString("----------------------------------------\n", normalFormat);

                    // Items
                    if (receipt.has("items")) {
                        org.json.JSONArray items = receipt.getJSONArray("items");
                        for (int i = 0; i < items.length(); i++) {
                            JSONObject item = items.getJSONObject(i);
                            String name = item.optString("name", "");
                            int quantity = item.optInt("quantity", 1);
                            double price = item.optDouble("price", 0);
                            double total = item.optDouble("total", 0);

                            String itemLine = String.format("%dx %s", quantity, name);
                            if (itemLine.length() > 30) {
                                itemLine = itemLine.substring(0, 27) + "...";
                            }

                            mPrinter.setPrintAppendString(itemLine + "\n", normalFormat);
                            mPrinter.setPrintAppendString(String.format("                          EUR %.2f\n", total), normalFormat);
                        }
                    }

                    // Separator
                    mPrinter.setPrintAppendString("----------------------------------------\n", normalFormat);

                    // Totals
                    double subtotal = receipt.optDouble("subtotal", 0);
                    double tax = receipt.optDouble("tax", 0);
                    double total = receipt.optDouble("total", 0);

                    mPrinter.setPrintAppendString(String.format("Subtotale:                EUR %.2f\n", subtotal), normalFormat);
                    mPrinter.setPrintAppendString(String.format("IVA 22%%:                  EUR %.2f\n", tax), normalFormat);

                    PrnStrFormat totalFormat = new PrnStrFormat();
                    totalFormat.setTextSize(30);
                    totalFormat.setAli(Layout.Alignment.ALIGN_NORMAL);
                    totalFormat.setStyle(PrnTextStyle.BOLD);
                    mPrinter.setPrintAppendString(String.format("TOTALE:                   EUR %.2f\n", total), totalFormat);

                    // Payment method
                    String paymentMethod = receipt.optString("paymentMethod", "");
                    if (!paymentMethod.isEmpty()) {
                        mPrinter.setPrintAppendString("----------------------------------------\n", normalFormat);
                        mPrinter.setPrintAppendString("Pagamento: " + paymentMethod + "\n", normalFormat);
                    }

                    // Footer
                    mPrinter.setPrintAppendString("\n", normalFormat);
                    mPrinter.setPrintAppendString("        Grazie per la visita!\n", normalFormat);
                    mPrinter.setPrintAppendString("       Powered by OMNILY PRO\n", normalFormat);
                    mPrinter.setPrintAppendString("\n\n", normalFormat);

                    // Print QR code if present
                    String qrData = receipt.optString("qrData", "");
                    if (!qrData.isEmpty()) {
                        mPrinter.setPrintAppendQRCode(qrData, 200, 200, Alignment.ALIGN_CENTER);
                        mPrinter.setPrintAppendString("\n", normalFormat);
                    }

                    // Start printing and cut paper
                    int printStatus = mPrinter.setPrintStart();
                    if (printStatus == SdkResult.SDK_OK) {
                        // Wait for print to complete then cut
                        Thread.sleep(2000);
                        mPrinter.openPrnCutter((byte) 1);

                        JSONObject result = new JSONObject();
                        result.put("success", true);
                        result.put("message", "Receipt printed successfully");
                        runJsCallback(callbackName, result.toString());
                        Log.d(TAG, "Receipt printed successfully");
                    } else {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Print failed with status: " + printStatus);
                        runJsCallback(callbackName, result.toString());
                        Log.e(TAG, "Print failed with status: " + printStatus);
                    }

                } catch (Exception e) {
                    Log.e(TAG, "Error printing receipt", e);
                    try {
                        JSONObject result = new JSONObject();
                        result.put("success", false);
                        result.put("error", "Receipt print error: " + e.getMessage());
                        runJsCallback(callbackName, result.toString());
                    } catch (Exception jsonE) {
                        Log.e(TAG, "Error creating error response", jsonE);
                    }
                }
            });
        }

        private void runJsCallback(final String callbackName, final String result) {
            Log.d(TAG, "🔴 runJsCallback called - callback: " + callbackName + ", result: " + result);
            if (callbackName != null && !callbackName.isEmpty()) {
                runOnUiThread(() -> {
                    Log.d(TAG, "🔴 About to call JavaScript callback: window." + callbackName);
                    if (webView != null) {
                        // Passa il JSON come oggetto, non come stringa
                        String jsCode = String.format("window.%s(%s)", callbackName, result);
                        Log.d(TAG, "🔴 Executing JS code: " + jsCode);
                        webView.evaluateJavascript(jsCode, null);
                        Log.d(TAG, "🔴 JavaScript callback executed successfully");
                    } else {
                        Log.e(TAG, "🔴 WebView is null - cannot execute callback!");
                    }
                });
            } else {
                Log.e(TAG, "🔴 Callback name is null or empty!");
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

        @JavascriptInterface
        public void testPrinter() {
            Log.d(TAG, "testPrinter called");

            new Thread(() -> {
                try {
                    if (mPrinter == null) {
                        Log.e(TAG, "Printer not initialized");
                        runOnUiThread(() -> showToast("Stampante non inizializzata"));
                        return;
                    }

                    // Simple test print
                    PrnStrFormat centerFormat = new PrnStrFormat();
                    centerFormat.setTextSize(24);
                    centerFormat.setAli(Layout.Alignment.ALIGN_CENTER);
                    centerFormat.setStyle(PrnTextStyle.BOLD);

                    PrnStrFormat normalFormat = new PrnStrFormat();
                    normalFormat.setTextSize(20);
                    normalFormat.setAli(Layout.Alignment.ALIGN_CENTER);

                    mPrinter.setPrintAppendString("\n", normalFormat);
                    mPrinter.setPrintAppendString("=== TEST STAMPANTE ===\n", centerFormat);
                    mPrinter.setPrintAppendString("\n", normalFormat);
                    mPrinter.setPrintAppendString("OMNILY PRO POS System\n", normalFormat);
                    mPrinter.setPrintAppendString("Test stampante eseguito con successo\n", normalFormat);
                    mPrinter.setPrintAppendString("\n", normalFormat);
                    mPrinter.setPrintAppendString(new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new java.util.Date()) + "\n", normalFormat);
                    mPrinter.setPrintAppendString("\n\n\n", normalFormat);

                    int printStatus = mPrinter.setPrintStart();
                    if (printStatus == SdkResult.SDK_OK) {
                        Thread.sleep(2000);
                        mPrinter.openPrnCutter((byte) 1);
                        Log.d(TAG, "Test print completed successfully");
                        runOnUiThread(() -> showToast("Test stampante completato"));
                    } else {
                        Log.e(TAG, "Test print failed with status: " + printStatus);
                        runOnUiThread(() -> showToast("Test stampante fallito"));
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in test print", e);
                    runOnUiThread(() -> showToast("Errore test stampante: " + e.getMessage()));
                }
            }).start();
        }

        @JavascriptInterface
        public String getNetworkInfo() {
            Log.d(TAG, "getNetworkInfo called");

            try {
                android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
                android.net.NetworkInfo activeNetwork = cm.getActiveNetworkInfo();

                JSONObject networkInfo = new JSONObject();

                if (activeNetwork != null && activeNetwork.isConnected()) {
                    networkInfo.put("connected", true);
                    networkInfo.put("type", activeNetwork.getTypeName()); // WIFI or MOBILE

                    // Try to get IP address
                    try {
                        java.net.InetAddress inetAddress = java.net.InetAddress.getLocalHost();
                        networkInfo.put("ip", inetAddress.getHostAddress());
                    } catch (Exception e) {
                        // Try alternative method for IP
                        try {
                            java.util.Enumeration<java.net.NetworkInterface> interfaces = java.net.NetworkInterface.getNetworkInterfaces();
                            while (interfaces.hasMoreElements()) {
                                java.net.NetworkInterface networkInterface = interfaces.nextElement();
                                java.util.Enumeration<java.net.InetAddress> addresses = networkInterface.getInetAddresses();
                                while (addresses.hasMoreElements()) {
                                    java.net.InetAddress addr = addresses.nextElement();
                                    if (!addr.isLoopbackAddress() && addr instanceof java.net.Inet4Address) {
                                        networkInfo.put("ip", addr.getHostAddress());
                                        break;
                                    }
                                }
                            }
                        } catch (Exception ex) {
                            Log.e(TAG, "Failed to get IP address", ex);
                            networkInfo.put("ip", "N/A");
                        }
                    }
                } else {
                    networkInfo.put("connected", false);
                    networkInfo.put("type", "None");
                    networkInfo.put("ip", "N/A");
                }

                String result = networkInfo.toString();
                Log.d(TAG, "getNetworkInfo returning: " + result);
                return result;

            } catch (Exception e) {
                Log.e(TAG, "Error getting network info", e);
                try {
                    JSONObject errorInfo = new JSONObject();
                    errorInfo.put("connected", false);
                    errorInfo.put("type", "Error");
                    errorInfo.put("ip", "N/A");
                    errorInfo.put("error", e.getMessage());
                    return errorInfo.toString();
                } catch (JSONException jsonE) {
                    return "{\"connected\":false,\"type\":\"Error\",\"ip\":\"N/A\"}";
                }
            }
        }
    }

    // ============================================================================
    // MDM - Device Admin Setup
    // ============================================================================

    private void setupDeviceAdmin() {
        try {
            mDevicePolicyManager = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
            mAdminComponent = new ComponentName(this, MyDeviceAdminReceiver.class);

            if (mDevicePolicyManager != null) {
                boolean isAdmin = mDevicePolicyManager.isAdminActive(mAdminComponent);
                boolean isDeviceOwner = mDevicePolicyManager.isDeviceOwnerApp(getPackageName());

                Log.i(TAG, "📱 Device Admin Status:");
                Log.i(TAG, "   - Is Admin: " + isAdmin);
                Log.i(TAG, "   - Is Device Owner: " + isDeviceOwner);

                if (isDeviceOwner) {
                    Log.i(TAG, "✅ App is Device Owner - Full MDM capabilities enabled");

                    // Abilita Lock Task Mode per Kiosk
                    String[] packages = {getPackageName()};
                    mDevicePolicyManager.setLockTaskPackages(mAdminComponent, packages);
                    Log.i(TAG, "✅ Lock Task packages set for Kiosk Mode");
                } else if (isAdmin) {
                    Log.w(TAG, "⚠️ App is Device Admin but NOT Device Owner - Limited capabilities");
                } else {
                    Log.w(TAG, "⚠️ App is NOT Device Admin - MDM features will be limited");
                    Log.w(TAG, "💡 To enable full MDM, set app as Device Owner via ADB:");
                    Log.w(TAG, "   adb shell dpm set-device-owner com.omnilypro.pos/.mdm.MyDeviceAdminReceiver");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error setting up Device Admin", e);
        }
    }

    private void registerMdmCommandReceiver() {
        mdmCommandReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                Log.i(TAG, "🎯 MDM Command received: " + action);

                if ("com.omnilypro.pos.KIOSK_MODE".equals(action)) {
                    boolean enabled = intent.getBooleanExtra("enabled", false);
                    handleKioskMode(enabled);
                } else if ("com.omnilypro.pos.SYNC_CONFIG".equals(action)) {
                    handleSyncConfig();
                } else if ("com.omnilypro.pos.TEST_PRINT".equals(action)) {
                    String template = intent.getStringExtra("template");
                    String receiptData = intent.getStringExtra("receiptData");
                    handleTestPrint(template, receiptData);
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction("com.omnilypro.pos.KIOSK_MODE");
        filter.addAction("com.omnilypro.pos.SYNC_CONFIG");
        filter.addAction("com.omnilypro.pos.TEST_PRINT");
        registerReceiver(mdmCommandReceiver, filter);

        Log.i(TAG, "✅ MDM Command Receiver registered");
    }

    private void handleKioskMode(boolean enable) {
        if (mDevicePolicyManager == null || mAdminComponent == null) {
            Log.e(TAG, "❌ DevicePolicyManager not initialized");
            return;
        }

        if (!mDevicePolicyManager.isDeviceOwnerApp(getPackageName())) {
            Log.w(TAG, "⚠️ Cannot enable Kiosk Mode - App is not Device Owner");
            Toast.makeText(this, "Kiosk Mode requires Device Owner privileges", Toast.LENGTH_LONG).show();
            return;
        }

        try {
            if (enable) {
                Log.i(TAG, "🔒 Entering KIOSK MODE (Lock Task)...");
                startLockTask();
                Toast.makeText(this, "🔒 KIOSK MODE ATTIVATA", Toast.LENGTH_LONG).show();
                Log.i(TAG, "✅ Kiosk Mode ENABLED");
            } else {
                Log.i(TAG, "🔓 Exiting KIOSK MODE...");
                stopLockTask();
                Toast.makeText(this, "🔓 KIOSK MODE DISATTIVATA", Toast.LENGTH_LONG).show();
                Log.i(TAG, "✅ Kiosk Mode DISABLED");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error toggling Kiosk Mode", e);
            Toast.makeText(this, "Errore Kiosk Mode: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void handleSyncConfig() {
        Log.i(TAG, "🔄 Syncing configuration from server...");
        Toast.makeText(this, "🔄 Sincronizzazione configurazione...", Toast.LENGTH_SHORT).show();

        // TODO: Implementare sync configurazioni da Supabase
        // Per ora reload del WebView per forzare refresh
        if (webView != null) {
            runOnUiThread(() -> {
                webView.reload();
                Log.i(TAG, "✅ WebView reloaded for config sync");
            });
        }
    }

    private void handleTestPrint(String templateJson, String receiptDataJson) {
        Log.i(TAG, "🖨️ Handling test print command...");
        Log.i(TAG, "📄 Template JSON length: " + (templateJson != null ? templateJson.length() : 0));
        Log.i(TAG, "🧾 Receipt data JSON length: " + (receiptDataJson != null ? receiptDataJson.length() : 0));

        if (templateJson == null) {
            Log.e(TAG, "❌ No template data for print");
            Toast.makeText(this, "❌ Errore: Nessun template di stampa", Toast.LENGTH_LONG).show();
            return;
        }

        if (webView != null) {
            runOnUiThread(() -> {
                try {
                    // Escape delle stringhe JSON per JavaScript
                    String escapedTemplate = templateJson
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r");
                    
                    String escapedReceiptData = receiptDataJson != null ? receiptDataJson
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r") : "null";

                    // Chiama funzione JavaScript nel WebView per eseguire la stampa
                    String jsCode = String.format(
                        "if (window.handleMDMPrintCommand) { " +
                        "  console.log('🖨️ Calling handleMDMPrintCommand...'); " +
                        "  window.handleMDMPrintCommand(\"%s\", \"%s\"); " +
                        "} else { " +
                        "  console.error('❌ window.handleMDMPrintCommand not found!'); " +
                        "}",
                        escapedTemplate,
                        escapedReceiptData
                    );

                    webView.evaluateJavascript(jsCode, result -> {
                        Log.i(TAG, "✅ JavaScript executed for print command, result: " + result);
                    });

                    Toast.makeText(this, "🖨️ Comando di stampa ricevuto", Toast.LENGTH_SHORT).show();
                    
                } catch (Exception e) {
                    Log.e(TAG, "❌ Error executing print command in WebView", e);
                    Toast.makeText(this, "❌ Errore esecuzione stampa: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } else {
            Log.e(TAG, "❌ WebView is null, cannot execute print");
            Toast.makeText(this, "❌ Errore: WebView non disponibile", Toast.LENGTH_LONG).show();
        }
    }

    // ============================================================================

    @Override
    protected void onDestroy() {
        super.onDestroy();

        // Stop periodic bridge re-injection
        if (bridgeHandler != null && bridgeInjector != null) {
            bridgeHandler.removeCallbacks(bridgeInjector);
            Log.d(TAG, "🛑 Periodic bridge re-injection stopped");
        }

        // Deregistra BroadcastReceiver MDM
        if (mdmCommandReceiver != null) {
            try {
                unregisterReceiver(mdmCommandReceiver);
                Log.d(TAG, "MDM command receiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering MDM receiver", e);
            }
        }

        if (customerPresentation != null) {
            customerPresentation.dismiss();
        }

        // QR scanner cleanup not needed for ZXing - handled automatically

        if (mExecutor != null) {
            mExecutor.shutdownNow();
        }
        if (mSys != null) {
            mSys.sysPowerOff();
        }

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
        private WebView customerWebView;

        public CustomerPresentation(Context outerContext, Display display) {
            super(outerContext, display);
        }

        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            customerWebView = new WebView(getContext());

            // Configura la WebView del customer display
            WebSettings settings = customerWebView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Blocca anche nel customer display qualsiasi tentativo di popup
            customerWebView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                    Log.w(TAG, "🚫 BLOCCATO popup nel customer display");
                    return false; // Blocca tutti i popup anche nel customer display
                }
            });

            customerWebView.loadUrl("https://omnilypro.vercel.app?posomnily=true&customer=true");
            setContentView(customerWebView);

            Log.d(TAG, "✅ CustomerPresentation WebView creata e configurata");
        }

        // Metodo per inviare dati alla WebView del customer display
        public void sendDataToDisplay(String jsonData) {
            if (customerWebView != null) {
                runOnUiThread(() -> {
                    try {
                        String jsCode = String.format("window.postMessage(%s, '*');", jsonData);
                        Log.d(TAG, "📤 Invio dati al customer display: " + jsCode);
                        customerWebView.evaluateJavascript(jsCode, null);
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Errore invio dati customer display", e);
                    }
                });
            } else {
                Log.w(TAG, "⚠️ CustomerWebView non disponibile");
            }
        }

        // Getter per accedere alla WebView dall'esterno
        public WebView getWebView() {
            return customerWebView;
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
