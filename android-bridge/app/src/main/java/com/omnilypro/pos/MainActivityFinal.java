package com.omnilypro.pos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Presentation;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.hardware.display.DisplayManager;
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

import com.zcs.sdk.DriverManager;
import com.zcs.sdk.SdkData;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Sys;
import com.zcs.sdk.card.CardInfoEntity;
import com.zcs.sdk.card.CardReaderManager;
import com.zcs.sdk.card.CardReaderTypeEnum;
import com.zcs.sdk.listener.OnSearchCardListener;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;

public class MainActivityFinal extends AppCompatActivity {

    private static final String TAG = "OmnilyPOS";

    private DriverManager mDriverManager;
    private Sys mSys;
    private ExecutorService mExecutor;
    private CardReaderManager mCardReadManager;
    private WebView webView;
    private Presentation customerPresentation;

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
        initZcsSDK();
        setupWebView();
        setupCustomerDisplay();
        loadInitialUrl();
    }

    private void loadInitialUrl() {
        String url = "https://omnilypro.vercel.app/?posomnily=true&v=" + System.currentTimeMillis();
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
                Toast.makeText(this, "Attenzione: permessi negati. L'app potrebbe non funzionare correttamente.", Toast.LENGTH_LONG).show();
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
                    Log.d(TAG, "ZCS SDK initialized successfully.");
                }
                else {
                    Log.e(TAG, "ZCS SDK init failed, status: " + status);
                }
            }
            catch (Exception e) {
                Log.e(TAG, "SDK init error: " + e.getMessage(), e);
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        webView = new WebView(this);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        webView.addJavascriptInterface(new OmnilyPOSBridge(), "OmnilyPOS");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page finished loading: " + url);
                setContentView(webView);
            }
        });
    }

    public class OmnilyPOSBridge {
        private volatile boolean isNFCReading = false;

        @JavascriptInterface
        public void readNFCCard(String callbackName) {
            if (mCardReadManager == null) {
                Log.e(TAG, "CardReaderManager not initialized.");
                return;
            }
            if (isNFCReading) {
                Log.w(TAG, "NFC reading already in progress.");
                return;
            }
            isNFCReading = true;
            Log.d(TAG, "Executing searchCard on background thread...");

            mExecutor.submit(() -> {
                try {
                    OnSearchCardListener listener = new OnSearchCardListener() {
                        @Override
                        public void onCardInfo(CardInfoEntity cardInfoEntity) {
                            if (!isNFCReading) return;
                            isNFCReading = false;
                            try {
                                String cardUid = bytesToHex(cardInfoEntity.getRFuid());
                                Log.d(TAG, "SUCCESS: Card Found! UID: " + cardUid);
                                JSONObject result = new JSONObject();
                                result.put("success", true);
                                result.put("uid", cardUid);
                                runJsCallback(callbackName, result.toString());
                            }
                            catch (Exception e) {
                                Log.e(TAG, "onCardInfo JSON failed", e);
                                onError(-1); // Generic error
                            }
                        }

                        @Override
                        public void onError(int errorCode) {
                            if (!isNFCReading) return;
                            isNFCReading = false;
                            Log.e(TAG, "ERROR: NFC Read Error Code: " + errorCode);
                            try {
                                JSONObject result = new JSONObject();
                                result.put("success", false);
                                result.put("error", "Errore Lettore SDK: " + errorCode);
                                runJsCallback(callbackName, result.toString());
                            }
                            catch (Exception ignored) {}
                        }

                        @Override
                        public void onNoCard(CardReaderTypeEnum cardReaderTypeEnum, boolean b) {
                            if (!isNFCReading) return;
                            isNFCReading = false;
                            Log.w(TAG, "TIMEOUT: No card detected.");
                            onError(-2); // Timeout Error
                        }
                    };
                    
                    mCardReadManager.cancelSearchCard();
                    byte cardType = (byte) (SdkData.RF_TYPE_A | SdkData.RF_TYPE_B);
                    mCardReadManager.searchCard(CardReaderTypeEnum.RF_CARD, 30, cardType, listener);
                    Log.d(TAG, "searchCard call sent. Waiting for card...");

                }
                catch (Exception e) {
                    isNFCReading = false;
                    Log.e(TAG, "Exception in searchCard thread: " + e.getMessage(), e);
                }
            });
        }

        private void runJsCallback(final String callbackName, final String result) {
            if (callbackName != null && !callbackName.isEmpty()) {
                runOnUiThread(() -> webView.evaluateJavascript(String.format("window.%s(%s)", callbackName, result), null));
            }
        }

        private String bytesToHex(byte[] bytes) {
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
        }
        else {
            super.onBackPressed();
        }
    }

    private void setupCustomerDisplay() {
        // Implementation for customer display can be added here
    }

    private void showSplashScreen() {
        android.widget.LinearLayout splashLayout = new android.widget.LinearLayout(this);
        splashLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
        splashLayout.setGravity(android.view.Gravity.CENTER);
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#D32F2F"));
        setContentView(splashLayout);
    }
    private void autoClickLogin(WebView webView) {}
}