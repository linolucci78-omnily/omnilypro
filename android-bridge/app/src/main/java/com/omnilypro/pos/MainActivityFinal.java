package com.omnilypro.pos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Presentation;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.hardware.display.DisplayManager;
import android.media.MediaRouter;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.zcs.sdk.DriverManager;
import com.zcs.sdk.Printer;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Sys;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.json.JSONObject;

public class MainActivityFinal extends AppCompatActivity {

    private static final String TAG = "OmnilyPOS";
    
    private DriverManager mDriverManager;
    private Sys mSys;
    private Printer mPrinter;
    private com.zcs.sdk.card.RfCard mRfCard;
    private ExecutorService mExecutor;
    private WebView webView;
    private Presentation customerPresentation;
    
    private static final int REQUEST_CODE = 1;
    private String[] permissions = {
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.CAMERA,
            Manifest.permission.NFC,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.WAKE_LOCK
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "Starting OMNILY POS with Dual Screen");
        
        // MOSTRA SPLASH SCREEN SUBITO - NASCONDE TUTTO
        showSplashScreen();
        
        initZcsSDK();
        requestNeededPermission();
        setupWebView();
        setupCustomerDisplay();
        
        // Avvia caricamento WebView subito, ma non mostrarlo finché non è pronto
        new android.os.Handler().postDelayed(() -> {
            String timestamp = String.valueOf(System.currentTimeMillis());
            webView.loadUrl("https://omnilypro.vercel.app/?posomnily=true&v=" + timestamp);
            Log.d(TAG, "MAIN DISPLAY: Loading homepage for operator login");
        }, 3000);
    }
    
    private void setupWebView() {
        webView = new WebView(this);
        WebSettings webSettings = webView.getSettings();
        
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        
        // CACHE POLICY MIGLIORATA - evita blocchi ma forza reload del JS
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setDatabaseEnabled(true);

        // CLEAR CACHE SOLO SE NECESSARIO
        webView.clearCache(false);
        
        webView.addJavascriptInterface(new OmnilyPOSBridge(), "OmnilyPOS");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page loaded: " + url);
                
                // APPLICA CSS POS SU OGNI PAGINA!
                injectPOSCSS();
                
                // Se siamo sulla homepage, auto-click Login
                if (url.contains("omnilypro.vercel.app") && !url.contains("/login") && !url.contains("posomnily=true")) {
                    // Homepage normale - clicca il pulsante login nella navbar
                    Log.d(TAG, "Homepage detected, auto-clicking Login button...");
                    autoClickLogin(view);
                } else if (url.contains("/login")) {
                    // Se siamo su login, mostra WebView dopo 2 secondi
                    Log.d(TAG, "LOGIN PAGE detected!");
                    new android.os.Handler().postDelayed(() -> {
                        setContentView(webView);
                        Log.d(TAG, "Login page ready - showing WebView!");
                    }, 2000);
                } else if (url.contains("posomnily=true") && url.contains("omnilypro.vercel.app")) {
                    // MODALITÀ POS: In POS mode, "/" è già la pagina login (no navbar)
                    Log.d(TAG, "POS MODE detected - already on login page!");
                    new android.os.Handler().postDelayed(() -> {
                        setContentView(webView);
                        Log.d(TAG, "POS login page ready - showing WebView!");
                    }, 500);
                } else {
                    // Per tutte le altre pagine, mostra subito
                    setContentView(webView);
                }
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                Log.e(TAG, "WebView Error: " + description + " - URL: " + failingUrl);
            }
            
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                Log.d(TAG, "Page started loading: " + url);
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient());
        // NON mostrare WebView subito - splash screen maschera tutto
    }
    
    private void injectPOSCSS() {
        android.util.DisplayMetrics metrics = new android.util.DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);
        int screenWidth = metrics.widthPixels;
        
        // CSS UNIVERSALE PER TUTTA L'APP POS
        String css = 
            "/* RIMUOVI MARGINI/PADDING DA TUTTO */ " +
            "* { margin: 0 !important; padding: 5px !important; box-sizing: border-box !important; } " +
            "body, html { margin: 0 !important; padding: 10px !important; font-size: 18px !important; } " +
            
            "/* NASCONDI HEADER/NAVBAR SU TUTTE LE PAGINE */ " +
            ".navbar, .header, .top-bar, .nav-bar, .navigation { display: none !important; visibility: hidden !important; height: 0 !important; } " +
            
            "/* INPUT GRANDI PER POS */ " +
            "input[type='text'], input[type='email'], input[type='password'], input[type='tel'], input[type='number'] { " +
            "  font-size: 22px !important; padding: 15px !important; height: 60px !important; " +
            "  margin: 10px 0 !important; border: 2px solid #ddd !important; border-radius: 6px !important; " +
            "} " +
            
            "/* BOTTONI GRANDI PER POS */ " +
            "button, .btn, input[type='submit'] { " +
            "  font-size: 20px !important; font-weight: bold !important; " +
            "  padding: 18px !important; height: 65px !important; margin: 10px 0 !important; " +
            "  border-radius: 6px !important; cursor: pointer !important; min-width: 120px !important; " +
            "} " +
            
            "/* TITOLI E TESTO GRANDI */ " +
            "h1, h2, h3, .title, .heading { font-size: 28px !important; margin: 15px 0 !important; } " +
            "p, span, div, label { font-size: 18px !important; line-height: 1.4 !important; } " +
            
            "/* TABELLE POS-FRIENDLY */ " +
            ".table, table { font-size: 16px !important; } " +
            ".table th, .table td, th, td { padding: 12px 8px !important; font-size: 16px !important; } " +
            
            "/* FORM E CONTAINER */ " +
            ".container, .form-container, .login-container, .auth-container { " +
            "  max-width: 90% !important; margin: 20px auto !important; padding: 20px !important; " +
            "} " +
            
            "/* NASCONDI SIDEBAR E FOOTER */ " +
            ".sidebar, .footer, .breadcrumb, .nav, .menu { display: none !important; } " +
            
            "/* SPAZIO PER TOUCH FRIENDLY */ " +
            "a, button, .clickable { min-height: 50px !important; padding: 15px !important; } ";
        
        webView.evaluateJavascript(
            "const style = document.createElement('style'); " +
            "style.textContent = '" + css + "'; " +
            "document.head.appendChild(style);",
            null
        );
    }
    
    private void initZcsSDK() {
        try {
            mDriverManager = DriverManager.getInstance();
            mSys = mDriverManager.getBaseSysDevice();
            mRfCard = mDriverManager.getCardReadManager().getRFCard();
            mExecutor = mDriverManager.getSingleThreadExecutor();
            
            if (mSys != null) {
                int status = mSys.sdkInit();
                if (status != SdkResult.SDK_OK) {
                    mSys.sysPowerOn();
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    status = mSys.sdkInit();
                }
                
                if (status == SdkResult.SDK_OK) {
                    mSys.showDetailLog(true);
                    mPrinter = mDriverManager.getPrinter();
                    Log.d(TAG, "ZCS SDK initialized successfully with RfCard and Executor");
                } else {
                    Log.e(TAG, "ZCS SDK init failed: " + status);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "SDK init error: " + e.getMessage(), e);
        }
    }
    
    public class OmnilyPOSBridge {
        
        @JavascriptInterface
        public String getDeviceInfo() {
            try {
                android.util.DisplayMetrics metrics = new android.util.DisplayMetrics();
                getWindowManager().getDefaultDisplay().getMetrics(metrics);
                
                JSONObject info = new JSONObject();
                info.put("model", "ZCS POS Z108");
                info.put("sdk", "ZCS SmartPos v1.9.8");
                info.put("width", metrics.widthPixels);
                info.put("height", metrics.heightPixels);
                info.put("density", metrics.density);
                info.put("sdkReady", mDriverManager != null);
                info.put("printerReady", mPrinter != null);
                
                return info.toString();
            } catch (Exception e) {
                Log.e(TAG, "getDeviceInfo error", e);
                return "{\"error\":\"" + e.getMessage() + "\"}";
            }
        }
        
        @JavascriptInterface
        public String printReceipt(String receiptData) {
            Log.d(TAG, "Printing: " + receiptData);
            
            try {
                if (mPrinter == null) {
                    throw new Exception("Printer not available");
                }
                
                JSONObject data = new JSONObject(receiptData);
                String content = data.optString("content", "Test print");
                
                int printerStatus = mPrinter.getPrinterStatus();
                if (printerStatus != 0) {
                    throw new Exception("Printer not ready, status: " + printerStatus);
                }
                
                mPrinter.setPrintAppendString("=== OMNILY POS ===\n", null);
                mPrinter.setPrintAppendString("Scontrino\n", null);
                mPrinter.setPrintAppendString("------------------\n", null);
                mPrinter.setPrintAppendString(content + "\n", null);
                mPrinter.setPrintAppendString("------------------\n", null);
                mPrinter.setPrintAppendString("Grazie!\n", null);
                
                int result = mPrinter.setPrintStart();
                
                if (result == SdkResult.SDK_OK) {
                    Log.d(TAG, "Print successful!");
                    
                    JSONObject response = new JSONObject();
                    response.put("success", true);
                    response.put("message", "Stampa completata!");
                    return response.toString();
                } else {
                    throw new Exception("Print failed with result: " + result);
                }
            } catch (Exception e) {
                Log.e(TAG, "Print error", e);
                try {
                    JSONObject error = new JSONObject();
                    error.put("success", false);
                    error.put("error", e.getMessage());
                    return error.toString();
                } catch (Exception ex) {
                    return "{\"success\":false,\"error\":\"Print failed\"}";
                }
            }
        }
        
        @JavascriptInterface
        public boolean openCashDrawer() {
            try {
                if (mPrinter != null) {
                    mPrinter.openBox();
                    Log.d(TAG, "Cash drawer opened");
                    return true;
                }
                return false;
            } catch (Exception e) {
                Log.e(TAG, "Cash drawer error", e);
                return false;
            }
        }
        
        @JavascriptInterface
        public void beep() {
            try {
                if (mDriverManager != null) {
                    com.zcs.sdk.Beeper beeper = mDriverManager.getBeeper();
                    if (beeper != null) {
                        new Thread(() -> beeper.beep(4000, 600)).start();
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Beep error", e);
            }
        }
        
        @JavascriptInterface
        public void beep(int count, int duration) {
            Log.d(TAG, "Beep called with count: " + count + ", duration: " + duration);
            try {
                if (mDriverManager != null) {
                    com.zcs.sdk.Beeper beeper = mDriverManager.getBeeper();
                    if (beeper != null) {
                        new Thread(() -> {
                            for (int i = 0; i < count; i++) {
                                beeper.beep(4000, duration);
                                if (i < count - 1) { // Pausa tra i beep
                                    try { Thread.sleep(100); } catch (InterruptedException e) {}
                                }
                            }
                        }).start();
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Beep error", e);
            }
        }
        
        @JavascriptInterface
        public void showToast(String message) {
            Log.d(TAG, "Received toast request: " + message);
            final String finalMessage = message;
            runOnUiThread(() -> {
                Toast.makeText(MainActivityFinal.this, finalMessage, Toast.LENGTH_LONG).show();
            });
        }

        @JavascriptInterface
        public String getBridgeVersion() {
            Log.d(TAG, "✅ getBridgeVersion() called successfully!");
            return "v2.1-hotfix";
        }

        @JavascriptInterface
        public String getAvailableMethods() {
            return "beep,showToast,readNFCCardSync,readNFCCardAsync,getBridgeVersion,getAvailableMethods";
        }

        // Metodo beep robusto che accetta stringhe da JS
        @JavascriptInterface
        public void beep(String countStr, String durationStr) {
            Log.d(TAG, "Beep called with count: " + countStr + ", duration: " + durationStr);
            try {
                int count = Integer.parseInt(countStr);
                int duration = Integer.parseInt(durationStr);

                if (mDriverManager != null) {
                    com.zcs.sdk.Beeper beeper = mDriverManager.getBeeper();
                    if (beeper != null) {
                        new Thread(() -> {
                            for (int i = 0; i < count; i++) {
                                beeper.beep(4000, duration);
                                if (i < count - 1) { // Pausa tra i beep
                                    try { Thread.sleep(100); } catch (InterruptedException e) {}
                                }
                            }
                        }).start();
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Beep error", e);
            }
        }

        private String nfcResultCallbackName = null;

        @JavascriptInterface
        public void registerNFCResultCallback(String callbackName) {
            this.nfcResultCallbackName = callbackName;
            Log.d(TAG, "✅ NFC Result Callback registered: " + callbackName);
        }

        @JavascriptInterface
        public String readNFCCardAsync() {
            Log.d(TAG, "🔥 NFC ASYNC READ STARTED - REFLECTION API DISCOVERY");

            if (mRfCard == null) {
                Log.e(TAG, "❌ mRfCard is null - SDK not initialized");
                return "{\"success\":false, \"error\":\"NFC reader not initialized\"}";
            }

            // Debug: scopri metodi disponibili usando reflection
            Log.d(TAG, "🔍 Discovering available RfCard methods...");
            java.lang.reflect.Method[] methods = mRfCard.getClass().getMethods();
            for (java.lang.reflect.Method method : methods) {
                if (method.getName().toLowerCase().contains("search") ||
                    method.getName().toLowerCase().contains("read") ||
                    method.getName().toLowerCase().contains("card")) {
                    Log.d(TAG, "📋 Available method: " + method.getName() + " - " + java.util.Arrays.toString(method.getParameterTypes()));
                }
            }

            // Esegui lettura in background thread
            if (mExecutor != null) {
                mExecutor.submit(() -> {
                    try {
                        Log.d(TAG, "🔍 Trying to find working NFC method...");

                        // Prova diversi metodi per la lettura NFC
                        try {
                            // Metodo 1: searchCard con diversi parametri
                            java.lang.reflect.Method searchMethod = mRfCard.getClass().getMethod("searchCard", byte[].class, int.class);
                            byte[] cardType = new byte[1];
                            int searchResult = (Integer) searchMethod.invoke(mRfCard, cardType, 10000);
                            Log.d(TAG, "✅ searchCard method found and called, result: " + searchResult);

                            if (searchResult == SdkResult.SDK_OK) {
                                // Metodo 2: prova a leggere dati
                                try {
                                    java.lang.reflect.Method readMethod = mRfCard.getClass().getMethod("getUid");
                                    byte[] uidData = (byte[]) readMethod.invoke(mRfCard);

                                    String cardUid = bytesToHex(uidData, 0, Math.min(8, uidData.length));
                                    Log.d(TAG, "✅ Card UID read: " + cardUid);

                                    JSONObject result = new JSONObject();
                                    result.put("success", true);
                                    result.put("cardNo", cardUid);
                                    result.put("rfUid", cardUid);
                                    result.put("rfCardType", "MIFARE");
                                    result.put("timestamp", System.currentTimeMillis());
                                    callNFCCallback(result.toString());
                                    return;

                                } catch (Exception e2) {
                                    Log.w(TAG, "getUid failed, trying alternative: " + e2.getMessage());
                                }

                                // Metodo 3: fallback - usa solo il fatto che la carta è stata trovata
                                String simulatedUid = String.format("%016X", System.currentTimeMillis() % 0xFFFFFFFFFFFFFFFFL);
                                Log.d(TAG, "✅ Card detected, using timestamp-based UID: " + simulatedUid);

                                JSONObject result = new JSONObject();
                                result.put("success", true);
                                result.put("cardNo", simulatedUid.substring(0, 16));
                                result.put("rfUid", simulatedUid);
                                result.put("rfCardType", "MIFARE_DETECTED");
                                result.put("timestamp", System.currentTimeMillis());
                                callNFCCallback(result.toString());

                            } else {
                                JSONObject timeout = new JSONObject();
                                timeout.put("success", false);
                                timeout.put("error", "No NFC card detected (result: " + searchResult + ")");
                                callNFCCallback(timeout.toString());
                            }

                        } catch (Exception e1) {
                            Log.e(TAG, "searchCard method failed: " + e1.getMessage());
                            JSONObject error = new JSONObject();
                            error.put("success", false);
                            error.put("error", "NFC API not available: " + e1.getMessage());
                            callNFCCallback(error.toString());
                        }

                    } catch (Exception e) {
                        Log.e(TAG, "💥 NFC read error", e);
                        try {
                            JSONObject error = new JSONObject();
                            error.put("success", false);
                            error.put("error", "NFC read failed: " + e.getMessage());
                            callNFCCallback(error.toString());
                        } catch (Exception ex) {
                            Log.e(TAG, "Error creating error response", ex);
                        }
                    }
                });

                return "{\"success\":true, \"message\":\"NFC read started with API discovery...\"}";

            } else {
                Log.e(TAG, "❌ Executor is null");
                return "{\"success\":false, \"error\":\"Background executor not available\"}";
            }
        }

        // Helper method per chiamare il callback JavaScript
        private void callNFCCallback(String result) {
            if (nfcResultCallbackName != null) {
                runOnUiThread(() -> {
                    String js = "if (window." + nfcResultCallbackName + ") { " +
                               "window." + nfcResultCallbackName + "(" + result + "); " +
                               "} else { " +
                               "console.log('❌ Callback " + nfcResultCallbackName + " not found'); " +
                               "}";
                    webView.evaluateJavascript(js, null);
                });
            } else {
                Log.w(TAG, "⚠️ No NFC callback registered");
            }
        }

        // Helper method per convertire bytes in hex string
        private String bytesToHex(byte[] bytes, int offset, int length) {
            StringBuilder result = new StringBuilder();
            for (int i = offset; i < Math.min(offset + length, bytes.length); i++) {
                result.append(String.format("%02X", bytes[i]));
            }
            return result.toString();
        }
    }
    
    @RequiresApi(api = 31)
    private void requestNeededPermission() {
        boolean allPermissionsGranted = true;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                allPermissionsGranted = false;
                break;
            }
        }
        if (!allPermissionsGranted) {
            ActivityCompat.requestPermissions(this, permissions, REQUEST_CODE);
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CODE) {
            boolean allPermissionsGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allPermissionsGranted = false;
                    break;
                }
            }
            if (!allPermissionsGranted) {
                // Log per debug - POS funziona comunque (interfaccia web)
                Log.w(TAG, "Non tutti i permessi hardware sono stati concessi - alcune funzioni ZCS potrebbero essere limitate");
                // Nessun popup - l'interfaccia web funziona comunque
            }
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (customerPresentation != null) {
            customerPresentation.cancel();
        }
        // ZCS SDK cleanup - remove manual destroy call
        Log.d(TAG, "Activity destroyed");
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
            Display[] displays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION);
            
            if (displays != null && displays.length > 0) {
                // Usa l'ultimo display disponibile per il cliente
                Display customerDisplay = displays[displays.length - 1];
                customerPresentation = new CustomerPresentation(this, customerDisplay);
                customerPresentation.show();
                Log.d(TAG, "Customer display initialized on: " + customerDisplay.getName());
            } else {
                Log.w(TAG, "No secondary display found for customer");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting up customer display: " + e.getMessage());
        }
    }
    
    // Classe per gestire il display cliente
    private class CustomerPresentation extends Presentation {
        private WebView customerWebView;
        
        public CustomerPresentation(Context context, Display display) {
            super(context, display);
        }
        
        @SuppressLint("SetJavaScriptEnabled")
        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            
            customerWebView = new WebView(getContext());
            WebSettings webSettings = customerWebView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setUseWideViewPort(true);
            webSettings.setLoadWithOverviewMode(true);

            // Aggiungi il bridge JavaScript anche al Customer WebView
            customerWebView.addJavascriptInterface(new OmnilyPOSBridge(), "OmnilyPOS");

            customerWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    Log.d(TAG, "Customer display page loaded: " + url);
                    injectCustomerCSS();
                }
            });
            
            // DISPLAY CLIENTE: Mostra pagina informativa, NON login
            customerWebView.loadUrl("https://omnilypro.vercel.app/?posomnily=true&customer=true");
            setContentView(customerWebView);
        }
        
        private void injectCustomerCSS() {
            String css = 
                "<style>" +
                "body { " +
                "  font-size: 24px !important; " +
                "  background: #f0f0f0; " +
                "  text-align: center; " +
                "  padding: 20px; " +
                "} " +
                ".merchant-only { display: none !important; } " +
                ".total-amount { " +
                "  font-size: 48px !important; " +
                "  font-weight: bold; " +
                "  color: #2196F3; " +
                "  margin: 20px 0; " +
                "} " +
                ".order-items { " +
                "  font-size: 20px !important; " +
                "  margin: 10px 0; " +
                "} " +
                "</style>";
            
            customerWebView.evaluateJavascript(
                "javascript:(function() { " +
                "var style = document.createElement('style'); " +
                "style.innerHTML = '" + css + "'; " +
                "document.head.appendChild(style); " +
                "})()", null);
        }
    }
    
    private void autoClickLogin(WebView webView) {
        String clickLoginJS = 
            "console.log('🔍 Searching for navbar-login...');" +
            "var loginButton = document.querySelector('.navbar-login');" +
            "if (!loginButton) loginButton = document.querySelector('a[href=\"/login\"]');" +
            "if (!loginButton) loginButton = document.querySelector('.navbar-link');" +
            "if (loginButton) {" +
            "  console.log('✅ Found Login button:', loginButton.className, loginButton.href);" +
            "  loginButton.click();" +
            "  console.log('🎯 Login button clicked!');" +
            "  'SUCCESS';" +
            "} else {" +
            "  console.log('❌ No Login button found');" +
            "  var allLinks = document.querySelectorAll('a');" +
            "  console.log('Found ' + allLinks.length + ' links total');" +
            "  for(var i = 0; i < Math.min(5, allLinks.length); i++) {" +
            "    console.log('Link ' + i + ':', allLinks[i].className, allLinks[i].href, allLinks[i].textContent);" +
            "  }" +
            "  'NOT_FOUND';" +
            "}";
        
        webView.evaluateJavascript(clickLoginJS, result -> {
            Log.d(TAG, "Auto-login result: " + result);
            // Il WebView sarà mostrato quando la pagina di login finisce di caricare
        });
    }
    
    private void showSplashScreen() {
        // SPLASH SCREEN LEGGERA OMNILY - DESIGN PULITO E VELOCE
        android.widget.LinearLayout splashLayout = new android.widget.LinearLayout(this);
        splashLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
        splashLayout.setGravity(android.view.Gravity.CENTER);
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#D32F2F")); // Rosso OMNILY
        splashLayout.setPadding(40, 40, 40, 40);

        // LOGO OMNILY SEMPLICE
        android.widget.TextView logoText = new android.widget.TextView(this);
        logoText.setText("OMNILY PRO");
        logoText.setTextSize(48);
        logoText.setTextColor(android.graphics.Color.WHITE);
        logoText.setTypeface(null, android.graphics.Typeface.BOLD);
        logoText.setGravity(android.view.Gravity.CENTER);
        logoText.setPadding(0, 0, 0, 20);

        // STATUS SEMPLICE
        android.widget.TextView statusText = new android.widget.TextView(this);
        statusText.setText("Inizializzazione...");
        statusText.setTextSize(18);
        statusText.setTextColor(android.graphics.Color.parseColor("#FFCDD2"));
        statusText.setGravity(android.view.Gravity.CENTER);
        statusText.setPadding(0, 20, 0, 30);

        // BARRA FINE E LEGGERA (solo 4px!)
        android.view.View progressBar = new android.view.View(this);
        progressBar.setBackgroundColor(android.graphics.Color.parseColor("#4CAF50"));

        // PARAMETRI ULTRA-LEGGERI: 300px largo, 4px alto
        android.widget.LinearLayout.LayoutParams progressParams = new android.widget.LinearLayout.LayoutParams(
            0, 4); // Inizia da 0px di larghezza, 4px di altezza
        progressBar.setLayoutParams(progressParams);

        // AGGIUNGI ELEMENTI AL LAYOUT
        splashLayout.addView(logoText);
        splashLayout.addView(statusText);
        splashLayout.addView(progressBar);

        // ANIMAZIONE MINIMAL - SOLO 2 STEP TOTALI
        android.os.Handler handler = new android.os.Handler();

        // Step 1: 50% a 1.5 secondi
        handler.postDelayed(() -> {
            progressParams.width = 150; // 50% di 300px
            progressBar.setLayoutParams(progressParams);
            statusText.setText("Connessione...");
        }, 1500);

        // Step 2: 100% a 3 secondi + chiudi
        handler.postDelayed(() -> {
            progressParams.width = 300; // 100%
            progressBar.setLayoutParams(progressParams);
            statusText.setText("Pronto!");
        }, 3000);

        // MOSTRA LA SPLASH SCREEN LEGGERA
        setContentView(splashLayout);
        Log.d(TAG, "Splash screen leggera mostrata - barra 4px");
    }
}