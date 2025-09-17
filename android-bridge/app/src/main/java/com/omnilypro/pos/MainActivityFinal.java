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
import android.widget.TextView;
import android.widget.ProgressBar;
import android.widget.LinearLayout;
import android.widget.ImageView;
import android.view.Gravity;
import android.view.View;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;

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
        
        // Mostra la splash screen come prima cosa
        showSplashScreen();

        initZcsSDK();
        requestNeededPermission();
        setupWebView();
        setupCustomerDisplay();

        // Carica l'URL dopo aver configurato tutto
        webView.loadUrl("https://omnilypro.vercel.app/");
        Log.d(TAG, "Loading homepage, will redirect to login via JavaScript");

        // Timer per rimuovere la splash screen e mostrare la WebView
        new android.os.Handler().postDelayed(() -> {
            Log.d(TAG, "Splash timer completed - showing WebView");
            runOnUiThread(() -> {
                setContentView(webView);
                Log.d(TAG, "WebView displayed after splash - should be on login form");
            });
        }, 8000);
    }

    private void showSplashScreen() {
        LinearLayout splashLayout = new LinearLayout(this);
        splashLayout.setOrientation(LinearLayout.VERTICAL);
        splashLayout.setGravity(Gravity.CENTER);
        splashLayout.setBackgroundColor(Color.parseColor("#c0392b"));
        splashLayout.setPadding(60, 60, 60, 60);

        TextView logoText = new TextView(this);
        logoText.setText("OMNILY");
        logoText.setTextSize(48);
        logoText.setTextColor(Color.WHITE);
        logoText.setTypeface(null, android.graphics.Typeface.BOLD);
        logoText.setGravity(Gravity.CENTER);

        TextView subtitle = new TextView(this);
        subtitle.setText("POS System");
        subtitle.setTextSize(16);
        subtitle.setTextColor(Color.parseColor("#bdc3c7"));
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 0, 0, 40);

        ProgressBar progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(true);
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(600, 12);
        progressParams.setMargins(0, 20, 0, 20);
        progressBar.setLayoutParams(progressParams);

        TextView loadingText = new TextView(this);
        loadingText.setText("Connessione in corso...");
        loadingText.setTextSize(14);
        loadingText.setTextColor(Color.parseColor("#95a5a6"));
        loadingText.setGravity(Gravity.CENTER);

        splashLayout.addView(logoText);
        splashLayout.addView(subtitle);
        splashLayout.addView(progressBar);
        splashLayout.addView(loadingText);

        setContentView(splashLayout);
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        webView = new WebView(this);
        WebSettings webSettings = webView.getSettings();

        // Impostazioni base
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);

        // Aggiungi un token custom allo User-Agent
        String userAgent = webSettings.getUserAgentString();
        if (!userAgent.contains("OMNILY-POS-APP")) {
            userAgent += " OMNILY-POS-APP";
        }
        webSettings.setUserAgentString(userAgent);
        Log.d(TAG, "User-Agent impostato a: " + userAgent);

        // Bridge per la comunicazione tra Android e JavaScript
        webView.addJavascriptInterface(new OmnilyPOSBridge(), "OmnilyPOS");

        // Client per la gestione degli eventi della WebView
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page finished loading: " + url);

                // Se siamo sulla homepage, inietta lo script per cliccare il login
                if (url.equals("https://omnilypro.vercel.app/")) {
                    Log.d(TAG, "Homepage loaded, injecting script to click login button.");
                    String script = "setTimeout(() => { " +
                                    "  console.log('Searching for login button...'); " +
                                    "  const buttons = document.querySelectorAll('button, a, [role=\"button\"]'); " +
                                    "  let found = false; " +
                                    "  for (const btn of buttons) { " +
                                    "    const text = btn.textContent.toLowerCase(); " +
                                    "    if (text.includes('login') || text.includes('accedi')) { " +
                                    "      console.log('Login button found, clicking:', btn.outerHTML); " +
                                    "      btn.click(); " +
                                    "      found = true; " +
                                    "      break; " +
                                    "    } " +
                                    "  } " +
                                    "  if (!found) { console.log('Login button not found.'); } " +
                                    "}, 2000);";
                    view.evaluateJavascript(script, null);
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
            if (displayManager == null) {
                Log.w(TAG, "DisplayManager not available");
                return;
            }

            Display[] displays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION);

            if (displays != null && displays.length > 0) {
                Display customerDisplay = displays[displays.length - 1];
                if (customerDisplay != null) {
                    customerPresentation = new CustomerPresentation(this, customerDisplay);
                    customerPresentation.show();
                    Log.d(TAG, "Customer display initialized on: " + customerDisplay.getName());
                }
            }
            else {
                Log.w(TAG, "No secondary display found for customer");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting up customer display: " + e.getMessage(), e);
        }
    }
    
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
            
            customerWebView.loadUrl("https://omnilypro.vercel.app/");
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
}