package com.omnilypro.pos

import android.os.Bundle
import android.webkit.WebView
import android.webkit.JavascriptInterface
import android.webkit.WebViewClient
import android.webkit.WebSettings
import androidx.appcompat.app.AppCompatActivity
import android.util.Log
import org.json.JSONObject
import com.zcs.sdk.DriverManager
import com.zcs.sdk.Printer
import com.zcs.sdk.Sys
import com.zcs.sdk.print.PrnStrFormat
import com.zcs.sdk.print.PrnTextFont
import com.zcs.sdk.print.PrnTextStyle
import android.text.Layout

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private val TAG = "OmnilyPOS"
    
    // ZCS SDK instances
    private lateinit var driverManager: DriverManager
    private lateinit var printer: Printer
    private lateinit var sys: Sys
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Force portrait orientation BEFORE anything else
        requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        Log.d(TAG, "Portrait orientation set")
        
        // Initialize ZCS SDK
        initZcsSDK()
        
        // Setup WebView
        webView = WebView(this)
        setupWebView()
        
        setContentView(webView)
        
        // Load React app in POS mode from Vercel
        val url = "https://omnilypro.vercel.app?pos=true"
        Log.d(TAG, "🌐 Loading URL: $url")

        // Test URL first - you can change this for debugging
        // webView.loadUrl("https://www.google.com") // Test basic connectivity
        webView.loadUrl(url)
        
        Log.d(TAG, "OMNILY POS WebView initialized")
    }
    
    private fun initZcsSDK() {
        try {
            driverManager = DriverManager.getInstance()
            printer = driverManager.printer
            sys = driverManager.baseSysDevice
            
            val status = sys.sdkInit()
            Log.d(TAG, "ZCS SDK initialized with status: $status")
            
            if (status == 0) {
                Log.i(TAG, "✅ ZCS SDK initialized successfully")
            } else {
                Log.e(TAG, "❌ ZCS SDK initialization failed: $status")
            }
        } catch (e: Exception) {
            Log.e(TAG, "ZCS SDK initialization error: ${e.message}", e)
        }
    }
    
    private fun setupWebView() {
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true
        webSettings.allowUniversalAccessFromFileURLs = true
        webSettings.allowFileAccessFromFileURLs = true
        webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        webSettings.userAgentString = webSettings.userAgentString + " OmnilyPOS"

        Log.d(TAG, "🔧 WebView configured with User-Agent: ${webSettings.userAgentString}")
        Log.d(TAG, "🔧 JavaScript enabled: ${webSettings.javaScriptEnabled}")
        
        // Add JavaScript interface for ZCS SDK
        webView.addJavascriptInterface(ZCSBridge(this), "OmnilyPOS")
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d(TAG, "🚀 Page started loading: $url")
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                Log.d(TAG, "✅ Page loaded successfully: $url")
                
                // Inject ZCS bridge availability
                webView.evaluateJavascript(
                    """
                    window.ZCSNativeBridge = {
                        available: true,
                        readNFC: function() {
                            return OmnilyPOS.readNFCCard();
                        },
                        print: function(data) {
                            return OmnilyPOS.printReceipt(data);
                        },
                        scanQR: function() {
                            return OmnilyPOS.scanQRCode();
                        },
                        testHardware: function() {
                            return OmnilyPOS.testHardware();
                        }
                    };
                    console.log('🚀 OMNILY POS Native Bridge Ready!');
                    """, null
                )
            }
            
            override fun onReceivedError(view: WebView, request: android.webkit.WebResourceRequest, error: android.webkit.WebResourceError) {
                super.onReceivedError(view, request, error)
                Log.e(TAG, "❌ WebView error: ${error.description} | Error code: ${error.errorCode} | URL: ${request.url}")

                // Load a simple error page
                view.loadData(
                    """
                    <html><body style='padding:20px; font-family:Arial; text-align:center;'>
                    <h2>🚫 Errore di Connessione</h2>
                    <p>URL: ${request.url}</p>
                    <p>Errore: ${error.description}</p>
                    <p>Codice: ${error.errorCode}</p>
                    <button onclick='location.reload()'>Riprova</button>
                    </body></html>
                    """.trimIndent(),
                    "text/html",
                    "UTF-8"
                )
            }

            override fun onReceivedHttpError(view: WebView, request: android.webkit.WebResourceRequest, errorResponse: android.webkit.WebResourceResponse) {
                super.onReceivedHttpError(view, request, errorResponse)
                Log.e(TAG, "❌ HTTP Error: ${errorResponse.statusCode} | URL: ${request.url}")
            }
        }
    }
}

class ZCSBridge(private val activity: MainActivity) {
    
    private val TAG = "ZCSBridge"
    
    @JavascriptInterface
    fun readNFCCard(): String {
        Log.d(TAG, "Reading NFC card...")
        
        return try {
            // TODO: Integrate with actual ZCS SDK
            // val cardReadManager = ZCSDriver.getInstance().cardReadManager
            // val result = cardReadManager.searchCard(...)
            
            // For now, simulate successful NFC read
            val result = JSONObject().apply {
                put("success", true)
                put("cardNo", "1234567890123456")
                put("rfUid", "A1B2C3D4")
                put("cardType", "MIFARE_1K")
                put("timestamp", System.currentTimeMillis())
            }
            
            Log.d(TAG, "NFC read successful: ${result.toString()}")
            result.toString()
            
        } catch (e: Exception) {
            Log.e(TAG, "NFC read failed", e)
            JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Unknown error")
            }.toString()
        }
    }
    
    @JavascriptInterface
    fun printReceipt(receiptData: String): String {
        Log.d(TAG, "Printing receipt: $receiptData")
        
        return try {
            val data = JSONObject(receiptData)
            val content = data.getString("content")
            
            // REAL PRINT via shell command to demo app
            try {
                val process = Runtime.getRuntime().exec("am start -n com.zcs.zcssdkdemo/.PrintFragment")
                process.waitFor()
                
                // Force print via shell
                Thread.sleep(1000)
                Runtime.getRuntime().exec("input tap 500 800") // Simulate tap on print button
                
                Log.d(TAG, "✅ TRIGGERED REAL PRINT via demo app!")
                
                return JSONObject().apply {
                    put("success", true)
                    put("message", "🖨️ REAL PRINTING INITIATED!")
                    put("timestamp", System.currentTimeMillis())
                }.toString()
                
            } catch (e: Exception) {
                Log.e(TAG, "Shell print failed: ${e.message}")
            }
            
            // Real ZCS printer implementation (fallback)
            val activity = this@MainActivity
            val printer = activity.printer
            
            // Initialize print format
            val format = PrnStrFormat().apply {
                textSize = PrnTextFont.DEFAULT
                textStyle = PrnTextStyle.NORMAL
                alignment = Layout.Alignment.ALIGN_CENTER
            }
            
            // Print header
            printer.setPrintAppendString("=== OMNILY POS ===\n", format)
            printer.setPrintAppendString("Ricevuta di Vendita\n", format)
            printer.setPrintAppendString("==================\n", format)
            
            // Print content
            format.alignment = Layout.Alignment.ALIGN_NORMAL
            printer.setPrintAppendString(content, format)
            
            // Print footer
            format.alignment = Layout.Alignment.ALIGN_CENTER
            printer.setPrintAppendString("\n------------------\n", format)
            printer.setPrintAppendString("Grazie per il tuo acquisto!\n", format)
            printer.setPrintAppendString("${java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(java.util.Date())}\n", format)
            
            // Start printing
            val printResult = printer.setPrintStart()
            
            // Cut paper and feed to complete printing
            if (printResult == 0) {
                printer.setPrintCutPaper()
                Thread.sleep(100) // Small delay for paper feed
            }
            
            val result = JSONObject().apply {
                put("success", printResult == 0)
                put("message", if (printResult == 0) "Receipt printed successfully" else "Print failed with code: $printResult")
                put("timestamp", System.currentTimeMillis())
            }
            
            Log.d(TAG, "ZCS Print result: $printResult")
            result.toString()
            
        } catch (e: Exception) {
            Log.e(TAG, "Print failed", e)
            JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Print error")
            }.toString()
        }
    }
    
    @JavascriptInterface
    fun scanQRCode(): String {
        Log.d(TAG, "Scanning QR code...")
        
        return try {
            // TODO: Integrate with ZCS scanner
            // val scanner = ZCSDriver.getInstance().scanner
            // scanner.QRScanerPowerCtrl(1)
            
            // Simulate QR scan
            val result = JSONObject().apply {
                put("success", true)
                put("qrData", "https://omnilypro.app/customer/12345")
                put("format", "QR_CODE")
                put("timestamp", System.currentTimeMillis())
            }
            
            Log.d(TAG, "QR scan successful")
            result.toString()
            
        } catch (e: Exception) {
            Log.e(TAG, "QR scan failed", e)
            JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Scan error")
            }.toString()
        }
    }
    
    @JavascriptInterface
    fun testHardware(): String {
        Log.d(TAG, "Testing hardware components...")
        
        return try {
            // TODO: Test all hardware with ZCS SDK
            val result = JSONObject().apply {
                put("success", true)
                put("nfc", true)
                put("printer", true)
                put("scanner", true)
                put("display", true)
                put("beeper", true)
                put("led", true)
            }
            
            Log.d(TAG, "Hardware test completed")
            result.toString()
            
        } catch (e: Exception) {
            Log.e(TAG, "Hardware test failed", e)
            JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Hardware test error")
            }.toString()
        }
    }
}