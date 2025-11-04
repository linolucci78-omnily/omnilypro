# Gestione Dispositivi

## Panoramica

La sezione **Gestione Dispositivi** è il cuore del sistema MDM. Qui puoi visualizzare, monitorare e controllare tutti i dispositivi Android POS della tua organizzazione.

---

## Visualizzazione Dispositivi

### Griglia Dispositivi

I dispositivi sono mostrati in una griglia con card interattive. Ogni card mostra:

- **📱 Nome Dispositivo**: Nome identificativo assegnato
- **🏢 Store/Organizzazione**: Punto vendita associato
- **🟢/🔴 Stato**: Online (verde) / Offline (rosso)
- **🔋 Batteria**: Livello percentuale con icona colorata
- **📶 WiFi**: Stato della connessione di rete
- **📍 Posizione**: Coordinate GPS se disponibili
- **⏰ Ultima Attività**: Timestamp dell'ultima comunicazione

### Filtri e Ricerca

#### Barra di Ricerca
Cerca dispositivi per:
- Nome dispositivo
- Nome store
- Nome organizzazione

#### Filtri Rapidi
- **Tutti**: Mostra tutti i dispositivi
- **Online**: Solo dispositivi attivi
- **Offline**: Solo dispositivi non raggiungibili
- **Batteria Bassa**: Dispositivi con batteria < 20%

---

## Azioni sui Dispositivi

### Azioni Singole

Clicca sui pulsanti nella card del dispositivo per:

#### 🔄 Riavvia
Riavvia il dispositivo remotamente
- **Quando usarlo**: Dopo aggiornamenti o problemi di performance
- **Tempo**: ~2 minuti per riavvio completo
- **Nota**: Il dispositivo sarà offline durante il riavvio

#### 🔒 Lock
Blocca lo schermo del dispositivo
- **Quando usarlo**: Per sicurezza o manutenzione
- **Effetto**: Lo schermo si blocca immediatamente
- **Sblocco**: Usa l'azione Unlock o PIN sul dispositivo

#### 🔓 Unlock
Sblocca lo schermo del dispositivo
- **Quando usarlo**: Dopo un lock remoto
- **Effetto**: Lo schermo si sblocca immediatamente

#### 🔋 Info Batteria
Visualizza dettagli estesi sulla batteria:
- Percentuale esatta
- Stato di carica
- Salute della batteria
- Temperatura
- Voltaggio

#### 📍 Localizza
Mostra la posizione del dispositivo sulla mappa
- Coordinate GPS precise
- Indirizzo approssimativo
- Zoom automatico sulla posizione

#### 🗑️ Elimina
Rimuove il dispositivo dalla piattaforma
- **⚠️ ATTENZIONE**: Azione irreversibile
- Elimina anche: token associati, comandi, log
- Richiede conferma con digitazione "ELIMINA"

---

## Aggiunta Nuovo Dispositivo

### Procedura Standard

1. **Genera Token Setup**
   - Vai in **Setup Tokens** → **Genera Token**
   - Compila i dati del dispositivo
   - Seleziona la configurazione store (opzionale)

2. **Scarica QR Code**
   - Clicca **Scarica QR Code**
   - Salva l'immagine o stampala

3. **Configura Dispositivo Android**
   - Installa **Omnily Bridge** sul dispositivo
   - Apri l'app e vai in **Setup**
   - Scansiona il QR Code

4. **Verifica Registrazione**
   - Torna alla **Dashboard MDM**
   - Il dispositivo dovrebbe apparire entro 30 secondi
   - Stato iniziale: 🟢 Online

### Procedura Alternativa (Manuale)

Se non puoi usare il QR Code:

1. Installa Omnily Bridge sul dispositivo
2. Apri l'app → **Setup Manuale**
3. Inserisci:
   - **Server URL**: `https://omnilypro.com`
   - **Token**: Copia il token dalla piattaforma
   - **Device ID**: Generato automaticamente
4. Clicca **Registra**

---

## Mappa dei Dispositivi

### Visualizzazione

La mappa mostra la posizione geografica di tutti i dispositivi:

- **Marker Verde** 🟢: Dispositivo online
- **Marker Rosso** 🔴: Dispositivo offline
- **Marker Arancione** 🟠: Dispositivo con batteria bassa

### Interazioni

- **Click sul Marker**: Apre popup con info dispositivo
- **Zoom/Pan**: Naviga liberamente sulla mappa
- **Cluster**: I marker vicini si raggruppano automaticamente

### Aggiornamento Posizione

La posizione si aggiorna:
- **Automaticamente** ogni 5 minuti (se dispositivo online)
- **Manualmente** con il comando "Aggiorna Posizione"
- **In tempo reale** durante tracking attivo

---

## Dettagli Dispositivo

### Informazioni Sistema

Clicca su un dispositivo per vedere:

- **Sistema Operativo**: Versione Android
- **Modello**: Marca e modello hardware
- **IMEI**: Codice identificativo univoco
- **Numero Seriale**: Serial number del dispositivo
- **MAC Address**: Indirizzo di rete

### Informazioni App

- **Omnily Bridge**: Versione installata
- **App Installate**: Lista completa delle app
- **Ultimo Aggiornamento**: Data ultimo update

### Configurazione Corrente

- **Store Assegnato**: Nome punto vendita
- **Configurazione Store**: Profilo applicato
- **Modalità Kiosk**: Attiva/Disattiva
- **App Kiosk**: App mostrata in modalità kiosk

---

## Monitoraggio Performance

### Metriche in Tempo Reale

Monitora le performance con:

- **📊 CPU Usage**: Utilizzo processore
- **💾 RAM Usage**: Memoria utilizzata
- **📁 Storage**: Spazio disco disponibile
- **🌡️ Temperatura**: Temperatura dispositivo

### Alert Automatici

Il sistema genera alert automatici per:

- **Batteria < 20%**: Alert batteria bassa
- **Offline > 1h**: Dispositivo non raggiungibile
- **Temperatura > 60°C**: Surriscaldamento
- **Storage < 10%**: Spazio disco insufficiente

---

## Best Practices

### 📋 Convenzioni di Naming

Usa nomi descrittivi per i dispositivi:
- ✅ `POS-Milano-Duomo-01`
- ✅ `POS-Roma-Termini-Cassa3`
- ❌ `Device123`
- ❌ `Android 1`

### 🔄 Manutenzione Regolare

- **Riavvia settimanalmente** per ottimizzare performance
- **Monitora la batteria** su dispositivi sempre accesi
- **Verifica aggiornamenti** app e sistema operativo
- **Pulisci storage** se necessario (cache, log vecchi)

### 🔐 Sicurezza

- **Non condividere** i token di setup
- **Lock remoto** se dispositivo perso/rubato
- **Elimina** dispositivi non più in uso
- **Monitora** gli accessi negli activity logs

### 📊 Monitoraggio Proattivo

- Controlla la **dashboard quotidianamente**
- Configura **alert email/SMS** per eventi critici
- Mantieni aggiornata la **posizione** dei dispositivi
- Documenta i **problemi ricorrenti**

---

## Troubleshooting

### Dispositivo Offline

**Problema**: Il dispositivo appare offline ma è acceso

**Soluzioni**:
1. Verifica connessione WiFi sul dispositivo
2. Controlla che Omnily Bridge sia in esecuzione
3. Riavvia l'app Omnily Bridge
4. Riavvia il dispositivo
5. Rigenera e applica nuovo token setup

### Batteria Scarica Rapidamente

**Problema**: La batteria si scarica molto velocemente

**Soluzioni**:
1. Chiudi app in background non necessarie
2. Riduci la luminosità schermo
3. Disattiva GPS se non necessario
4. Verifica temperatura dispositivo
5. Considera sostituzione batteria

### Posizione Non Aggiornata

**Problema**: La posizione GPS non si aggiorna

**Soluzioni**:
1. Verifica permessi GPS nell'app
2. Attiva il GPS nelle impostazioni Android
3. Sposta il dispositivo vicino a una finestra
4. Riavvia il servizio di localizzazione
5. Forza aggiornamento posizione da dashboard

---

## FAQ

**Q: Quanti dispositivi posso gestire?**
A: Non ci sono limiti tecnici. La piattaforma scala automaticamente.

**Q: Posso gestire dispositivi iOS?**
A: Al momento solo Android è supportato. iOS in roadmap.

**Q: I comandi sono istantanei?**
A: Sì, se il dispositivo è online. Altrimenti vengono accodati.

**Q: Posso recuperare un dispositivo eliminato?**
A: No, l'eliminazione è permanente. Dovrai registrarlo nuovamente.

**Q: Come esporto la lista dispositivi?**
A: Usa il pulsante "Esporta CSV" nella dashboard principale.
