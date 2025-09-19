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
        
        // SCHERMO PRINCIPALE (GRANDE): Login per operatore con cache bust
        String timestamp = String.valueOf(System.currentTimeMillis());
        webView.loadUrl("https://omnilypro.vercel.app/?posomnily=true&v=" + timestamp);
        Log.d(TAG, "MAIN DISPLAY: Loading homepage for operator login");
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
        
        // DISABILITA COMPLETAMENTE LA CACHE PER FORZARE RELOAD
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webSettings.setDatabaseEnabled(false);

        // CLEAR CACHE ESISTENTE
        webView.clearCache(true);
        webView.clearHistory();
        
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
                    }, 2000);
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
            runOnUiThread(() -> {
                Toast.makeText(MainActivityFinal.this, message, Toast.LENGTH_SHORT).show();
            });
        }
        
        @JavascriptInterface
        public String getBridgeVersion() {
            Log.d(TAG, "✅ getBridgeVersion() called successfully!");
            return "v2.0-nfc-enabled";
        }
        
        @JavascriptInterface
        public String getAvailableMethods() {
            return "beep,showToast,readNFCCardSync,readNFCCardAsync,getBridgeVersion,getAvailableMethods";
        }

        @JavascriptInterface
        public void readNFCCardAsync(String callbackName) {
            Log.d(TAG, "🔥🔥🔥 ASYNC NFC READ - Using ZCS SDK - Callback: " + callbackName);

            if (mExecutor == null || mRfCard == null) {
                Log.e(TAG, "❌ ZCS SDK not properly initialized for NFC.");
                try {
                    String errorResult = new JSONObject()
                        .put("success", false)
                        .put("error", "ZCS SDK not initialized")
                        .toString();
                    
                    runOnUiThread(() -> webView.evaluateJavascript(callbackName + "(" + errorResult + ");", null));
                } catch (Exception e) { /* ignore */ }
                return;
            }

            mExecutor.submit(() -> {
                String resultJson;
                try {
                    Log.d(TAG, "✅ ASYNC: Using ZCS ExecutorService thread for NFC read");

                    byte[] outType = new byte[1];
                    byte[] uid = new byte[300];
                    int ret = -1;

                    Log.d(TAG, "⏳ ASYNC: Preparazione lettore NFC...");
                    Thread.sleep(250); // Small delay for stability

                    // Try RF_TYPE_A (most common)
                    ret = mRfCard.rfSearchCard(com.zcs.sdk.SdkData.RF_TYPE_A, outType, uid);
                    Log.d(TAG, "🔍 ASYNC: ZCS RF_TYPE_A result: " + ret);

                    if (ret != com.zcs.sdk.SdkResult.SDK_OK) {
                        Log.d(TAG, "🔍 ASYNC: Trying RF_TYPE_B...");
                        ret = mRfCard.rfSearchCard(com.zcs.sdk.SdkData.RF_TYPE_B, outType, uid);
                        Log.d(TAG, "🔍 ASYNC: ZCS RF_TYPE_B result: " + ret);
                    }

                    if (ret == com.zcs.sdk.SdkResult.SDK_OK) {
                        StringBuilder uidHex = new StringBuilder();
                        int uidLength = 0;
                        for (int i = 0; i < uid.length && i < 16; i++) {
                            if (uid[i] != 0 || uidLength > 0) { // Calculate actual length
                                uidLength = i + 1;
                            }
                        }
                        for (int i = 0; i < uidLength; i++) {
                            uidHex.append(String.format("%02X", uid[i]));
                            if (i < uidLength - 1) uidHex.append(":");
                        }

                        if (uidLength > 0) {
                            Log.d(TAG, "🎉 ASYNC: ZCS NFC SUCCESS! UID: " + uidHex.toString());
                            resultJson = new JSONObject()
                                .put("success", true)
                                .put("cardNo", uidHex.toString())
                                .put("rfUid", uidHex.toString())
                                .put("cardType", "ZCS_NFC_ASYNC")
                                .put("rfType", outType[0])
                                .put("uidLength", uidLength)
                                .put("timestamp", System.currentTimeMillis())
                                .toString();
                        } else {
                             resultJson = new JSONObject()
                                .put("success", false)
                                .put("error", "ZCS: Card found but UID is empty")
                                .toString();
                        }
                    } else {
                        Log.w(TAG, "⚠️ ASYNC: ZCS No card detected. Return code: " + ret);
                        resultJson = new JSONObject()
                            .put("success", false)
                            .put("error", "ZCS: No card detected. Code: " + ret)
                            .toString();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ ASYNC: ZCS Executor error: " + e.getMessage(), e);
                    try {
                        resultJson = new JSONObject()
                            .put("success", false)
                            .put("error", "ZCS execution error: " + e.getMessage())
                            .toString();
                    } catch (Exception ex) {
                        resultJson = "{\"success\":false,\"error\":\"ZCS unknown error\"}";
                    }
                }

                // Execute the JavaScript callback on the UI thread
                final String finalResultJson = resultJson;
                runOnUiThread(() -> {
                    String jsCode = "try { " + callbackName + "(" + finalResultJson + "); } catch (e) { console.error('JS callback error:', e); }";
                    webView.evaluateJavascript(jsCode, null);
                });
            });
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
        // SPLASH SCREEN PROFESSIONALE OMNILY - ROSSO CON BARRA CARICAMENTO
        android.widget.RelativeLayout splashLayout = new android.widget.RelativeLayout(this);
        
        // SFONDO ROSSO OMNILY (gradiente simulato)
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#B71C1C")); // Rosso scuro
        
        // CONTAINER CENTRALE
        android.widget.LinearLayout centerContainer = new android.widget.LinearLayout(this);
        centerContainer.setOrientation(android.widget.LinearLayout.VERTICAL);
        centerContainer.setGravity(android.view.Gravity.CENTER);
        centerContainer.setBackgroundColor(android.graphics.Color.parseColor("#D32F2F")); // Rosso medio
        centerContainer.setPadding(60, 80, 60, 80);
        
        // LOGO OMNILY (molto grande)
        android.widget.TextView logoText = new android.widget.TextView(this);
        logoText.setText("OMNILY");
        logoText.setTextSize(64);
        logoText.setTextColor(android.graphics.Color.WHITE);
        logoText.setTypeface(null, android.graphics.Typeface.BOLD);
        logoText.setGravity(android.view.Gravity.CENTER);
        logoText.setShadowLayer(5, 2, 2, android.graphics.Color.parseColor("#000000"));
        
        // PRO TEXT (stilizzato)
        android.widget.TextView proText = new android.widget.TextView(this);
        proText.setText("P R O");
        proText.setTextSize(32);
        proText.setTextColor(android.graphics.Color.parseColor("#FFCDD2")); // Rosa chiaro
        proText.setTypeface(null, android.graphics.Typeface.BOLD);
        proText.setGravity(android.view.Gravity.CENTER);
        proText.setShadowLayer(3, 1, 1, android.graphics.Color.parseColor("#000000"));
        
        // SOTTOTITOLO
        android.widget.TextView subtitleText = new android.widget.TextView(this);
        subtitleText.setText("Sistema POS Avanzato");
        subtitleText.setTextSize(20);
        subtitleText.setTextColor(android.graphics.Color.parseColor("#FFEBEE")); // Rosa molto chiaro
        subtitleText.setGravity(android.view.Gravity.CENTER);
        subtitleText.setAlpha(0.9f);
        subtitleText.setPadding(0, 20, 0, 40);
        
        // VERSIONE
        android.widget.TextView versionText = new android.widget.TextView(this);
        versionText.setText("v2.1.0 - ZCS Integration");
        versionText.setTextSize(14);
        versionText.setTextColor(android.graphics.Color.parseColor("#FFCDD2"));
        versionText.setGravity(android.view.Gravity.CENTER);
        versionText.setPadding(0, 10, 0, 30);
        
        // Aggiungi tutto al container centrale
        centerContainer.addView(logoText);
        centerContainer.addView(proText);
        centerContainer.addView(subtitleText);
        centerContainer.addView(versionText);
        
        // SEZIONE INFERIORE
        android.widget.LinearLayout bottomContainer = new android.widget.LinearLayout(this);
        bottomContainer.setOrientation(android.widget.LinearLayout.VERTICAL);
        bottomContainer.setGravity(android.view.Gravity.CENTER);
        bottomContainer.setPadding(40, 20, 40, 60);
        
        // TESTO CONNESSIONE
        android.widget.TextView loadingText = new android.widget.TextView(this);
        loadingText.setText("Connessione in corso...");
        loadingText.setTextSize(22);
        loadingText.setTextColor(android.graphics.Color.WHITE);
        loadingText.setGravity(android.view.Gravity.CENTER);
        loadingText.setTypeface(null, android.graphics.Typeface.NORMAL);
        loadingText.setPadding(0, 0, 0, 25);
        
        // STATUS TEXT CON ANIMAZIONE
        android.widget.TextView statusText = new android.widget.TextView(this);
        statusText.setText("Inizializzazione sistema POS...");
        statusText.setTextSize(16);
        statusText.setTextColor(android.graphics.Color.parseColor("#FFCDD2"));
        statusText.setGravity(android.view.Gravity.CENTER);
        statusText.setAlpha(0.8f);
        statusText.setPadding(0, 0, 0, 30);
        
        // ANIMAZIONE TESTO STATUS (sincronizzato con progress bar)
        android.os.Handler statusHandler = new android.os.Handler();
        statusHandler.postDelayed(() -> statusText.setText("Connessione al server..."), 1200);
        statusHandler.postDelayed(() -> statusText.setText("Autenticazione in corso..."), 2500);
        statusHandler.postDelayed(() -> statusText.setText("Configurazione interfaccia..."), 3800);
        statusHandler.postDelayed(() -> statusText.setText("Finalizzazione..."), 5200);
        statusHandler.postDelayed(() -> statusText.setText("Caricamento completato!"), 5800);
        
        // BARRA DI CARICAMENTO PERSONALIZZATA (più visibile)
        android.widget.LinearLayout progressContainer = new android.widget.LinearLayout(this);
        progressContainer.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        progressContainer.setGravity(android.view.Gravity.LEFT);
        progressContainer.setBackgroundColor(android.graphics.Color.parseColor("#666666")); // Sfondo grigio scuro
        progressContainer.setPadding(6, 6, 6, 6);
        
        // BARRA INTERNA COLORATA che si espande
        android.view.View progressFill = new android.view.View(this);
        progressFill.setBackgroundColor(android.graphics.Color.parseColor("#4CAF50")); // Verde
        
        // PARAMETRI INIZIALI (larghezza 0)
        android.widget.LinearLayout.LayoutParams fillParams = new android.widget.LinearLayout.LayoutParams(
            0, 20); // Altezza 20px, larghezza iniziale 0
        progressFill.setLayoutParams(fillParams);
        
        progressContainer.addView(progressFill);
        
        // ANIMAZIONE REALISTICA DELLA BARRA
        android.os.Handler progressHandler = new android.os.Handler();
        int maxWidth = 700; // Larghezza massima della barra
        
        // Animazione step-by-step più visibile
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.15); // 15%
            progressFill.setLayoutParams(fillParams);
        }, 300);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.25); // 25%
            progressFill.setLayoutParams(fillParams);
        }, 800);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.30); // 30%
            progressFill.setLayoutParams(fillParams);
        }, 1200);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.45); // 45%
            progressFill.setLayoutParams(fillParams);
        }, 1800);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.55); // 55%
            progressFill.setLayoutParams(fillParams);
        }, 2500);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.60); // 60%
            progressFill.setLayoutParams(fillParams);
        }, 3200);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.75); // 75%
            progressFill.setLayoutParams(fillParams);
        }, 3800);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.85); // 85%
            progressFill.setLayoutParams(fillParams);
        }, 4500);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = (int)(maxWidth * 0.92); // 92%
            progressFill.setLayoutParams(fillParams);
        }, 5200);
        
        progressHandler.postDelayed(() -> {
            fillParams.width = maxWidth; // 100%
            progressFill.setLayoutParams(fillParams);
            progressFill.setBackgroundColor(android.graphics.Color.parseColor("#2196F3")); // Cambia in blu quando completo
        }, 5800);
        
        // FOOTER
        android.widget.TextView footerText = new android.widget.TextView(this);
        footerText.setText("© 2024 OMNILY - Tutti i diritti riservati");
        footerText.setTextSize(12);
        footerText.setTextColor(android.graphics.Color.parseColor("#FFCDD2"));
        footerText.setGravity(android.view.Gravity.CENTER);
        footerText.setAlpha(0.7f);
        
        // Aggiungi al bottom container
        bottomContainer.addView(loadingText);
        bottomContainer.addView(statusText);
        bottomContainer.addView(progressContainer); // Container con bordo
        bottomContainer.addView(footerText);
        
        // LAYOUT PARAMETERS - CENTRO
        android.widget.RelativeLayout.LayoutParams centerParams = new android.widget.RelativeLayout.LayoutParams(
            android.widget.RelativeLayout.LayoutParams.MATCH_PARENT,
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT);
        centerParams.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
        centerParams.setMargins(80, 0, 80, 0);
        
        // LAYOUT PARAMETERS - BOTTOM
        android.widget.RelativeLayout.LayoutParams bottomParams = new android.widget.RelativeLayout.LayoutParams(
            android.widget.RelativeLayout.LayoutParams.MATCH_PARENT,
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT);
        bottomParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
        
        // PROGRESS CONTAINER PARAMETERS (grande e visibile)
        android.widget.LinearLayout.LayoutParams containerParams = new android.widget.LinearLayout.LayoutParams(
            720, 32); // Larga e alta
        containerParams.gravity = android.view.Gravity.CENTER;
        containerParams.setMargins(0, 15, 0, 25);
        progressContainer.setLayoutParams(containerParams);
        
        // Aggiungi tutto al layout principale
        splashLayout.addView(centerContainer, centerParams);
        splashLayout.addView(bottomContainer, bottomParams);
        
        setContentView(splashLayout); // MOSTRA SPLASH SUBITO
        Log.d(TAG, "Splash screen displayed - masking navigation");
    }
}