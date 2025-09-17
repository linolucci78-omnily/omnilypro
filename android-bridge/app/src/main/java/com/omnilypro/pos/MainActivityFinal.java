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

import org.json.JSONObject;

public class MainActivityFinal extends AppCompatActivity {

    private static final String TAG = "OmnilyPOS";
    
    private DriverManager mDriverManager;
    private Sys mSys;
    private Printer mPrinter;
    private WebView webView;
    private Presentation customerPresentation;
    
    private static final int REQUEST_CODE = 1;
    private String[] permissions = {
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION
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
        
        // CARICA HOMEPAGE MA MANTIENI INVISIBILE - SPLASH MASCHERA TUTTO
        webView.loadUrl("https://omnilypro.vercel.app/?posomnily=true");
        Log.d(TAG, "Loading homepage INVISIBLY - splash will hide navigation");
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
        
        webView.addJavascriptInterface(new OmnilyPOSBridge(), "OmnilyPOS");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page loaded: " + url);
                
                // APPLICA CSS POS SU OGNI PAGINA!
                injectPOSCSS();
                
                // Se siamo sulla homepage, auto-click Login
                if (url.contains("omnilypro.vercel.app") && !url.contains("/login")) {
                    Log.d(TAG, "Homepage detected, auto-clicking Login button...");
                    autoClickLogin(view);
                } else if (url.contains("/login")) {
                    // Se siamo su login, mostra WebView dopo 2 secondi
                    Log.d(TAG, "LOGIN PAGE detected!");
                    new android.os.Handler().postDelayed(() -> {
                        setContentView(webView);
                        Log.d(TAG, "Login page ready - showing WebView!");
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
                    Log.d(TAG, "ZCS SDK initialized successfully");
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
        public void showToast(String message) {
            runOnUiThread(() -> {
                Toast.makeText(MainActivityFinal.this, message, Toast.LENGTH_SHORT).show();
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
                Toast.makeText(this, "Some functions may not work without permissions", Toast.LENGTH_LONG).show();
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
            
            customerWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    Log.d(TAG, "Customer display page loaded: " + url);
                    injectCustomerCSS();
                }
            });
            
            // Carica l'interfaccia POS per il display cliente con posomnily
            customerWebView.loadUrl("https://omnilypro.vercel.app/?posomnily=true");
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
        // SPLASH SCREEN PROFESSIONALE OMNILY
        android.widget.RelativeLayout splashLayout = new android.widget.RelativeLayout(this);
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#D32F2F")); // Rosso OMNILY
        
        // LOGO OMNILY
        android.widget.TextView logoText = new android.widget.TextView(this);
        logoText.setText("OMNILY");
        logoText.setTextSize(48);
        logoText.setTextColor(android.graphics.Color.WHITE);
        logoText.setTypeface(null, android.graphics.Typeface.BOLD);
        logoText.setGravity(android.view.Gravity.CENTER);
        
        // PRO TEXT
        android.widget.TextView proText = new android.widget.TextView(this);
        proText.setText("PRO");
        proText.setTextSize(24);
        proText.setTextColor(android.graphics.Color.WHITE);
        proText.setGravity(android.view.Gravity.CENTER);
        
        // LOADING TEXT
        android.widget.TextView loadingText = new android.widget.TextView(this);
        loadingText.setText("Caricamento...");
        loadingText.setTextSize(18);
        loadingText.setTextColor(android.graphics.Color.WHITE);
        loadingText.setGravity(android.view.Gravity.CENTER);
        
        // PROGRESS BAR
        android.widget.ProgressBar progressBar = new android.widget.ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(true);
        
        // LAYOUT PARAMETERS
        android.widget.RelativeLayout.LayoutParams logoParams = new android.widget.RelativeLayout.LayoutParams(
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT);
        logoParams.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
        logoParams.setMargins(0, -100, 0, 0);
        
        android.widget.RelativeLayout.LayoutParams proParams = new android.widget.RelativeLayout.LayoutParams(
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT);
        proParams.addRule(android.widget.RelativeLayout.CENTER_HORIZONTAL);
        proParams.addRule(android.widget.RelativeLayout.BELOW, logoText.hashCode());
        
        android.widget.RelativeLayout.LayoutParams loadingParams = new android.widget.RelativeLayout.LayoutParams(
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,
            android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT);
        loadingParams.addRule(android.widget.RelativeLayout.CENTER_HORIZONTAL);
        loadingParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
        loadingParams.setMargins(0, 0, 0, 150);
        
        android.widget.RelativeLayout.LayoutParams progressParams = new android.widget.RelativeLayout.LayoutParams(
            600, android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT);
        progressParams.addRule(android.widget.RelativeLayout.CENTER_HORIZONTAL);
        progressParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
        progressParams.setMargins(0, 0, 0, 100);
        
        logoText.setId(logoText.hashCode());
        splashLayout.addView(logoText, logoParams);
        splashLayout.addView(proText, proParams);
        splashLayout.addView(loadingText, loadingParams);
        splashLayout.addView(progressBar, progressParams);
        
        setContentView(splashLayout); // MOSTRA SPLASH SUBITO
        Log.d(TAG, "Splash screen displayed - masking navigation");
    }
}