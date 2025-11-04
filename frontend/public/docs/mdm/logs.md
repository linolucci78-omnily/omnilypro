# Activity Logs

## Panoramica

Gli **Activity Logs** registrano ogni attività eseguita sulla piattaforma MDM. Essenziali per audit, troubleshooting e compliance.

---

## Come Accedere ai Log

### Passo 1: Apri Activity Logs

1. Accedi alla dashboard OmnilyPro
2. Vai in **Dashboard Admin → MDM**
3. Clicca sulla tab **Activity Logs**
4. Visualizzi la schermata principale dei log

### Passo 2: Comprendi l'Interfaccia

L'interfaccia è divisa in:

```
┌─────────────────────────────────────────────┐
│ [🔍 Cerca log...]         [Esporta CSV ↓]  │ ← Header
├─────────────────────────────────────────────┤
│ Filtri:                                     │
│ [Tutti ▼] [Ultimo Mese ▼] [Tutti Utenti ▼] │ ← Filtri
├─────────────────────────────────────────────┤
│ 📋 LISTA LOG                                │
│ ┌─────────────────────────────────────────┐ │
│ │ ⏰ 15/01/2024 14:30:25                  │ │
│ │ 📱 Comando Eseguito                     │ │
│ │ POS-Milano-01 • Riavvio • Success      │ │
│ │ Utente: admin@omnily.com               │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ⏰ 15/01/2024 14:28:12                  │ │
│ │ 📦 App Installata                       │ │
│ │ POS-Roma-02 • com.omnily.pos v1.2.3    │ │
│ │ Utente: mario.rossi@store.com          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [← Precedente]  Pagina 1 di 45  [Avanti →] │ ← Paginazione
└─────────────────────────────────────────────┘
```

---

## Cercare nei Log

### Ricerca Testuale

La barra di ricerca cerca in tutti i campi:

**Esempio 1: Cerca per Dispositivo**
```
🔍 Ricerca: "POS-Milano-01"

Risultati:
• 15/01 14:30 - Comando Eseguito: Riavvio
• 15/01 12:15 - App Installata: com.omnily.pos
• 14/01 23:00 - Configurazione Applicata: Store Milano
• 14/01 18:45 - Alert Generato: Batteria bassa
```

**Esempio 2: Cerca per Tipo Operazione**
```
🔍 Ricerca: "installata"

Risultati: Tutti i log di installazione app
```

**Esempio 3: Cerca per Utente**
```
🔍 Ricerca: "admin@omnily.com"

Risultati: Tutte le azioni eseguite da questo utente
```

**Esempio 4: Cerca per Package Name**
```
🔍 Ricerca: "com.omnily.pos"

Risultati: Tutti i log relativi a questa app
```

### Suggerimenti Ricerca

- **Usa parole chiave specifiche**: "riavvio", "installata", "alert"
- **Cerca nomi esatti**: Nome dispositivo completo
- **Case insensitive**: "milano" trova "Milano" e "MILANO"
- **Cerca in note**: Anche le note dettagliate vengono cercate

---

## Filtrare i Log

### Filtro per Tipo

Clicca sul dropdown **"Tipo"** e seleziona:

```
┌─────────────────────────────────┐
│ Tipo di Evento                  │
├─────────────────────────────────┤
│ ○ Tutti                         │ ← Default
│ ─────────────────────────────── │
│ ○ 📱 Comando Eseguito           │
│ ○ 📦 App Installata             │
│ ○ 📦 App Aggiornata             │
│ ○ 🗑️ App Disinstallata          │
│ ○ ⚙️ Configurazione Applicata    │
│ ○ 🔔 Alert Generato             │
│ ○ ✅ Alert Confermato           │
│ ○ 📅 Comando Programmato        │
│ ○ 🔑 Token Generato             │
│ ○ 🔑 Token Utilizzato           │
│ ○ 📍 Posizione Aggiornata       │
│ ○ 🔄 Dispositivo Registrato     │
│ ○ 🗑️ Dispositivo Eliminato      │
│ ○ 👤 Login Utente               │
│ ○ 🚪 Logout Utente              │
└─────────────────────────────────┘
```

**Esempio**:
- Seleziona "App Installata" → Vedi solo installazioni app

### Filtro per Periodo

Clicca sul dropdown **"Periodo"** e seleziona:

```
┌─────────────────────────────────┐
│ Periodo                         │
├─────────────────────────────────┤
│ ○ Ultima Ora                    │
│ ○ Ultime 24 Ore                 │
│ ○ Ultimi 7 Giorni               │
│ ● Ultimo Mese                   │ ← Default
│ ○ Ultimi 3 Mesi                 │
│ ○ Ultimo Anno                   │
│ ─────────────────────────────── │
│ ○ Periodo Personalizzato        │
│   📅 Dal:  [01/01/2024]        │
│   📅 Al:   [31/01/2024]        │
│   [Applica]                     │
└─────────────────────────────────┘
```

**Esempio**:
- Seleziona "Ultime 24 Ore" → Vedi attività recente
- Seleziona "Personalizzato" → Scegli date specifiche per report

### Filtro per Stato

Clicca sul dropdown **"Stato"**:

```
┌─────────────────────────────────┐
│ Stato Operazione                │
├─────────────────────────────────┤
│ ○ Tutti                         │
│ ○ ✅ Success                    │ ← Completate con successo
│ ○ ❌ Failed                     │ ← Con errori
│ ○ ⏳ Pending                    │ ← In attesa
│ ○ ⏸️ Queued                     │ ← In coda
└─────────────────────────────────┘
```

**Esempio**:
- Seleziona "Failed" → Vedi solo operazioni con errori

### Filtro per Utente

Clicca sul dropdown **"Utente"**:

```
┌─────────────────────────────────┐
│ Utente                          │
├─────────────────────────────────┤
│ ○ Tutti gli Utenti              │
│ ─────────────────────────────── │
│ ○ admin@omnily.com              │
│ ○ mario.rossi@store.com         │
│ ○ laura.bianchi@store.com       │
│ ○ sistema (automatico)          │
└─────────────────────────────────┘
```

**Esempio**:
- Seleziona utente specifico → Vedi solo sue azioni

### Combinare Filtri

Puoi combinare più filtri:

**Scenario 1: Debug Errori Installazione**
```
Tipo: App Installata
Stato: Failed
Periodo: Ultime 24 Ore
→ Risultato: Solo installazioni fallite oggi
```

**Scenario 2: Audit Utente Specifico**
```
Utente: admin@omnily.com
Periodo: Ultimo Mese
Tipo: Tutti
→ Risultato: Tutte le azioni dell'admin nel mese
```

**Scenario 3: Monitoraggio Dispositivo**
```
Ricerca: "POS-Milano-01"
Periodo: Ultimi 7 Giorni
Tipo: Tutti
→ Risultato: Storico completo dispositivo ultima settimana
```

### Azzerare Filtri

Clicca **"Azzera Filtri"** per tornare alla vista completa.

---

## Visualizzare Dettagli Log

### Cliccare su un Log

1. **Clicca su qualsiasi riga** nella lista log
2. Si apre un pannello laterale con dettagli completi

### Schermata Dettaglio

```
╔════════════════════════════════════════╗
║ DETTAGLI LOG                           ║
╠════════════════════════════════════════╣
║ ID: log-uuid-12345678                  ║
║ Tipo: 📦 App Installata                ║
║ Timestamp: 15/01/2024 14:30:25         ║
║ Stato: ✅ Success                      ║
║                                        ║
║ ─────────────────────────────────────  ║
║                                        ║
║ Dispositivo:                           ║
║ • Nome: POS-Milano-01                  ║
║ • Store: Milano Centro                 ║
║ • ID: device-uuid-001                  ║
║                                        ║
║ ─────────────────────────────────────  ║
║                                        ║
║ Operazione:                            ║
║ • App: Omnily POS                      ║
║ • Package: com.omnily.pos              ║
║ • Versione: 1.2.3                      ║
║ • Metodo: Auto Update                  ║
║                                        ║
║ ─────────────────────────────────────  ║
║                                        ║
║ Utente:                                ║
║ • Email: admin@omnily.com              ║
║ • Ruolo: Super Admin                   ║
║ • IP: 192.168.1.100                    ║
║                                        ║
║ ─────────────────────────────────────  ║
║                                        ║
║ Timing:                                ║
║ • Avviato: 14:30:25                    ║
║ • Completato: 14:32:59                 ║
║ • Durata: 2m 34s                       ║
║                                        ║
║ ─────────────────────────────────────  ║
║                                        ║
║ Dettagli Tecnici:                      ║
║ ```json                                ║
║ {                                      ║
║   "download_size": "45 MB",            ║
║   "download_time": "1m 23s",           ║
║   "install_time": "1m 11s",            ║
║   "network": "wifi",                   ║
║   "bandwidth": "547 KB/s"              ║
║ }                                      ║
║ ```                                    ║
║                                        ║
║ Note:                                  ║
║ Installazione completata con successo. ║
║ App avviata e funzionante.             ║
╚════════════════════════════════════════╝

[📋 Copia Dettagli]  [✉️ Segnala Problema]  [✕ Chiudi]
```

### Azioni Disponibili

Nel pannello dettaglio:

1. **📋 Copia Dettagli**: Copia JSON completo negli appunti
2. **✉️ Segnala Problema**: Apre ticket supporto con log allegato
3. **🔗 Vai al Dispositivo**: Apre pagina dettaglio dispositivo
4. **↻ Retry Operazione**: Se fallita, permette retry

---

## Esportare i Log

### Esportazione CSV

#### Passo 1: Configura Vista

Prima di esportare, configura filtri per ottenere i dati desiderati:

```
Esempio: Export installazioni fallite ultimo mese

1. Tipo: App Installata
2. Stato: Failed
3. Periodo: Ultimo Mese
4. Risultati: 23 log trovati
```

#### Passo 2: Clicca "Esporta CSV"

Clicca il pulsante **"Esporta CSV"** in alto a destra.

#### Passo 3: Configura Export

Si apre dialog di configurazione:

```
┌─────────────────────────────────────┐
│ ESPORTA ACTIVITY LOGS               │
├─────────────────────────────────────┤
│                                     │
│ Cosa esportare:                     │
│ ○ Solo risultati visibili (23 log) │
│ ● Tutti i log con filtri (23 log)  │
│ ○ Tutti i log senza filtri (15.234)│
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Campi da includere:                 │
│ ☑ Timestamp                         │
│ ☑ Tipo Evento                       │
│ ☑ Dispositivo                       │
│ ☑ Store                             │
│ ☑ Utente                            │
│ ☑ Stato                             │
│ ☑ Dettagli                          │
│ ☐ IP Address (privacy)             │
│ ☐ JSON Tecnico Completo             │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Nome File:                          │
│ [activity_logs_2024_01_15.csv]     │
│                                     │
│ Formato:                            │
│ ● CSV (Excel)                       │
│ ○ CSV (UTF-8)                       │
│                                     │
│ [Annulla]  [Esporta →]             │
└─────────────────────────────────────┘
```

#### Passo 4: Clicca "Esporta"

Il file CSV viene scaricato:

```csv
timestamp,tipo,dispositivo,store,utente,stato,dettagli
2024-01-15 14:30:25,App Installata,POS-Milano-01,Milano Centro,admin@omnily.com,Failed,Storage insufficiente
2024-01-15 12:15:30,App Installata,POS-Roma-02,Roma Termini,sistema,Failed,Dispositivo offline
2024-01-14 23:45:12,App Installata,POS-Milano-03,Milano Centro,admin@omnily.com,Failed,Firma APK invalida
...
```

#### Passo 5: Apri in Excel

1. Apri il file CSV con Excel
2. I dati sono formattati in colonne
3. Puoi applicare filtri, pivot table, grafici
4. Usa per analisi e report

### Esportazione per Periodo

**Scenario Comune**: Report mensile per management

```
Configurazione:
1. Periodo: Personalizzato (01/01/2024 - 31/01/2024)
2. Tipo: Tutti
3. Stato: Tutti
4. Esporta CSV
5. Risultato: activity_logs_gennaio_2024.csv
```

Apri in Excel e crea:
- Grafico installazioni per giorno
- Top 10 dispositivi più attivi
- Distribuzione successi/fallimenti
- Timeline operazioni critiche

---

## Tipi di Log Registrati

### Log Dispositivi

```
📱 Dispositivo Registrato
├─ Quando: Nuovo dispositivo aggiunto
├─ Info: Nome, store, token usato
└─ Utente: Chi ha generato il token

📍 Posizione Aggiornata
├─ Quando: GPS refresh richiesto/automatico
├─ Info: Coordinate, accuratezza
└─ Utente: Sistema o manuale

🔄 Comando Eseguito
├─ Quando: Comando remoto completato
├─ Info: Tipo comando, risultato, durata
└─ Utente: Chi ha inviato comando

🗑️ Dispositivo Eliminato
├─ Quando: Dispositivo rimosso
├─ Info: Motivo eliminazione
└─ Utente: Chi ha eliminato (CRITICO)
```

### Log Applicazioni

```
📦 App Installata
├─ Quando: Installazione completata
├─ Info: Package, versione, metodo
└─ Utente: Chi ha avviato install

📦 App Aggiornata
├─ Quando: Update completato
├─ Info: Versione old → new
└─ Utente: Sistema o manuale

🗑️ App Disinstallata
├─ Quando: App rimossa
├─ Info: Package, motivo
└─ Utente: Chi ha richiesto rimozione
```

### Log Configurazioni

```
⚙️ Configurazione Store Applicata
├─ Quando: Config applicata a dispositivo
├─ Info: Quale config, override
└─ Utente: Chi ha applicato

🔧 Impostazioni Modificate
├─ Quando: Cambio impostazioni dispositivo
├─ Info: Cosa cambiato (before/after)
└─ Utente: Chi ha modificato

🔐 Modalità Kiosk Attivata/Disattivata
├─ Quando: Toggle kiosk mode
├─ Info: App kiosk, impostazioni
└─ Utente: Chi ha cambiato
```

### Log Alert

```
🔔 Alert Generato
├─ Quando: Sistema rileva problema
├─ Info: Tipo alert, gravità, valore
└─ Utente: Sistema automatico

✅ Alert Confermato
├─ Quando: Admin conferma alert
├─ Info: Note conferma
└─ Utente: Chi ha confermato

✔️ Alert Risolto
├─ Quando: Problema risolto
├─ Info: Come risolto
└─ Utente: Sistema o manuale
```

### Log Comandi Programmati

```
📅 Comando Programmato Creato
├─ Quando: Nuovo comando schedulato
├─ Info: Comando, orario, dispositivi
└─ Utente: Chi ha programmato

▶️ Comando Programmato Eseguito
├─ Quando: Comando scheduler eseguito
├─ Info: Risultato esecuzione
└─ Utente: Sistema scheduler

🗑️ Comando Programmato Eliminato
├─ Quando: Comando scheduler cancellato
├─ Info: Motivo cancellazione
└─ Utente: Chi ha cancellato
```

### Log Autenticazione

```
👤 Login Utente
├─ Quando: Utente accede
├─ Info: IP, browser, dispositivo
└─ Utente: Email utente

🚪 Logout Utente
├─ Quando: Utente esce
├─ Info: Durata sessione
└─ Utente: Email utente

🔒 Login Fallito
├─ Quando: Tentativo login errato
├─ Info: IP, motivo (password errata, account bloccato)
└─ Utente: Email tentativo (SICUREZZA)
```

### Log Token

```
🔑 Token Setup Generato
├─ Quando: Nuovo token creato
├─ Info: Per quale dispositivo/store
└─ Utente: Chi ha generato

🔑 Token Setup Utilizzato
├─ Quando: Token usato per registrazione
├─ Info: Dispositivo registrato
└─ Utente: Sistema

❌ Token Setup Scaduto/Revocato
├─ Quando: Token invalidato
├─ Info: Motivo (scadenza, revoca manuale)
└─ Utente: Sistema o admin
```

---

## Use Case Pratici

### Use Case 1: Investigare Errore Installazione

**Scenario**: Un'app non si installa su alcuni dispositivi.

**Procedura**:
1. Vai in Activity Logs
2. **Filtri**:
   - Tipo: "App Installata"
   - Stato: "Failed"
   - Periodo: "Ultime 24 Ore"
3. Ricerca: nome package app
4. **Analizza risultati**:
   - Quanti dispositivi falliti? (es. 5/50 = 10%)
   - Stesso errore o diversi?
   - Pattern comune? (stesso store, stesso modello)
5. **Clicca su log fallito**
6. **Leggi dettagli errore**:
   - "Storage insufficiente" → Libera spazio
   - "Firma invalida" → Ricompila APK
   - "Permessi negati" → Concedi permessi
7. **Risolvi e retry**

### Use Case 2: Audit Attività Utente

**Scenario**: Verificare cosa ha fatto un utente specifico.

**Procedura**:
1. Vai in Activity Logs
2. **Filtro Utente**: Seleziona l'utente
3. **Periodo**: Scegli range (es. Ultimo Mese)
4. **Analizza attività**:
   ```
   Timeline:
   15/01 14:30 - Installato app su 5 dispositivi
   15/01 12:00 - Modificato config store Milano
   14/01 18:00 - Eliminato dispositivo POS-Test-01
   14/01 16:00 - Generato 3 token setup
   ```
5. **Esporta CSV** per report formale

### Use Case 3: Monitoraggio Performance Dispositivo

**Scenario**: Analizzare lo storico di un dispositivo problematico.

**Procedura**:
1. Vai in Activity Logs
2. **Ricerca**: "POS-Milano-01"
3. **Periodo**: Ultimi 7 Giorni
4. **Analizza eventi**:
   ```
   Pattern rilevato:
   - Riavvio ogni giorno (normale)
   - 5 alert batteria bassa (ANOMALO)
   - 3 app crashate (PROBLEMA)
   - 2 disconnessioni WiFi (RETE?)
   ```
5. **Identifica problema**: Batteria degradata
6. **Azione**: Sostituisci dispositivo

### Use Case 4: Report Compliance

**Scenario**: Generare report per audit di sicurezza.

**Procedura**:
1. Vai in Activity Logs
2. **Periodo**: Personalizzato (es. Q1 2024)
3. **Esporta CSV completo**
4. **In Excel, filtra**:
   - Login falliti (tentativi intrusione?)
   - Dispositivi eliminati (chi, quando, perché?)
   - Token generati (provisioning corretto?)
   - Modifiche config critiche
5. **Crea report formattato**
6. **Presenta a compliance team**

---

## Best Practices

### 📊 Monitoraggio Regolare

- **Rivedi log giornalmente** per attività anomale
- **Configura dashboard** con filtri più usati
- **Bookmark query comuni** (es. "Errori Oggi")
- **Imposta alert** per pattern critici

### 🔍 Troubleshooting

- **Inizia sempre dai log** per debugging
- **Cerca pattern** non singoli eventi
- **Confronta timestamp** con altri eventi
- **Usa dettagli tecnici** per analisi profonda

### 🔐 Sicurezza e Compliance

- **Log NON possono essere eliminati** (immutabili)
- **Retention**: 12 mesi di default, estendibile
- **Export regolare** per backup esterni
- **Access control**: Solo admin possono vedere tutti i log

### 📋 Documentazione

- **Esporta log critici** come documentazione
- **Annota decisioni** nei ticket di supporto
- **Crea knowledge base** da errori ricorrenti
- **Condividi con team** problemi e soluzioni

---

## Troubleshooting

### Log Non Visualizzati

**Problema**: Non vedo alcuni log che dovrebbero esistere

**Cause Possibili**:
1. Filtri troppo restrittivi
2. Permessi utente limitati
3. Log più vecchi del retention period

**Soluzioni**:
1. Clicca "Azzera Filtri"
2. Verifica i tuoi permessi con admin
3. Controlla data evento vs retention policy

### Esportazione CSV Fallita

**Problema**: Export CSV non completa o file corrotto

**Soluzioni**:
1. Riduci range di date (troppi log?)
2. Prova browser diverso
3. Disabilita estensioni browser
4. Contatta supporto se > 50.000 log

### Ricerca Non Trova Risultati

**Problema**: Ricerca non trova log che so esistere

**Soluzioni**:
1. Verifica spelling (case insensitive ma deve essere corretto)
2. Usa termini più generici ("Milano" invece di "POS-Milano-01")
3. Azzera filtri prima di cercare
4. Prova ricerca nel pannello dettaglio export

---

## FAQ

**Q: Quanto vengono conservati i log?**
A: 12 mesi di default. Log più vecchi vengono archiviati e richiedono richiesta speciale.

**Q: Posso eliminare un log?**
A: No, i log sono immutabili per compliance e audit. Solo admin sistema può archiviare.

**Q: I log includono dati sensibili?**
A: Sì (IP, email). Accesso limitato a admin. Rispetta GDPR con anonimizzazione su richiesta.

**Q: Quanti log posso esportare contemporaneamente?**
A: Fino a 50.000 log per export. Per più, contatta supporto per export batch.

**Q: I log sono in tempo reale?**
A: Sì, ritardo massimo 5 secondi dalla generazione evento alla visualizzazione.

**Q: Posso creare alert automatici basati su log?**
A: Sì, vai in Impostazioni → Alert Personalizzati per configurare trigger su pattern log.
