# Integrazione MDM - Android Bridge App

Questa guida spiega come configurare e utilizzare l'integrazione MDM (Mobile Device Management) nell'app Android Bridge.

## 📋 Cosa è Stato Implementato

### Componenti Creati

1. **MdmConfig.java** - Configurazione centrale
   - URL Supabase e chiavi API
   - Intervalli polling e heartbeat
   - Costanti comandi e status

2. **SupabaseClient.java** - Client HTTP per API
   - Update device status
   - Get pending commands
   - Update command status
   - Register device
   - Log activities

3. **HeartbeatWorker.java** - Background worker
   - Invia stato dispositivo ogni 30 secondi
   - Raccoglie: batteria, WiFi, storage, model
   - Usa WorkManager per affidabilità

4. **CommandPollingWorker.java** - Background worker
   - Controlla comandi pending ogni 60 secondi
   - Esegue comandi dal backend
   - Aggiorna status comandi

5. **MdmManager.java** - Orchestrator principale
   - Registrazione dispositivo
   - Inizializzazione workers
   - Gestione lifecycle

## 🔧 Configurazione

### 1. Configura Credenziali Supabase

Modifica `MdmConfig.java` linee 9-10:

```java
public static final String SUPABASE_URL = "https://your-project.supabase.co";
public static final String SUPABASE_ANON_KEY = "your-anon-key-here";
```

**Come ottenere le credenziali**:
1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Settings → API
4. Copia:
   - **Project URL** → SUPABASE_URL
   - **anon public** key → SUPABASE_ANON_KEY

### 2. Integra in MainActivity

Aggiungi nel metodo `onCreate()` di `MainActivityFinal.java`:

```java
import com.omnilypro.pos.mdm.MdmManager;

@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // ... existing code ...

    // Inizializza MDM
    MdmManager.getInstance(this).initialize();

    Log.i(TAG, "MDM System initialized");
}
```

### 3. Opzionale: Aggiungi Listener per Comandi

Per reagire ai comandi MDM, aggiungi un BroadcastReceiver in MainActivity:

```java
private BroadcastReceiver mdmCommandReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if ("com.omnilypro.pos.KIOSK_MODE".equals(action)) {
            boolean enabled = intent.getBooleanExtra("enabled", false);
            if (enabled) {
                enableKioskMode();
            } else {
                disableKioskMode();
            }
        } else if ("com.omnilypro.pos.SYNC_CONFIG".equals(action)) {
            syncConfiguration();
        }
    }
};

@Override
protected void onResume() {
    super.onResume();

    IntentFilter filter = new IntentFilter();
    filter.addAction("com.omnilypro.pos.KIOSK_MODE");
    filter.addAction("com.omnilypro.pos.SYNC_CONFIG");
    registerReceiver(mdmCommandReceiver, filter);
}

@Override
protected void onPause() {
    super.onPause();
    unregisterReceiver(mdmCommandReceiver);
}
```

## 🚀 Build e Installazione

### 1. Sync Gradle

In Android Studio:
- File → Sync Project with Gradle Files
- Attendere download dipendenze (OkHttp, Gson, WorkManager)

### 2. Build APK

```bash
cd /Users/pasqualelucci/Desktop/omnilypro/android-bridge
./gradlew assembleDebug
```

APK sarà in: `app/build/outputs/apk/debug/app-debug.apk`

### 3. Installa su Dispositivo

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 🧪 Testing

### Test Manuale

1. **Verifica Heartbeat**:
   - Apri app sul dispositivo
   - Vai su Supabase Dashboard → Table Editor → devices
   - Refresh ogni 30 secondi
   - Verifica che `last_seen` si aggiorna
   - Verifica `battery_level`, `wifi_ssid`, `storage_free_gb`

2. **Test Comando Reboot**:
   - Dashboard MDM → Tab "Dispositivi"
   - Seleziona dispositivo
   - Click "Riavvia"
   - Dispositivo dovrebbe riavviarsi (se ha permessi REBOOT)

3. **Test Command Polling**:
   - Dashboard MDM → Tab "Scheduler"
   - Programma comando per dispositivo
   - Attendi max 60 secondi
   - Verifica esecuzione su dispositivo

### Logs

Filtra log MDM con logcat:

```bash
adb logcat | grep -E "MdmManager|HeartbeatWorker|CommandPollingWorker|SupabaseClient"
```

Dovresti vedere:
```
MdmManager: Initializing MDM system...
MdmManager: Starting background workers...
HeartbeatWorker: Heartbeat sent successfully
CommandPollingWorker: Polling commands...
```

## 📊 Comandi Supportati

### Comandi Base (Implementati)

| Comando | Descrizione | Requisiti |
|---------|-------------|-----------|
| `reboot` | Riavvia dispositivo | Permesso REBOOT o system app |
| `shutdown` | Spegne dispositivo | Permesso REBOOT o system app |
| `kiosk_on` | Attiva modalità kiosk | Broadcast a MainActivity |
| `kiosk_off` | Disattiva modalità kiosk | Broadcast a MainActivity |
| `sync_config` | Sincronizza configurazioni | Broadcast a MainActivity |
| `locate` | Invia posizione GPS | TODO: implementare |

### Comandi Avanzati (TODO)

| Comando | Descrizione | Status |
|---------|-------------|--------|
| `update_app` | Installa/aggiorna APK | ⚠️ Richiede implementazione download |
| `clear_cache` | Pulisci cache app | TODO |
| `reset_wifi` | Reset configurazione WiFi | TODO |
| `take_screenshot` | Cattura screenshot | TODO |

## ⚠️ Limitazioni e Note

### Permessi Richiesti

Alcuni comandi richiedono permessi system-level:

1. **REBOOT** (reboot/shutdown):
   - Richiede: App system o device owner
   - Firma APK con chiave di sistema
   - Oppure installa come system app

2. **INSTALL_PACKAGES** (update_app):
   - Richiede: Conferma utente o system privileges
   - Silent install solo con system app

### WorkManager Intervalli

⚠️ Android limita PeriodicWorkRequest a **minimo 15 minuti**.

Per development/testing:
- Usare OneTimeWorkRequest ripetuti
- Oppure foreground service (battery drain)

Attualmente impostato:
- Heartbeat: 30 secondi (⚠️ cambierà a 15min in produzione)
- Command Polling: 1 minuto (⚠️ cambierà a 15min in produzione)

### Produzione vs Development

**Development**:
```java
// MdmConfig.java
public static final long HEARTBEAT_INTERVAL_MS = 30000; // 30s
public static final long COMMAND_POLL_INTERVAL_MS = 60000; // 60s
```

**Produzione** (raccomandato):
```java
public static final long HEARTBEAT_INTERVAL_MS = 900000; // 15min
public static final long COMMAND_POLL_INTERVAL_MS = 900000; // 15min
```

## 🐛 Troubleshooting

### Problema: Heartbeat non invia dati

**Soluzione**:
1. Verifica credenziali Supabase in `MdmConfig.java`
2. Controlla connessione internet dispositivo
3. Verifica log: `adb logcat | grep HeartbeatWorker`
4. Check Supabase RLS policies (devono permettere UPDATE)

### Problema: Comandi non si eseguono

**Soluzione**:
1. Verifica `device_id` in Supabase tabella `devices`
2. Usa stesso `device_id` in tabella `device_commands`
3. Check log: `adb logcat | grep CommandPollingWorker`
4. Status comando deve essere `pending`

### Problema: Build fallisce

**Soluzione**:
1. Sync Gradle: File → Sync Project with Gradle Files
2. Clean build: Build → Clean Project
3. Rebuild: Build → Rebuild Project
4. Check versione Gradle: minimo 7.0

### Problema: Permessi negati

**Soluzione**:
1. Per REBOOT: App deve essere firmata come system app
2. Temporaneamente testa altri comandi (kiosk, sync_config)
3. Oppure usa `adb shell su` per grant REBOOT permission

## 📈 Next Steps

### Features da Implementare

1. **QR Code Setup**:
   - Scan QR da dashboard
   - Auto-registrazione dispositivo
   - Configurazione WiFi automatica

2. **APK Auto-Update**:
   - Download APK da URL
   - Verifica signature
   - Silent install (se system app)

3. **GPS Location**:
   - Cattura posizione su comando `locate`
   - Invia a Supabase

4. **Kiosk Mode Completo**:
   - Lock navigation
   - Hide status bar
   - Prevent exit

5. **Storage Management**:
   - Auto-cleanup cache
   - Gestione storage basso

## 📞 Support

Per problemi o domande:
1. Check logs: `adb logcat | grep MDM`
2. Verifica Dashboard MDM → Activity Logs
3. Test connessione: `curl -I https://your-project.supabase.co`
4. Controlla RLS policies su Supabase

---

✅ **Sistema MDM integrato e pronto per testing!**

L'app ora comunica automaticamente con il backend e risponde ai comandi MDM.
