# OneSignal Setup Guide for OmnilyPro

## 📋 Panoramica

Questa guida ti aiuterà a configurare OneSignal per il sistema di notifiche push multi-tenant di OmnilyPro.

## 🎯 Funzionalità

- ✅ Notifiche push real-time
- ✅ Segmentazione per organizzazione
- ✅ Campagne marketing
- ✅ Notifiche transazionali (punti guadagnati, tier upgrade)
- ✅ Animazioni custom in-app
- ✅ Analisi e tracking
- ✅ Editor visuale per campagne

---

## 🚀 Step 1: Creare Account OneSignal

### 1.1 Registrazione
1. Vai su [https://onesignal.com](https://onesignal.com)
2. Clicca su "Get Started Free"
3. Crea un account (gratuito fino a milioni di notifiche)

### 1.2 Creare App
1. Nel dashboard OneSignal, clicca "New App/Website"
2. Nome app: **"OmnilyPro Multi-Tenant"**
3. Seleziona **Web Push**
4. Clicca "Next"

### 1.3 Configurazione Web Push
1. **Site URL**: Inserisci il dominio della customer-app
   - Esempio produzione: `https://app.omnilypro.com`
   - Esempio staging: `https://staging-app.omnilypro.com`
   - Per development: `http://localhost:5173` (OneSignal lo supporta)

2. **Auto Resubscribe**: Abilita (consigliato)

3. **Default Notification Icon**: Carica il logo OmnilyPro (192x192px)

4. Clicca "Save"

### 1.4 Ottenere App ID
1. Vai su **Settings** → **Keys & IDs**
2. Copia l'**App ID** (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Salvalo - ti servirà nel prossimo step

---

## ⚙️ Step 2: Configurare il Customer App

### 2.1 Variabili Ambiente

Aggiungi il tuo OneSignal App ID al file `.env`:

```bash
cd /Users/pasqualelucci/omnilypro-clean/customer-app
cp .env.example .env
```

Modifica `.env` e aggiungi:
```env
VITE_ONESIGNAL_APP_ID=your-onesignal-app-id-here
```

### 2.2 Copiare Service Worker Files

OneSignal richiede due file nella root pubblica:

1. Scarica i file da OneSignal Dashboard:
   - Settings → Web Push → Download Service Worker Files

2. Oppure copia questi file nella cartella `customer-app/public/`:

**File: `public/OneSignalSDKWorker.js`**
```javascript
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js');
```

**File: `public/manifest.json`** (aggiorna o crea)
```json
{
  "name": "OmnilyPro Customer App",
  "short_name": "OmnilyPro",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ef4444",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "gcm_sender_id": "482941778795",
  "gcm_sender_id_comment": "Do not change the GCM Sender ID"
}
```

---

## 🗄️ Step 3: Setup Database

### 3.1 Eseguire Migration

Applica la migration SQL al tuo database Supabase:

```bash
# Opzione 1: Via Supabase Dashboard
# 1. Vai su Supabase Dashboard → SQL Editor
# 2. Carica il file: supabase/migrations/20250119_notification_system.sql
# 3. Esegui

# Opzione 2: Via CLI (se usi Supabase CLI)
cd /Users/pasqualelucci/omnilypro-clean
supabase db push
```

### 3.2 Verificare Tabelle Create

Dovresti vedere queste nuove tabelle:
- `notification_templates`
- `notification_campaigns`
- `notification_logs`

---

## 🎨 Step 4: Testare l'Integrazione

### 4.1 Avviare Customer App

```bash
cd /Users/pasqualelucci/omnilypro-clean/customer-app
npm run dev
```

### 4.2 Verificare Inizializzazione

Apri la console del browser e cerca:
```
✅ OneSignal initialized successfully
```

### 4.3 Richiedere Permesso Notifiche

Il permesso verrà richiesto automaticamente dopo il login del cliente.

Oppure testa manualmente nella console:
```javascript
import oneSignalService from './services/oneSignalService'
await oneSignalService.requestNotificationPermission()
```

### 4.4 Testare Notifica (Development)

Nella console del browser:
```javascript
// Test animazione punti
oneSignalService.simulateNotification('points')

// Test tier upgrade
oneSignalService.simulateNotification('tier_upgrade')

// Test confetti
oneSignalService.simulateNotification('confetti')
```

---

## 📱 Step 5: Inviare Prima Notifica (OneSignal Dashboard)

### Test Manuale

1. Vai su OneSignal Dashboard → **Messages** → **New Push**
2. **Audience**: Select "Subscribed Users" → "All Subscribed Users"
3. **Message**:
   - Title: `Test da OmnilyPro!`
   - Content: `Questa è una notifica di test`
4. **Delivery**: Send Immediately
5. Clicca "Send Message"

Se tutto è configurato correttamente, dovresti ricevere la notifica!

---

## 🏢 Step 6: Configurare Segmentazione Multi-Tenant

### 6.1 Tags per Organizzazione

Quando un cliente fa login, vengono automaticamente aggiunti questi tags:

```javascript
{
  "organization_id": "luce-restaurant-123",
  "customer_id": "customer-uuid",
  "tier": "gold",
  "app_version": "1.0.0",
  "platform": "web"
}
```

### 6.2 Inviare Notifica a Organizzazione Specifica

**Via OneSignal Dashboard:**
1. Messages → New Push
2. Audience → Add Filter
3. **Tag**: `organization_id` → **is** → `luce-restaurant-123`
4. Crea messaggio e invia

**Via API (dal backend):**
```typescript
// Backend: Quando POS aggiunge punti
const response = await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic YOUR_REST_API_KEY`
  },
  body: JSON.stringify({
    app_id: 'YOUR_APP_ID',
    include_external_user_ids: [customerId], // Specific customer

    // Or use filters for segments:
    filters: [
      { field: 'tag', key: 'organization_id', value: 'luce-restaurant-123' },
      { field: 'tag', key: 'tier', value: 'gold' }
    ],

    contents: {
      en: 'Hai guadagnato 50 punti!'
    },
    headings: {
      en: 'Punti Aggiunti!'
    },
    data: {
      type: 'points_earned',
      animation_type: 'points',
      animation_data: { points: 50 }
    }
  })
})
```

---

## 🎬 Prossimi Step

Ora che OneSignal è configurato, puoi:

1. ✅ **Creare Template Notifiche** nel pannello organizzazioni
2. ✅ **Lanciare Campagne Marketing** con targeting avanzato
3. ✅ **Automatizzare Notifiche** (es: punti guadagnati, tier upgrade)
4. ✅ **Analizzare Metriche** (delivery rate, click rate, conversioni)

---

## 📚 Risorse Utili

- [OneSignal Dashboard](https://app.onesignal.com)
- [OneSignal Web SDK Docs](https://documentation.onesignal.com/docs/web-push-sdk)
- [OneSignal REST API](https://documentation.onesignal.com/reference/create-notification)
- [Segmentation Guide](https://documentation.onesignal.com/docs/segmentation)

---

## 🐛 Troubleshooting

### Notifiche non arrivano

**1. Verifica permessi browser**
```javascript
await oneSignalService.getPushSubscriptionState()
// Controlla: isPushSupported, permission, optedIn
```

**2. Controlla console errori**
Apri DevTools → Console e cerca errori OneSignal

**3. Verifica Service Worker**
DevTools → Application → Service Workers
Dovresti vedere `OneSignalSDKWorker.js` attivo

**4. Testa in incognito**
A volte il browser cache causa problemi - prova in incognito

### Permesso già negato

Se l'utente ha già negato i permessi:
```javascript
// Mostra istruzioni per riabilitare manualmente:
// Chrome: Settings → Privacy → Site Settings → Notifications
// Firefox: Preferences → Privacy → Permissions → Notifications
```

---

## 🔐 Sicurezza

**IMPORTANTE:**
- Non esporre mai il **REST API Key** nel frontend
- Usa il REST API Key **SOLO nel backend**
- L'App ID può essere pubblico (è nel frontend)
- Tutti gli invii di notifiche devono avvenire dal backend per sicurezza

---

## ✅ Checklist Setup

- [ ] Account OneSignal creato
- [ ] App Web Push configurata
- [ ] App ID copiato in `.env`
- [ ] Service Worker files aggiunti in `public/`
- [ ] Migration database eseguita
- [ ] Customer app avviata e testata
- [ ] Prima notifica test ricevuta
- [ ] Tags multi-tenant configurati

**Setup completato! 🎉**

Per qualsiasi domanda, consulta la documentazione OneSignal o contatta il team.
