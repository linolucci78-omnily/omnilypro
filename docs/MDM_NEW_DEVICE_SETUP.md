# 🚀 Setup Nuovo Dispositivo POS - Guida Rapida

**Data**: 30 Ottobre 2025
**Per**: Configurazione nuovo POS Z108 Android

---

## ✅ Sistema MDM Completamente Funzionante

Il sistema MDM di OMNILY è **100% operativo** e gestisce tutto dall'Admin Dashboard:

### **Dashboard Location**: `/admin/mdm`

**Funzionalità Attive**:
- ✅ Registrazione nuovi dispositivi
- ✅ Comandi remoti (reboot, kiosk mode, shutdown)
- ✅ Localizzazione GPS
- ✅ Monitoring batteria e WiFi
- ✅ Gestione template stampa
- ✅ Push aggiornamenti app
- ✅ Activity logs
- ✅ Alerts automatici

---

## 📱 Step-by-Step: Aggiungere Nuovo POS

### **STEP 1: Preparazione POS**

1. **Accendi il dispositivo Z108**
2. **Connetti a WiFi** della location
3. **Abilita Installazione da Fonti Sconosciute**:
   - Settings → Security → Unknown Sources → ON

### **STEP 2: Installare App OMNILY**

**Opzione A: Download Diretto (Consigliato)**
```
1. Apri browser sul POS
2. Vai a: https://omnilypro.vercel.app
3. Fai login come admin
4. Vai a /admin/mdm → tab "Apps"
5. Scarica l'APK più recente
6. Installa l'APK
```

**Opzione B: Da Admin Dashboard (Più Veloce)**
```
1. Admin Dashboard → MDM → Tab "Devices"
2. Click "Aggiungi Dispositivo"
3. Genera QR Code per setup
4. Sul POS: Scannerizza QR con camera
5. Download automatico APK
6. Installa
```

### **STEP 3: Prima Configurazione App**

1. **Apri app OMNILY sul POS**
2. **Si aprirà schermata di setup**:
   ```
   - Device Name: [es: "POS-Negozio-Milano-1"]
   - Store Location: [es: "Milano Centro"]
   - Organization: [Seleziona dalla lista]
   ```
3. **L'app genera automaticamente**:
   - Android ID univoco
   - Device fingerprint
   - Token di autenticazione

4. **Click "Registra Dispositivo"**

### **STEP 4: Verifica Registrazione**

1. **Torna a Admin Dashboard → MDM**
2. **Dovresti vedere il nuovo dispositivo** nella lista con:
   - Status: "online" (verde)
   - Nome dispositivo
   - Location
   - Batteria e WiFi

### **STEP 5: Configurazione Stampante (Se Applicabile)**

**Se il POS ha stampante termica**:

1. **Admin → MDM → Devices → Seleziona il nuovo POS**
2. **Tab "Configurazione Stampa"**
3. **Assegna Template di Stampa**:
   - Vai a "Print Templates"
   - Seleziona o crea template per l'organizzazione
   - Assegna al dispositivo
4. **Test Stampa**:
   - Click "Test Print"
   - Verifica scontrino stampato correttamente

### **STEP 6: Attiva Kiosk Mode**

**Per bloccare il dispositivo solo su app OMNILY**:

1. **Admin → MDM → Seleziona dispositivo**
2. **Click "Attiva Kiosk Mode"**
3. **Sul POS**:
   - Conferma richiesta permessi Device Admin
   - L'app diventa launcher predefinito
   - Tasti back/home disabilitati
   - Solo OMNILY accessibile

**Per sbloccare** (in caso di necessità):
- Da Admin: Click "Disattiva Kiosk"
- Oppure: "Force Unlock 🆘" (emergenza)

---

## 🎛️ Comandi MDM Disponibili

### **Comandi Base**

| Comando | Descrizione | Quando Usare |
|---------|-------------|--------------|
| **Reboot** | Riavvia dispositivo | Dopo aggiornamenti, se lento |
| **Shutdown** | Spegni dispositivo | Fine giornata, manutenzione |
| **Kiosk ON** | Blocca su app OMNILY | Setup iniziale, sicurezza |
| **Kiosk OFF** | Sblocca dispositivo | Manutenzione, troubleshooting |
| **Locate** | GPS position | Verifica posizione |
| **Test Print** | Stampa di test | Verifica stampante |

### **Comandi Avanzati**

**Scheduler** (tab "Scheduler"):
- Programma comandi ricorrenti (es: reboot notturno alle 3 AM)
- Comandi batch per più dispositivi

**Bulk Operations** (tab "Bulk"):
- Esegui comando su tutti i POS
- Filtra per organization/location
- Utile per aggiornamenti di massa

**Push Update** (tab "Push"):
- Forza aggiornamento app su tutti i POS
- Scegli versione specifica
- Rollback se necessario

---

## 📊 Monitoring & Alerts

### **Dashboard Monitoring**

**Admin → MDM → Tab "Devices"** mostra in tempo reale:

- 🟢 **Online** = Dispositivo connesso e funzionante
- 🟡 **Offline** = Non connesso (spento o senza rete)
- 🔵 **Setup** = In configurazione iniziale
- 🟠 **Maintenance** = In manutenzione

**Metriche per dispositivo**:
- Last Seen (ultima connessione)
- Battery Level (% batteria)
- WiFi SSID (rete connessa)
- Kiosk Mode (attivo/inattivo)
- GPS Location (lat/long)

### **Alerts Automatici** (tab "Alerts")

**Configurabili**:
- 🔋 Batteria < 20%
- 📶 Dispositivo offline > 30 minuti
- 🔄 Kiosk mode disattivato inaspettatamente
- 📍 Dispositivo fuori dalla location prevista
- 🖨️ Stampante non funzionante

**Notifiche via**:
- Email admin
- Notifica push in app
- SMS (se configurato)

---

## 🗺️ Map View

**Admin → MDM → Click "Map View"**

Visualizza tutti i POS su mappa geografica:
- Pin colorati per status (verde/rosso/giallo)
- Click su pin → dettagli dispositivo
- Utile per fleet con tanti store
- Verifica posizioni corrette

---

## 🔧 Troubleshooting Comune

### **Problema: Dispositivo Non Si Registra**

**Soluzioni**:
1. Verifica connessione internet sul POS
2. Check permission app (GPS, Storage)
3. Riavvia app OMNILY
4. Se persiste: reinstalla app
5. Check logs in Admin → MDM → Logs

### **Problema: Kiosk Mode Non Si Attiva**

**Soluzioni**:
1. Settings → Security → Device Administrators
2. Assicurati OMNILY sia abilitato come Device Admin
3. Se non appare: reinstalla app
4. Prova "Force Enable Kiosk" da admin

### **Problema: Stampante Non Stampa**

**Soluzioni**:
1. Verifica stampante accesa e connessa (USB/Bluetooth)
2. Admin → MDM → Print Templates → Assegna template corretto
3. Click "Test Print" e verifica output
4. Check logs per errori specifici
5. Se ZCS: verifica driver installato

### **Problema: Dispositivo Offline**

**Cause Comuni**:
- WiFi disconnesso → riconnetti
- App crashata → riavvia app
- Dispositivo spento → accendi
- Batteria scarica → ricarica

**Check**:
1. Admin → MDM → Device → Last Seen (quanto tempo fa)
2. Se > 1h → dispositivo probabilmente spento
3. Se < 10min → problema temporaneo rete

---

## 📋 Checklist Setup Completo

### **✅ Pre-Setup**
- [ ] POS acceso e carico
- [ ] WiFi configurato e connesso
- [ ] Fonti sconosciute abilitate

### **✅ Installazione**
- [ ] App OMNILY installata
- [ ] Prima configurazione completata
- [ ] Dispositivo registrato in Admin MDM
- [ ] Status = "online" (verde)

### **✅ Configurazione**
- [ ] Nome dispositivo corretto
- [ ] Location assegnata
- [ ] Organization collegata
- [ ] Template stampa assegnato (se applicabile)

### **✅ Test**
- [ ] Login utente funziona
- [ ] Scan NFC/QR funziona
- [ ] Stampa funziona (se applicabile)
- [ ] Kiosk mode attivabile

### **✅ Finalizzazione**
- [ ] Kiosk mode attivato
- [ ] Alert configurati
- [ ] Posizionamento fisico OK
- [ ] Training utente completato

---

## 🚨 Comandi di Emergenza

### **Se Dispositivo Bloccato/Inaccessibile**

1. **Force Unlock**:
   ```
   Admin → MDM → Device → "Force Unlock 🆘"
   ```

2. **Reboot Remoto**:
   ```
   Admin → MDM → Device → "Riavvia"
   ```

3. **Se proprio non risponde**:
   - Spegni fisicamente (tieni premuto power 10 sec)
   - Riaccendi
   - Riconnetti a Admin

### **Reset Completo Dispositivo**

**Solo in caso estremo**:
1. Settings → Backup & Reset → Factory Reset
2. Reinstalla app OMNILY
3. Riconfigura da zero come nuovo dispositivo

---

## 📞 Support Info

**Se hai problemi durante setup**:

1. **Check Logs**:
   - Admin → MDM → Logs
   - Cerca errori relativi al device ID

2. **Activity Logs**:
   - Admin → MDM → Activity
   - Vedi tutti i comandi inviati e status

3. **Token Setup** (per debugging avanzato):
   - Admin → MDM → Tokens
   - Verifica token dispositivo valido

---

## 🎯 Best Practices

### **Naming Convention Dispositivi**
```
Pattern: POS-[CittàStore]-[Numero]

Esempi:
✅ POS-Milano-Centro-1
✅ POS-Roma-Termini-2
✅ POS-Torino-Porta-Susa-1

❌ Device-1
❌ Test
❌ Z108
```

### **Manutenzione Programmata**
- Reboot settimanale automatico (domenica 3 AM)
- Check batteria mensile
- Update app ogni 2 settimane
- Verifica GPS location trimestrale

### **Security**
- Sempre attiva Kiosk Mode in produzione
- Cambia password WiFi periodicamente
- Monitora alerts offline
- Backup configurazioni mensile

---

## 📖 Documentazione Completa

**Per approfondimenti**:
- `/frontend/MDM.md` - Architettura completa sistema
- `/android-bridge/MDM_INTEGRATION_README.md` - Integrazione Android
- `/database/mdm_schema.sql` - Schema database

**Admin Dashboard**:
- Route: `/admin/mdm`
- Tutte le funzionalità MDM centralizzate

---

**Buon setup! 🚀**

**Per domande**: Check logs e activity prima, poi contatta support se necessario.
