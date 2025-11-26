# Founder Dashboard - Sistema di Amministrazione Avanzato

## Panoramica

Il Founder Dashboard è una nuova sezione della piattaforma OmnilyPro dedicata ai super amministratori, ispirata al design di Gemini AI. Fornisce strumenti avanzati per il monitoraggio, la gestione e il controllo completo della piattaforma.

## Sezioni Implementate

### 1. **Profilo Founder** (`/admin/profile`)

**Componente:** `ProfileSettings.tsx`

**Funzionalità:**
- Avatar grande centrato (180px) con bordo gradient viola
- Badge "PROPRIETARIO" con icona corona
- Informazioni personali del Founder:
  - Nome e Cognome
  - Email (read-only)
  - Telefono
  - Bio Esecutiva
- **Founder ID Card** (tema dark):
  - ID univoco generato dall'user ID
  - Formato: `FD-XXXX-XX`
  - Pulsante copia negli appunti
- Link al profilo pubblico su omnilypro.com
- Upload avatar con validazione (max 5MB, solo immagini)
- Auto-refresh dei dati nel layout principale

**Design:**
- Layout a due colonne:
  - Sinistra: Bio + Dettagli Personali
  - Destra: Founder ID + Profilo Pubblico + Pulsante Salva
- Stile Gemini: pulito, moderno, con gradients e dark theme cards

**Dati Reali:**
- Titolo: "Founder & CEO of OmnilyPro"
- Location: "Italia"
- Website: "omnilypro.com"
- Email reale dell'utente loggato
- Profilo pubblico: `omnilypro.com/team/founder`

---

### 2. **System Command Center** (`/admin/system-overview`)

**Componente:** `SystemOverview.tsx`

**Funzionalità:**
- **Badge Status Sistema** in tempo reale:
  - ✅ Operativo (verde)
  - ⚠️ Attenzione (arancione)
  - 🔴 Critico (rosso)

- **Quick Stats Grid** (4 card):
  1. **Organizzazioni Attive**: Totale + crescita mensile
  2. **Utenti Attivi**: Conteggio + trend
  3. **Entrate Mensili**: Revenue totale da abbonamenti attivi
  4. **Abbonamenti Attivi**: Numero + crescita

- **Salute Sistema**:
  - **Uptime Sistema**: Percentuale disponibilità (es. 99.98%)
  - **Tempo Risposta API**: Latenza media in ms (es. 145ms)
  - **Utilizzo Database**: GB occupati (es. 2.4 GB)
  - **Connessioni Attive**: Numero sessioni live (es. 47)
  - Progress bar colorate per ogni metrica

- **Attività Recente**:
  - Timeline degli eventi recenti
  - Icone colorate per tipo evento (success/info/warning)
  - Timestamp relativo (es. "15 minuti fa")

- **Azioni Rapide**:
  - Link diretti a:
    - Gestione Organizzazioni
    - Gestione Utenti
    - Clienti da Attivare
    - Abbonamenti
    - Analytics
    - Database

**Dati Reali:**
- Conteggi da Supabase (organizations, users, subscriptions, customers)
- Revenue calcolato da abbonamenti attivi
- System metrics (alcuni simulati, ma possono essere integrati con monitoring APIs reali)

**Auto-Refresh:**
- Metriche aggiornate ogni 30 secondi automaticamente

---

### 3. **Root Access Control** (`/admin/root-access`)

**Componente:** `RootAccessControl.tsx`

**Funzionalità:**

- **Protezione Accesso**:
  - Solo super amministratori (`isSuperAdmin = true`)
  - Schermata "Accesso Negato" per altri utenti

- **Impostazioni Sicurezza** (toggle switches):
  1. **Autenticazione a Due Fattori (2FA)**
     - Richiedi codice OTP per login amministrativo

  2. **Accesso API**
     - Abilita/disabilita accesso programmatico via API Key

  3. **Backup Automatico Database**
     - Backup giornaliero alle 02:00 UTC

  4. **Notifiche Login**
     - Alert via email per ogni nuovo login admin

  5. **Timeout Sessione**
     - Dropdown: 30min / 60min / 2h / 4h
     - Disconnessione automatica dopo inattività

- **API Key Management**:
  - Master API Key univoca per accesso programmatico
  - Formato: `omni_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
  - Funzioni:
    - 👁️ Mostra/Nascondi chiave
    - 📋 Copia negli appunti
    - 🔄 Rigenera nuova chiave
  - ⚠️ Warning: "Non condividere mai questa chiave. Ha accesso completo al sistema."

- **Log Accessi Recenti**:
  - Timeline audit log con:
    - Azione eseguita
    - Timestamp relativo
    - IP Address
    - User Agent
    - Status (Success ✅ / Failed ❌)
  - Esempio log:
    - "Login super admin" - 15 minuti fa - 192.168.1.100
    - "Modifica impostazioni database" - 2 ore fa
    - "Tentativo accesso API" - Failed - IP esterno

- **Azioni Amministrative**:
  - Backup Manuale Database
  - Audit Completo Utenti
  - Reset Cache Sistema (pulsante danger)

**Design:**
- API Key display con tema dark (sfondo nero, testo verde monospace)
- Toggle switches animati (verde quando attivi)
- Card dark per Founder ID
- Log entries con icone colorate e border-left colorati

---

## Navigazione

Le nuove sezioni sono state aggiunte al menu di navigazione di AdminLayout:

```
📊 Founder Dashboard
  - 🏠 Panoramica
  - ⚡ Command Center
  - 🔒 Root Access Control

📈 Analytics
  - 📊 Analytics
  - 📝 Log Attività

... (altre sezioni esistenti)
```

## Routes Aggiunte

In `App.tsx`:

```tsx
<Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  <Route index element={<AdminDashboard />} />
  <Route path="profile" element={<ProfileSettings />} />
  <Route path="system-overview" element={<SystemOverview />} />
  <Route path="root-access" element={<RootAccessControl />} />
  ...
</Route>
```

## File Creati

### Componenti TypeScript
1. `/src/components/Admin/ProfileSettings.tsx` - Profilo Founder (completamente riscritto)
2. `/src/components/Admin/SystemOverview.tsx` - Command Center
3. `/src/components/Admin/RootAccessControl.tsx` - Controllo Accessi

### Stili CSS
1. `/src/components/Admin/ProfileSettings.css` - Stile Gemini per profilo
2. `/src/components/Admin/SystemOverview.css` - Stile Command Center
3. `/src/components/Admin/RootAccessControl.css` - Stile Root Access

### Backup
1. `/src/components/Admin/ProfileSettings.old.tsx` - Backup profilo originale
2. `/src/components/Admin/ProfileSettings.old.css` - Backup CSS originale

## Tecnologie Utilizzate

- **React TypeScript** - Componenti funzionali con hooks
- **React Router** - Routing SPA
- **Lucide React** - Libreria icone moderne
- **Supabase** - Backend per dati real-time
- **CSS Grid & Flexbox** - Layout responsivi
- **Linear Gradients** - Design moderno

## Sicurezza

### Founder ID
- Generato da user ID Supabase
- Formato: `FD-XXXX-XX` (prime 8 char dell'ID)
- Non modificabile, solo copiabile

### API Key
- Generata casualmente (32 caratteri)
- Prefisso `omni_` per identificazione
- Può essere rigenerata in qualsiasi momento
- Da non condividere mai (accesso completo al sistema)

### Root Access Control
- Accessibile solo con `isSuperAdmin = true`
- Schermata denied per altri ruoli
- Audit log di tutti gli accessi admin

## Responsività

Tutti i componenti sono completamente responsivi:

- **Desktop** (>1200px): Layout a due colonne
- **Tablet** (768-1200px): Layout adattivo
- **Mobile** (<768px): Layout a singola colonna stacked

## Dati Mock vs Dati Reali

### ✅ Dati Reali (da Supabase)
- Conteggio organizzazioni
- Conteggio utenti attivi
- Abbonamenti attivi
- Revenue mensile (calcolato)
- Clienti in attesa di attivazione
- Informazioni profilo utente (nome, email, avatar)
- Founder ID (generato da user ID)

### 🔧 Dati Simulati (possono essere integrati)
- System uptime (mock 99.98%)
- API response time (mock 145ms)
- Database size (mock 2.4 GB)
- Connessioni attive (mock 47)
- Log accessi (mock, ma struttura database pronta)
- API Key (generata random, da salvare in DB)

## Prossimi Passi

1. **Integrare monitoring APIs reali**:
   - Uptime monitoring (es. UptimeRobot API)
   - Response time (es. New Relic, Datadog)
   - Database metrics (Supabase metrics API)

2. **Implementare audit log reale**:
   - Creare tabella `audit_logs` in Supabase
   - Tracciare ogni azione admin
   - Middleware per log automatico

3. **API Key Management**:
   - Salvare API keys in tabella `api_keys`
   - Encryption a riposo
   - Rate limiting per API

4. **2FA Implementation**:
   - Integrazione TOTP (Google Authenticator)
   - QR code generation
   - Backup codes

5. **Notifiche Email**:
   - Setup SendGrid/Mailgun
   - Template per login alerts
   - Configurazione SMTP

## Test

Per testare le nuove funzionalità:

1. **Login come super admin**
2. **Naviga a** `/admin/system-overview` per vedere il Command Center
3. **Naviga a** `/admin/root-access` per gestire sicurezza
4. **Naviga a** `/admin/profile` per vedere il profilo Founder
5. **Verifica**:
   - Upload avatar funziona
   - Founder ID si copia negli appunti
   - API Key mostra/nascondi funziona
   - Toggle settings cambiano stato
   - Metriche si aggiornano ogni 30 secondi

## Note Importanti

- ⚠️ Il Founder Dashboard è pensato SOLO per super amministratori
- ⚠️ Non condividere mai il Founder ID o API Key
- ⚠️ I log di accesso sono critici per sicurezza
- ✅ Tutti i dati personali sono reali e collegati a Supabase
- ✅ Il design è ispirato a Gemini AI ma completamente personalizzato per OmnilyPro

---

## Supporto

Per domande o problemi, contatta il team di sviluppo OmnilyPro.

**Versione:** 1.0.0
**Data:** 2025-11-26
**Autore:** Claude Code Assistant
