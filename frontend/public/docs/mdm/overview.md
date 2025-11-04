# Sistema MDM (Mobile Device Management)

## Introduzione

Il sistema MDM (Mobile Device Management) di **OmnilyPro** è una piattaforma completa per la gestione centralizzata di dispositivi Android POS. Permette di monitorare, configurare e controllare in remoto tutti i dispositivi della tua organizzazione.

---

## Funzionalità Principali

### 📱 Gestione Dispositivi
- **Monitoraggio in tempo reale** dello stato dei dispositivi
- **Visualizzazione dettagliata** di batteria, connettività WiFi e posizione
- **Azioni remote**: riavvio, lock/unlock, aggiornamenti
- **Organizzazione** per negozi e punti vendita

### 📅 Scheduler Comandi
- **Programmazione** di comandi da eseguire in orari specifici
- **Automazione** di operazioni ripetitive
- **Monitoraggio** dello stato di esecuzione
- **Storico completo** dei comandi programmati

### 🔔 Sistema Alert
- **Notifiche in tempo reale** per eventi critici
- **Monitoraggio proattivo** dello stato dei dispositivi
- **Priorità configurabili** per ogni tipo di alert
- **Conferma e gestione** degli alert ricevuti

### 📦 Repository App
- **Gestione centralizzata** delle versioni app
- **Distribuzione controllata** degli aggiornamenti
- **Rollout graduale** per minimizzare i rischi
- **Tracking automatico** delle installazioni

### ⚡ Operazioni in Blocco
- **Esecuzione simultanea** di comandi su più dispositivi
- **Selezione multipla** con filtri avanzati
- **Monitoraggio in tempo reale** del progresso
- **Gestione degli errori** e retry automatici

### 🚀 Push Update App
- **Distribuzione remota** di aggiornamenti app
- **Installazione automatica** sui dispositivi target
- **Configurazione dei dispositivi** destinatari
- **Report dettagliato** sullo stato degli update

### 📊 Activity Logs
- **Cronologia completa** di tutte le attività
- **Filtri avanzati** per tipo, stato e periodo
- **Export in CSV** per analisi esterne
- **Ricerca full-text** negli eventi

### 🔑 Setup Tokens
- **Generazione di token** per il provisioning
- **QR Code automatici** per configurazione rapida
- **Gestione sicura** delle credenziali
- **Tracking dell'utilizzo** dei token

### 🏪 Configurazioni Store
- **Profili personalizzati** per ogni punto vendita
- **Configurazione WiFi** automatica
- **Impostazioni di sistema** predefinite
- **Orari di apertura** e shutdown automatico

### 🖨️ Template di Stampa
- **Template personalizzati** per le stampe
- **Configurazione per dispositivo** o store
- **Anteprima in tempo reale** dei template
- **Gestione formati** scontrini e etichette

---

## Dashboard Principale

La dashboard MDM offre una vista d'insieme completa di tutti i dispositivi della tua organizzazione.

### Statistiche in Tempo Reale

La parte superiore della dashboard mostra le statistiche aggregate:

- **📊 Totale Dispositivi**: Numero totale di dispositivi registrati
- **🟢 Online**: Dispositivi attualmente connessi
- **🔴 Offline**: Dispositivi non raggiungibili
- **🔒 Kiosk Attivo**: Dispositivi in modalità kiosk

### Mappa dei Dispositivi

Una mappa interattiva mostra la posizione geografica di tutti i dispositivi:

- **Marker colorati** indicano lo stato (verde=online, rosso=offline)
- **Click sul marker** per dettagli del dispositivo
- **Zoom e pan** per navigare tra le location

### Lista Dispositivi

Una griglia mostra tutti i dispositivi con informazioni essenziali:

- **Nome e Organizzazione**
- **Stato di connessione** in tempo reale
- **Livello batteria** e connessione WiFi
- **Ultima attività** registrata
- **Azioni rapide** disponibili

### Azioni Disponibili

Per ogni dispositivo puoi eseguire:

- 🔄 **Riavvia**: Riavvio completo del dispositivo
- 🔒 **Lock**: Blocco schermo remoto
- 🔓 **Unlock**: Sblocco schermo remoto
- 🔋 **Info Batteria**: Dettagli sullo stato della batteria
- 📍 **Localizza**: Visualizza posizione su mappa
- 🗑️ **Elimina**: Rimuovi dispositivo dalla piattaforma

---

## Come Iniziare

### 1. Registrazione Dispositivo

Per registrare un nuovo dispositivo:

1. Vai alla sezione **Setup Tokens**
2. Clicca su **Genera Token**
3. Compila i dati del dispositivo
4. Scarica il **QR Code** generato
5. Sul dispositivo Android, scansiona il QR Code nell'app Omnily Bridge

### 2. Configurazione Store

Prima di assegnare dispositivi:

1. Vai in **Configurazioni Store**
2. Clicca **Nuova Configurazione**
3. Compila:
   - Nome e codice store
   - Credenziali WiFi principale e backup
   - Fuso orario e lingua
   - Orari di apertura
   - App da installare automaticamente

### 3. Assegnazione e Monitoraggio

Una volta registrati:

1. I dispositivi appaiono nella **Dashboard**
2. Assegna il dispositivo al negozio corretto
3. Monitora lo stato in tempo reale
4. Configura gli **Alert** per notifiche automatiche

---

## Best Practices

### 🔐 Sicurezza

- **Rigenera i token** periodicamente
- **Limita l'accesso** ai soli utenti autorizzati
- **Monitora gli activity logs** per attività sospette
- **Usa configurazioni store** invece di configurare manualmente

### ⚡ Performance

- **Usa operazioni in blocco** per azioni su molti dispositivi
- **Programma gli update** negli orari di minor utilizzo
- **Attiva il rollout graduale** per update critici
- **Monitora la batteria** prima di operazioni pesanti

### 📊 Monitoraggio

- **Configura gli alert** per eventi critici
- **Rivedi regolarmente** gli activity logs
- **Mantieni aggiornato** il repository app
- **Verifica lo stato** dei dispositivi giornalmente

---

## Prossimi Passi

Continua a esplorare le sezioni specifiche del manuale per approfondire ogni funzionalità della piattaforma MDM.
