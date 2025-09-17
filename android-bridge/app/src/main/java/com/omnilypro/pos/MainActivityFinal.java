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
        
        initZcsSDK();
        requestNeededPermission();
        setupWebView();
        setupCustomerDisplay();
        
        // Load POS interface
        webView.loadUrl("https://omnilypro.vercel.app/?pos=true");
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
                injectPOSOptimizations();
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
        setContentView(webView);
    }
    
    private void injectPOSOptimizations() {
        android.util.DisplayMetrics metrics = new android.util.DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);
        int screenWidth = metrics.widthPixels;
        
        String css = 
            "* { box-sizing: border-box !important; } " +
            "body { margin: 0 !important; padding: 2px !important; font-size: 11px !important; } " +
            ".container, .container-fluid { max-width: " + (screenWidth - 8) + "px !important; margin: 0 auto !important; } " +
            ".sidebar, .side-nav, .navigation, .nav-sidebar { " +
            "  display: block !important; visibility: visible !important; opacity: 1 !important; " +
            "  position: fixed !important; left: 0 !important; width: 150px !important; " +
            "  height: 100vh !important; background: #f8f9fa !important; z-index: 1000 !important; font-size: 10px !important; " +
            "} " +
            ".main-content, .content { margin-left: 150px !important; padding: 4px !important; } " +
            "input, button, select { font-size: 12px !important; padding: 4px 6px !important; } " +
            ".btn { padding: 4px 8px !important; font-size: 11px !important; } " +
            ".table { font-size: 10px !important; } " +
            ".table th, .table td { padding: 2px 4px !important; }";
        
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
            
            // Carica la versione cliente della pagina
            customerWebView.loadUrl("https://omnilypro.vercel.app/pos");
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