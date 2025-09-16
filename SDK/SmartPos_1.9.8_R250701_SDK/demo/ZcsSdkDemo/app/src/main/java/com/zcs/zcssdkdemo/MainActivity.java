package com.zcs.zcssdkdemo;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Fragment;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.MenuItem;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.zcs.sdk.DriverManager;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Sys;

public class MainActivity extends AppCompatActivity {

    private ActionBar actionBar;

    private DriverManager mDriverManager;
    private Sys mSys;

    @SuppressLint("NewApi")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setTitle(getString(R.string.demo_title));
        }
        // OMNILY POS WebView Integration
        android.webkit.WebView webView = new android.webkit.WebView(this);
        android.webkit.WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        
        // Add OMNILY JavaScript Bridge
        webView.addJavascriptInterface(new OmnilyBridge(this), "OmnilyPOS");
        
        webView.setWebViewClient(new android.webkit.WebViewClient() {
            @Override
            public void onPageFinished(android.webkit.WebView view, String url) {
                super.onPageFinished(view, url);
                // Inject ZCS bridge
                webView.evaluateJavascript("window.ZCSNativeBridge = { available: true, print: function(data) { return OmnilyPOS.printReceipt(data); } };", null);
            }
        });
        
        setContentView(webView);
        webView.loadUrl("http://192.168.1.184:3000/?pos=true");

        mDriverManager = DriverManager.getInstance();
        mSys = mDriverManager.getBaseSysDevice();
        initSdk();

        //requset sdcard permission for emv function
        requestNeededPermission();
    }
    
    private void initSdk() {
        int status = mSys.sdkInit();
        if(status != SdkResult.SDK_OK) {
            mSys.sysPowerOn();
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            status = mSys.sdkInit();
        }
        if(status != SdkResult.SDK_OK) {
            //init failed.
        }
        mSys.showDetailLog(true);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        if (getFragmentManager().getBackStackEntryCount() <= 1) {
            if (actionBar != null) {
                actionBar.setTitle(getString(R.string.demo_title));
                actionBar.setDisplayHomeAsUpEnabled(false);
            }
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            this.onBackPressed();
        }
        return super.onOptionsItemSelected(item);
    }

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
        if (requestCode == REQUEST_CODE) {
            boolean allPermissionsGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allPermissionsGranted = false;
                    break;
                }
            }
            if (!allPermissionsGranted) {
                Toast.makeText(MainActivity.this, "Some function may not use without permissions", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
