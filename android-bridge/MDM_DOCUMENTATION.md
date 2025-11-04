# Omnily POS - MDM System Documentation

## 📋 Indice
1. [Architettura Sistema](#architettura-sistema)
2. [QR Code Provisioning](#qr-code-provisioning)
3. [Device Registration Flow](#device-registration-flow)
4. [Heartbeat & GPS Tracking](#heartbeat--gps-tracking)
5. [Command Polling](#command-polling)
6. [Build & Deploy](#build--deploy)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architettura Sistema

### Componenti Principali

```
┌─────────────────────────────────────────────────┐
│           Frontend Dashboard (React)             │
│  - Genera QR code provisioning                  │
│  - Monitora dispositivi online                  │
│  - Invia comandi MDM                            │
└─────────────────┬───────────────────────────────┘
                  │
                  │ REST API
                  │
┌─────────────────▼───────────────────────────────┐
│            Supabase Backend                      │
│  - devices table (stato dispositivi)            │
│  - mdm_commands table (comandi pending)         │
│  - mdm_activity_logs table (log attività)       │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTP Polling
                  │
┌─────────────────▼───────────────────────────────┐
│       Android App (omnilypro.pos)               │
│  - Device Owner Mode                            │
│  - MDM Agent                                    │
│  - Heartbeat ogni 30s                           │
│  - Command polling ogni 60s                     │
└─────────────────────────────────────────────────┘
```

### File Structure

```
android-bridge/
├── app/
│   ├── build.gradle (versioning, signing)
│   └── src/main/
│       ├── AndroidManifest.xml (permissions, receivers)
│       └── java/com/omnilypro/pos/
│           ├── MainActivity.java (entry point)
│           └── mdm/
│               ├── MdmManager.java (core logic)
│               ├── MyDeviceAdminReceiver.java (provisioning)
│               ├── GetProvisioningModeActivity.java (Android 14)
│               ├── AdminPolicyComplianceActivity.java (Android 14)
│               ├── HeartbeatWorker.java (GPS + status)
│               ├── CommandPollingWorker.java (comandi)
│               ├── SupabaseClient.java (API client)
│               └── MdmConfig.java (constants)
└── omnily-production.jks (keystore)
```

---

## 📱 QR Code Provisioning

### Android 14 Requirements

Android 14 richiede **DUE ACTIVITIES** obbligatorie per il provisioning:

1. **GetProvisioningModeActivity** - Determina il tipo di provisioning
2. **AdminPolicyComplianceActivity** - Verifica compliance policy

### QR Code Format

Il QR code deve contenere un JSON con questa struttura **ESATTA**:

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.omnilypro.pos/.mdm.MyDeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/omnilybridgepos-production-v1.4.1.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "UD6n2v1QMVjmZhcgZAMdu75xflfb_ypXmvQuLrR-ho8",
  "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "setup_token": "uuid-generated-token",
    "device_id": "uuid-from-supabase",
    "device_name": "POS Device Name",
    "organization_id": "uuid-organization",
    "store_location": "Store Location Name"
  }
}
```

### ⚠️ PARAMETRI CRITICI

#### PACKAGE_CHECKSUM vs SIGNATURE_CHECKSUM

**ATTENZIONE:** Usare il parametro CORRETTO è FONDAMENTALE!

```javascript
// ❌ SBAGLIATO - Causa "impossibile configurare dispositivo"
"android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "..."

// ✅ CORRETTO - Checksum dell'APK file
"android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "..."
```

**Differenza:**
- `SIGNATURE_CHECKSUM` = SHA256 del certificato di firma dell'APK
- `PACKAGE_CHECKSUM` = SHA256 dell'intero file APK

**Come generare il checksum:**
```bash
openssl dgst -binary -sha256 app-release.apk | openssl base64 | tr '+/' '-_' | tr -d '='
```

### Provisioning Flow

```
1. Factory Reset dispositivo Android
   ↓
2. Setup iniziale Android → "Scan QR Code for work"
   ↓
3. Android scarica APK da URL specificato
   ↓
4. Android verifica PACKAGE_CHECKSUM
   ↓
5. Android installa APK
   ↓
6. GetProvisioningModeActivity.onCreate()
   - Estrae ADMIN_EXTRAS_BUNDLE
   - Salva in SharedPreferences ("OmnilyPOS")
   - Ritorna PROVISIONING_MODE_FULLY_MANAGED_DEVICE
   ↓
7. AdminPolicyComplianceActivity.onCreate()
   - Verifica compliance (RESULT_OK)
   ↓
8. MyDeviceAdminReceiver.onProfileProvisioningComplete()
   - Lancia MainActivity
   ↓
9. MainActivity.onCreate()
   - Chiama MdmManager.initialize()
   ↓
10. Device registrato e online! ✅
```

---

## 🔄 Device Registration Flow

### SharedPreferences Management

**ATTENZIONE:** Ci sono DUE SharedPreferences con nomi diversi!

```java
// ✅ QUESTO viene usato per il provisioning
SharedPreferences omnilyPrefs = context.getSharedPreferences("OmnilyPOS", MODE_PRIVATE);

// ❌ QUESTO è un fallback legacy
SharedPreferences mdmPrefs = context.getSharedPreferences("mdm_prefs", MODE_PRIVATE);
```

### Registration Logic

**File:** `MdmManager.java:227-306`

```java
private void registerDevice() {
    // 1. Leggi dati dal QR (salvati in GetProvisioningModeActivity)
    SharedPreferences prefs = context.getSharedPreferences("OmnilyPOS", MODE_PRIVATE);
    String deviceId = prefs.getString("device_id", null);
    String androidId = Settings.Secure.getString(..., ANDROID_ID);

    // 2. Crea oggetto device MINIMO (non troppo pesante!)
    JsonObject deviceData = new JsonObject();
    deviceData.addProperty("android_id", androidId);
    deviceData.addProperty("name", deviceName);
    deviceData.addProperty("organization_id", organizationId);
    deviceData.addProperty("store_location", storeLocation);
    deviceData.addProperty("status", "online");
    deviceData.addProperty("device_model", Build.MODEL);

    // 3. Usa updateDeviceByUuid (PATCH) - LEGGERO e VELOCE
    SupabaseClient.getInstance().updateDeviceByUuid(deviceId, deviceData, callback);

    // 4. Al successo:
    //    - Salva device_id in entrambe le SharedPreferences
    //    - Setta device_registered = true (SOLO DOPO successo!)
    //    - Avvia background workers
}
```

### ⚠️ ERRORI COMUNI DA EVITARE

#### ❌ Errore #1: Flag device_registered prematuro

```java
// ❌ SBAGLIATO - in GetProvisioningModeActivity
prefs.edit()
    .putString("device_id", deviceId)
    .putBoolean("device_registered", true)  // ❌ TROPPO PRESTO!
    .apply();
```

**Problema:** Se device_registered=true PRIMA della registrazione, MdmManager.initialize() salta registerDevice() e il device non viene mai registrato su Supabase!

**Soluzione:**
```java
// ✅ CORRETTO - Solo dati di setup
prefs.edit()
    .putString("device_id", deviceId)
    .putString("device_name", deviceName)
    // device_registered viene settato DOPO in MdmManager.registerDevice()
    .apply();
```

#### ❌ Errore #2: Usare upsertDevice() alla registrazione

```java
// ❌ SBAGLIATO - Troppo pesante per provisioning
SupabaseClient.getInstance().upsertDevice(
    deviceId, androidId, deviceName, orgId, location, callback);
```

**Problema:** Il metodo upsertDevice() crea un oggetto completo con tutti i campi, incluso SimpleDateFormat, e usa POST con "resolution=merge-duplicates". Troppo lento durante il provisioning!

**Soluzione:**
```java
// ✅ CORRETTO - PATCH veloce con campi essenziali
JsonObject data = new JsonObject();
data.addProperty("android_id", androidId);
data.addProperty("name", deviceName);
// ... solo campi essenziali

SupabaseClient.getInstance().updateDeviceByUuid(deviceId, data, callback);
```

---

## 💓 Heartbeat & GPS Tracking

### Architettura Dual-Track

Per bypassare il limite di 15 minuti di Android WorkManager, usiamo DUE sistemi paralleli:

1. **Handler con Runnable** (attivo sempre) - Intervallo reale 30s
2. **WorkManager** (backup) - Intervallo minimo 15min

### Heartbeat Implementation

**File:** `MdmManager.java:403-459`

```java
private void startContinuousHeartbeat() {
    heartbeatHandler = new Handler(Looper.getMainLooper());

    heartbeatRunnable = new Runnable() {
        @Override
        public void run() {
            performImmediateHeartbeat();

            // Ri-schedula per i prossimi 30 secondi
            heartbeatHandler.postDelayed(this, 30000);
        }
    };

    // Avvia dopo 5 secondi (tempo per inizializzare app)
    heartbeatHandler.postDelayed(heartbeatRunnable, 5000);
}
```

### GPS Tracking

**File:** `HeartbeatWorker.java`

```java
@Override
public Result doWork() {
    // 1. Controlla permessi GPS
    if (checkSelfPermission(ACCESS_FINE_LOCATION) != PERMISSION_GRANTED) {
        return Result.failure();
    }

    // 2. Ottieni ultima posizione nota
    LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
    Location location = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);

    // 3. Invia heartbeat con GPS
    JsonObject data = new JsonObject();
    data.addProperty("status", "online");
    data.addProperty("last_seen", timestampISO8601);

    if (location != null) {
        JsonObject gps = new JsonObject();
        gps.addProperty("latitude", location.getLatitude());
        gps.addProperty("longitude", location.getLongitude());
        gps.addProperty("accuracy", location.getAccuracy());
        data.add("last_location", gps);
    }

    // 4. PATCH su Supabase
    SupabaseClient.getInstance().updateDeviceStatus(androidId, data, callback);

    return Result.success();
}
```

### Timestamp Format

**IMPORTANTE:** Supabase richiede ISO 8601 con timezone UTC!

```java
// ✅ CORRETTO
SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
String timestamp = sdf.format(new Date());
// Output: "2025-11-04T14:52:23.456Z"
```

---

## 🔍 Command Polling

### Dual-Track Polling

Come per heartbeat, usiamo due sistemi:

1. **Handler** - Ogni 1 minuto (attivo sempre)
2. **WorkManager** - Ogni 15 minuti (backup)

### Polling Flow

```
1. Handler trigger ogni 60s
   ↓
2. SupabaseClient.getPendingCommands(deviceId)
   ↓
3. Se ci sono comandi pending:
   ↓
4. CommandPollingWorker esegue ogni comando
   ↓
5. Aggiorna status comando (completed/failed)
   ↓
6. Log attività su mdm_activity_logs
```

### Command Execution

**File:** `CommandPollingWorker.java`

```java
private void executeCommand(JsonObject command) {
    String commandType = command.get("command_type").getAsString();

    switch (commandType) {
        case "LOCK_DEVICE":
            dpm.lockNow();
            break;

        case "REBOOT_DEVICE":
            dpm.reboot(adminComponent);
            break;

        case "UPDATE_APP":
            String apkUrl = command.get("apk_url").getAsString();
            downloadAndInstallApk(apkUrl);
            break;

        case "SET_KIOSK_MODE":
            boolean enable = command.get("enable").getAsBoolean();
            setKioskMode(enable);
            break;
    }

    // Aggiorna status su Supabase
    SupabaseClient.getInstance().updateCommandStatus(
        commandId, "completed", resultData, null, callback);
}
```

---

## 🔨 Build & Deploy

### 1. Build APK

```bash
cd android-bridge
./gradlew assembleRelease
```

**Output:** `app/build/outputs/apk/release/app-release.apk`

### 2. Generate Checksum

```bash
openssl dgst -binary -sha256 app/build/outputs/apk/release/app-release.apk | \
  openssl base64 | tr '+/' '-_' | tr -d '='
```

**Output:** `UD6n2v1QMVjmZhcgZAMdu75xflfb_ypXmvQuLrR-ho8`

### 3. Upload to Supabase

```bash
curl -X PUT \
  "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/apks/omnilybridgepos-production-v1.4.1.apk" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/vnd.android.package-archive" \
  -H "x-upsert: true" \
  --data-binary @app/build/outputs/apk/release/app-release.apk
```

### 4. Verify Upload

```bash
# Check accessibility
curl -I "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/omnilybridgepos-production-v1.4.1.apk"

# Verify checksum
curl -s "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/omnilybridgepos-production-v1.4.1.apk" | \
  openssl dgst -binary -sha256 | openssl base64 | tr '+/' '-_' | tr -d '='
```

### 5. Update Frontend

**Files to update:**
- `frontend/src/components/Admin/TokenSetupViewer.tsx`
- `frontend/src/components/Admin/MDMDashboard.tsx`

```typescript
const provisioningData = {
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.omnilypro.pos/.mdm.MyDeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/omnilybridgepos-production-v1.4.1.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "UD6n2v1QMVjmZhcgZAMdu75xflfb_ypXmvQuLrR-ho8",  // NEW CHECKSUM!
  // ...
}
```

### 6. Versioning

**File:** `app/build.gradle`

```gradle
defaultConfig {
    applicationId "com.omnilypro.pos"
    versionCode 36  // Incrementa SEMPRE
    versionName "1.4.1-description"
}
```

**Regola:** Incrementa `versionCode` ad OGNI build, anche se non cambia funzionalità!

---

## 🐛 Troubleshooting

### Errore: "impossibile configurare dispositivo"

#### Possibili Cause:

**1. Checksum parametro sbagliato**
```json
// ❌ SBAGLIATO
"android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "..."

// ✅ CORRETTO
"android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "..."
```

**2. Checksum non corrisponde**
```bash
# Verifica checksum locale
openssl dgst -binary -sha256 app-release.apk | openssl base64 | tr '+/' '-_' | tr -d '='

# Verifica checksum su Supabase
curl -s "https://URL_APK" | openssl dgst -binary -sha256 | openssl base64 | tr '+/' '-_' | tr -d '='
```

**3. APK non accessibile**
```bash
curl -I "https://URL_APK"
# Deve ritornare HTTP 200 e Content-Type: application/vnd.android.package-archive
```

**4. Certificato di firma sbagliato**
```bash
# Verifica certificato keystore
keytool -list -v -keystore omnily-production.jks -alias omnily-pos

# Deve mostrare: OU=Production
```

### Device non si registra su Supabase

#### Debug Steps:

**1. Controlla SharedPreferences**
```bash
adb shell
run-as com.omnilypro.pos
cat shared_prefs/OmnilyPOS.xml
```

Deve contenere:
- `device_id`
- `device_name`
- `organization_id`
- `store_location`
- `provisioned_via_qr = true`

**2. Controlla flag device_registered**
```xml
<!-- ❌ Se è true PRIMA della registrazione = ERRORE -->
<boolean name="device_registered" value="true" />
```

**3. Logcat durante avvio**
```bash
adb logcat | grep -E "(MdmManager|SupabaseClient|GetProvisioning)"
```

Cerca:
```
MdmManager: Device not registered, registering now...
MdmManager: 📱 Registering device:
SupabaseClient: 🔄 Updating device by UUID: ...
MdmManager: ✅ Device registered successfully
```

### Heartbeat non funziona

**1. Verifica Handler è attivo**
```bash
adb logcat | grep "💓 Continuous heartbeat"
```

Deve apparire ogni 30 secondi.

**2. Verifica permessi GPS**
```bash
adb shell dumpsys package com.omnilypro.pos | grep permission
```

Deve avere:
- `android.permission.ACCESS_FINE_LOCATION: granted=true`

**3. Verifica WorkManager**
```bash
adb shell dumpsys jobscheduler | grep omnilypro
```

### Command polling non funziona

**1. Verifica device_id è corretto**
```bash
adb logcat | grep "device_id"
```

**2. Crea comando di test su Supabase**
```sql
INSERT INTO mdm_commands (device_id, command_type, status)
VALUES ('7afdd16b-44ec-4eab-8581-6335600b0147', 'LOCK_DEVICE', 'pending');
```

**3. Monitora polling**
```bash
adb logcat | grep "🔍 Immediate polling"
```

---

## 📊 Database Schema

### devices table

```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  android_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  store_location TEXT,
  status TEXT DEFAULT 'offline',
  device_model TEXT,
  last_seen TIMESTAMPTZ,
  last_location JSONB,
  last_location_update TIMESTAMPTZ,
  language TEXT DEFAULT 'it',
  timezone TEXT DEFAULT 'Europe/Rome',
  current_app_package TEXT,
  kiosk_mode_active BOOLEAN DEFAULT false,
  auto_updates_enabled BOOLEAN DEFAULT true,
  heartbeat_interval_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### mdm_commands table

```sql
CREATE TABLE mdm_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL,
  parameters JSONB,
  status TEXT DEFAULT 'pending',
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### mdm_activity_logs table

```sql
CREATE TABLE mdm_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_title TEXT,
  activity_description TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Security

### Keystore Management

**File:** `omnily-production.jks`
**Password:** `omnily2024secure`
**Alias:** `omnily-pos`

**⚠️ IMPORTANTE:**
- NON committare il keystore su Git!
- Backup del keystore in luogo sicuro
- Se perdi il keystore, NON puoi più aggiornare l'app!

### Supabase API Keys

**Service Role Key** (per upload APK):
- Ha accesso completo a Supabase
- Usare SOLO in backend/script
- NON esporre in frontend

**Anon Key** (per app Android):
- Usato dall'app per API calls
- Limitato da Row Level Security (RLS)
- OK esporre nell'APK

---

## 📈 Version History

### v1.4.1 (2025-11-04) - CURRENT ✅
- ✅ QR provisioning funzionante su Android 14
- ✅ Fix PACKAGE_CHECKSUM parameter
- ✅ Fix device_registered flag prematuro
- ✅ Auto-registration con updateDeviceByUuid()
- ✅ Heartbeat continuo ogni 30s
- ✅ GPS tracking attivo
- ✅ Command polling ogni 60s

### v1.4.0 (2025-11-03) - DEPRECATED
- ❌ Usava upsertDevice() (troppo pesante)
- ❌ Flag device_registered prematuro
- ❌ SIGNATURE_CHECKSUM invece di PACKAGE_CHECKSUM
- Risultato: "impossibile configurare dispositivo"

### v4 (2025-11-02) - WORKING
- ✅ Primo provisioning funzionante
- ✅ Usava SIGNATURE_CHECKSUM (per caso funzionava)
- SharedPreferences fix implementato

### v3 e precedenti
- Test iniziali e sviluppo

---

## 📞 Support

Per problemi o domande:
1. Controlla questa documentazione
2. Cerca nei log: `adb logcat | grep -E "(MdmManager|SupabaseClient)"`
3. Verifica database Supabase
4. Controlla dashboard MDM

---

**Ultimo aggiornamento:** 4 Novembre 2025
**Versione documento:** 1.0
**Status:** Production Ready ✅
