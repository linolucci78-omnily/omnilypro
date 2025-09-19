package com.zcs.zcssdkdemo;

import android.util.Log;
import android.webkit.JavascriptInterface;
import org.json.JSONObject;
import com.zcs.sdk.DriverManager;
import com.zcs.sdk.Printer;
import com.zcs.sdk.print.PrnStrFormat;
import com.zcs.sdk.card.RfCard;

public class OmnilyBridge {
    
    private static final String TAG = "OmnilyBridge";
    private MainActivity activity;
    
    public OmnilyBridge(MainActivity activity) {
        this.activity = activity;
    }
    
    @JavascriptInterface
    public String printReceipt(String receiptData) {
        Log.d(TAG, "🖨️ PRINTING RECEIPT: " + receiptData);
        
        try {
            JSONObject data = new JSONObject(receiptData);
            String content = data.getString("content");
            
            // Use ZCS SDK directly - we know it's initialized in MainActivity
            DriverManager driverManager = DriverManager.getInstance();
            Printer printer = driverManager.getPrinter();
            
            // Print with real ZCS SDK
            printer.setPrintAppendString("=== OMNILY POS ===\n", null);
            printer.setPrintAppendString(content + "\n", null);
            printer.setPrintAppendString("==================\n", null);
            printer.setPrintAppendString("Grazie per il tuo acquisto!\n", null);
            
            int printResult = printer.setPrintStart();
            
            if (printResult == 0) {
                // Cut paper to complete print
                printer.setPrintCutPaper();
                Log.d(TAG, "✅ REAL PRINT SUCCESSFUL!");
                
                return new JSONObject()
                    .put("success", true)
                    .put("message", "🎉 STAMPA REALE COMPLETATA!")
                    .put("timestamp", System.currentTimeMillis())
                    .toString();
            } else {
                Log.e(TAG, "❌ Print failed with result: " + printResult);
                return new JSONObject()
                    .put("success", false)
                    .put("error", "Print failed: " + printResult)
                    .toString();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Print error: " + e.getMessage(), e);
            try {
                return new JSONObject()
                    .put("success", false)
                    .put("error", e.getMessage())
                    .toString();
            } catch (Exception ex) {
                return "{\"success\":false,\"error\":\"Unknown error\"}";
            }
        }
    }
    
    @JavascriptInterface
    public String readNFCCard() {
        Log.d(TAG, "🔥 NFC READ - Using ZCS SDK diretto");

        try {
            DriverManager driverManager = DriverManager.getInstance();
            RfCard rfCard = driverManager.getRfCard();

            if (rfCard == null) {
                Log.e(TAG, "❌ RfCard è null!");
                return new JSONObject()
                    .put("success", false)
                    .put("error", "NFC hardware non disponibile")
                    .toString();
            }

            Log.d(TAG, "✅ RfCard inizializzato, cerco carta...");

            // Provo direttamente senza timeout o con timeout lungo
            byte[] cardData = rfCard.searchCard();

            if (cardData != null && cardData.length > 0) {
                String cardUid = bytesToHex(cardData);
                Log.d(TAG, "🎉 CARTA NFC TROVATA! UID: " + cardUid);

                return new JSONObject()
                    .put("success", true)
                    .put("cardNo", cardUid)
                    .put("rfUid", cardUid)
                    .put("cardType", "NFC_CARD")
                    .put("timestamp", System.currentTimeMillis())
                    .toString();
            } else {
                Log.w(TAG, "⚠️ Nessuna carta NFC rilevata");
                return new JSONObject()
                    .put("success", false)
                    .put("error", "No NFC card detected")
                    .toString();
            }

        } catch (Exception e) {
            Log.e(TAG, "❌ Errore NFC: " + e.getMessage(), e);
            try {
                return new JSONObject()
                    .put("success", false)
                    .put("error", e.getMessage())
                    .toString();
            } catch (Exception ex) {
                return "{\"success\":false,\"error\":\"Unknown error\"}";
            }
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02X", b));
        }
        return result.toString();
    }
    
    @JavascriptInterface
    public String scanQRCode() {
        Log.d(TAG, "📷 Scanning QR code...");
        try {
            return new JSONObject()
                .put("success", true)
                .put("qrData", "https://omnilypro.app/customer/12345")
                .put("format", "QR_CODE")
                .put("timestamp", System.currentTimeMillis())
                .toString();
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"QR scan error\"}";
        }
    }
}