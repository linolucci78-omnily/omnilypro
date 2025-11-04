# Push Update App

## Panoramica

Il **Push Update App** permette di distribuire aggiornamenti di applicazioni in modo controllato e immediato su dispositivi specifici o gruppi di dispositivi.

---

## Come Accedere

### Passo 1: Apri Dashboard MDM

1. Accedi alla piattaforma OmnilyPro
2. Vai nella sezione **Dashboard Admin**
3. Clicca sulla tab **MDM**
4. Seleziona **Push Update App** dal menu

### Passo 2: Visualizza Interfaccia

L'interfaccia mostra:
- **Header con pulsante "Push Update"** (in alto a destra)
- **Lista app disponibili** nel repository
- **Statistiche distribuzione** per ogni app
- **Ricerca e filtri** per trovare app rapidamente

---

## Eseguire un Push Update

### Guida Completa Step-by-Step

#### PASSO 1: Clicca "Push Update"

1. In alto a destra, clicca il pulsante blu **"Push Update"**
2. Si apre una modale con il wizard di configurazione

#### PASSO 2: Seleziona l'App

Nella prima sezione del wizard:

1. **Cerca l'app** usando la barra di ricerca:
   - Digita il nome dell'app (es. "Omnily POS")
   - Oppure il package name (es. "com.omnily.pos")

2. **Clicca sull'app** dalla lista risultati

3. **Seleziona la versione**:
   - **Latest**: Installa l'ultima versione disponibile
   - **Specifica**: Scegli una versione precisa dal dropdown

   ```
   App Selezionata: Omnily POS
   Package: com.omnily.pos
   Versione: 1.2.3 (Latest)
   Dimensione: 45 MB
   Note Rilascio: Fix bug + nuove feature
   ```

4. **Visualizza info versione**:
   - Data di rilascio
   - Note di rilascio complete
   - Numero di installazioni correnti
   - Dimensione download

5. **Clicca "Avanti"** per procedere

#### PASSO 3: Seleziona Dispositivi Target

Scegli quali dispositivi devono ricevere l'update:

**Metodo A: Selezione Manuale**

1. Visualizzi la lista completa di tutti i dispositivi
2. Usa la **barra di ricerca** per filtrare:
   ```
   🔍 Cerca: "Milano"
   Risultati: 12 dispositivi trovati
   ```

3. **Seleziona dispositivi** con le checkbox:
   - Spunta i dispositivi uno per uno
   - Oppure usa "Seleziona Tutti Visibili"

4. I dispositivi selezionati vengono evidenziati in blu
5. In alto vedi: **"8 dispositivi selezionati"**

**Metodo B: Filtra per Gruppo**

1. Clicca su **"Filtri Avanzati"**
2. Seleziona criteri:

   ```
   📍 Store: [Seleziona Store]
   └─ Milano Centro
   └─ Milano Duomo
   └─ Roma Termini

   🏢 Organizzazione: [Seleziona Org]
   └─ Retail Nord
   └─ Retail Centro

   📱 Stato:
   ☑ Online
   ☑ Offline (update verrà accodato)

   🔋 Batteria:
   ☑ > 50% (consigliato)
   ☐ > 30%
   ☐ Qualsiasi

   📦 Versione App Corrente:
   ☑ < 1.2.3 (solo chi necessita update)
   ☐ Tutte
   ```

3. Clicca **"Applica Filtri"**
4. Sistema mostra dispositivi che corrispondono
5. Vedi: **"15 dispositivi corrispondono ai filtri"**
6. Puoi affinare la selezione manualmente

**Metodo C: Import da File**

1. Clicca **"Importa Lista"**
2. **Scarica template CSV** (opzionale):
   ```csv
   device_name
   POS-Milano-01
   POS-Milano-02
   POS-Roma-01
   ```

3. **Prepara il tuo file CSV**:
   - Usa editor testo o Excel
   - Prima riga: intestazione `device_name` o `device_id`
   - Righe successive: un dispositivo per riga

4. **Carica il file**:
   - Clicca "Seleziona File"
   - Scegli il tuo CSV
   - Sistema valida il file

5. **Rivedi anteprima**:
   ```
   ✅ 10 dispositivi validi
   ⚠️ 2 dispositivi non trovati (verranno ignorati)

   Anteprima:
   - POS-Milano-01 (Online)
   - POS-Milano-02 (Online)
   - POS-Roma-01 (Offline - verrà accodato)
   ...
   ```

6. Clicca **"Conferma Selezione"**

**Anteprima Selezione Finale**

Prima di procedere, rivedi:

```
╔══════════════════════════════════════╗
║ RIEPILOGO SELEZIONE                  ║
╠══════════════════════════════════════╣
║ Totale dispositivi: 15               ║
║ Online: 12                           ║
║ Offline: 3 (update accodato)         ║
║                                      ║
║ Store coinvolti:                     ║
║ • Milano Centro (8 dispositivi)      ║
║ • Roma Termini (7 dispositivi)       ║
╚══════════════════════════════════════╝
```

Clicca **"Avanti"** per continuare

#### PASSO 4: Configura Modalità Update

Scegli come eseguire l'aggiornamento:

**A. Timing**

```
┌─────────────────────────────────────┐
│ QUANDO ESEGUIRE UPDATE              │
├─────────────────────────────────────┤
│ ○ Immediato                         │
│   Esegue subito, appena possibile   │
│                                     │
│ ● Programmato                       │
│   📅 Data: [15/01/2024]            │
│   🕐 Ora:  [03:00]                 │
│   🌍 Fuso: Europe/Rome             │
│                                     │
│ ○ Alla Prossima Apertura            │
│   Update quando app viene aperta    │
└─────────────────────────────────────┘
```

**B. Metodo Installazione**

```
┌─────────────────────────────────────┐
│ METODO INSTALLAZIONE                │
├─────────────────────────────────────┤
│ ● Automatico                        │
│   Installa senza intervento utente  │
│   ☑ Chiudi app se aperta           │
│   ☑ Riavvia app dopo install       │
│                                     │
│ ○ Manuale                           │
│   Notifica utente, richiede conferma│
└─────────────────────────────────────┘
```

**C. Condizioni**

```
┌─────────────────────────────────────┐
│ PREREQUISITI                        │
├─────────────────────────────────────┤
│ ☑ Solo con WiFi                     │
│   Attende connessione WiFi          │
│   Risparmia dati mobile             │
│                                     │
│ ☑ Batteria > 30%                    │
│   Evita install con batteria bassa  │
│                                     │
│ ☑ Storage libero > 500MB            │
│   Verifica spazio sufficiente       │
│                                     │
│ ☐ Dispositivo idle                  │
│   Installa solo se non in uso       │
│   (opzionale, consigliato notte)    │
└─────────────────────────────────────┘
```

**D. Rollout Graduale** (Opzionale ma Consigliato)

```
┌─────────────────────────────────────┐
│ ROLLOUT GRADUALE                    │
├─────────────────────────────────────┤
│ ☑ Abilita rollout graduale          │
│                                     │
│ Fase 1: [10%] → Attendi [1] ora    │
│ Fase 2: [30%] → Attendi [1] ora    │
│ Fase 3: [60%] → Attendi [1] ora    │
│ Fase 4: [100%]                      │
│                                     │
│ Rollback automatico se:             │
│ • Crash rate > 5%                   │
│ • Install failure > 10%             │
│ • Dispositivi offline > 20%         │
└─────────────────────────────────────┘
```

Clicca **"Avanti"** per continuare

#### PASSO 5: Configura Notifiche

Scegli quando ricevere notifiche:

```
┌─────────────────────────────────────┐
│ NOTIFICHE                           │
├─────────────────────────────────────┤
│ ☑ Inizio push update                │
│   Email quando operazione parte     │
│                                     │
│ ☑ Completamento                     │
│   Notifica quando 100% completato   │
│                                     │
│ ☑ Errori critici                    │
│   Alert se > 10% fallimenti         │
│                                     │
│ ☐ Ogni fase completata              │
│   (se rollout graduale)             │
│                                     │
│ ☐ Ogni singolo dispositivo          │
│   (sconsigliato - troppo verbose)   │
│                                     │
│ Canali notifica:                    │
│ ☑ Email                             │
│ ☑ Notifica in-app                   │
│ ☐ SMS (solo errori critici)         │
└─────────────────────────────────────┘
```

Clicca **"Avanti"** per continuare

#### PASSO 6: Rivedi e Conferma

Ultima schermata di riepilogo completo:

```
╔════════════════════════════════════════╗
║ RIEPILOGO PUSH UPDATE                  ║
╠════════════════════════════════════════╣
║ App: Omnily POS                        ║
║ Versione: 1.2.3                        ║
║ Dimensione: 45 MB                      ║
║                                        ║
║ Target:                                ║
║ • 15 dispositivi selezionati           ║
║ • Store: Milano Centro, Roma Termini   ║
║                                        ║
║ Timing:                                ║
║ • Programmato: 15/01/2024 alle 03:00   ║
║                                        ║
║ Modalità:                              ║
║ • Installazione automatica             ║
║ • Solo WiFi                            ║
║ • Batteria > 30%                       ║
║ • Rollout graduale abilitato           ║
║                                        ║
║ Tempo stimato: ~2 ore                  ║
║ (considerando rollout graduale)        ║
╚════════════════════════════════════════╝

⚠️ ATTENZIONE:
• I dispositivi online riceveranno l'update
• I dispositivi offline lo riceveranno al reconnect
• L'app verrà chiusa durante l'installazione
• I dati app verranno preservati
```

**Due pulsanti finali**:

1. **← Indietro**: Torna a modificare configurazione
2. **Avvia Push Update →**: Conferma e avvia

Clicca **"Avvia Push Update"**

#### PASSO 7: Conferma Finale

Pop-up di conferma sicurezza:

```
┌─────────────────────────────────────┐
│ ⚠️  CONFERMA PUSH UPDATE            │
├─────────────────────────────────────┤
│                                     │
│ Stai per distribuire un aggiornamento│
│ a 15 dispositivi.                   │
│                                     │
│ L'operazione non può essere annullata│
│ una volta avviata (ma puoi fermarla).│
│                                     │
│ Digita "CONFERMA" per procedere:    │
│ [________________]                  │
│                                     │
│ [Annulla]  [Conferma Definitivo]   │
└─────────────────────────────────────┘
```

1. **Digita "CONFERMA"** nel campo di testo
2. Clicca **"Conferma Definitivo"**

#### RISULTATO

Vieni reindirizzato alla **Dashboard Monitoraggio**:

```
✅ Push Update Avviato!

Operazione ID: PU-20240115-001
Stato: In Corso
Iniziato: 15/01/2024 03:00:15
```

---

## Monitorare il Push Update

### Dashboard Monitoraggio Real-Time

Una volta avviato, monitora il progresso:

#### Statistiche Globali (Header)

```
╔══════════════════════════════════════════════╗
║ 📊 PUSH UPDATE IN CORSO                      ║
╠══════════════════════════════════════════════╣
║ Progress: ████████░░░░ 60% (9/15 completati)║
║                                              ║
║ ✅ Successo:    9 dispositivi                ║
║ ⏳ In Corso:    3 dispositivi                ║
║ ❌ Falliti:     1 dispositivo                ║
║ ⏸️ In Attesa:   2 dispositivi                ║
║                                              ║
║ ⏱️ Tempo Trascorso:    01:23:45             ║
║ ⏱️ Tempo Stimato:      00:35:12 rimanenti   ║
║                                              ║
║ 📶 Banda Utilizzata:   420 MB                ║
║ 📊 Success Rate:       90% (9/10 completati)║
╚══════════════════════════════════════════════╝
```

#### Progress Bar Visuale

```
Fase Rollout:
[████████████] Fase 1 (10%) - Completata ✅
[████████████] Fase 2 (30%) - Completata ✅
[████████░░░░] Fase 3 (60%) - In Corso ⏳ (4/6)
[░░░░░░░░░░░░] Fase 4 (100%) - In Attesa ⏸️
```

#### Tabella Dettaglio Dispositivi

| Dispositivo | Store | Stato | Progress | Tempo | Errore |
|-------------|-------|--------|----------|-------|--------|
| POS-Milano-01 | Milano Centro | ✅ Completato | 100% | 2m 34s | - |
| POS-Milano-02 | Milano Centro | ⏳ Downloading | 65% | 1m 12s | - |
| POS-Milano-03 | Milano Centro | ⏳ Installing | 85% | 2m 01s | - |
| POS-Roma-01 | Roma Termini | ❌ Fallito | 0% | - | Storage pieno |
| POS-Roma-02 | Roma Termini | ⏸️ In Coda | 0% | - | Offline |
| POS-Milano-04 | Milano Centro | ✅ Completato | 100% | 3m 12s | - |

**Legenda Stati**:
- ✅ **Completato**: Update installato con successo
- ⏳ **Downloading**: Download APK in corso
- ⏳ **Installing**: Installazione in corso
- ⏳ **Verifying**: Verifica integrità APK
- ❌ **Fallito**: Errore durante operazione
- ⏸️ **In Coda**: In attesa di esecuzione
- ⏸️ **In Attesa**: Attesa condizioni (WiFi, batteria)

#### Log Real-Time

Streaming log delle operazioni:

```
[03:00:15] 🚀 Push Update avviato
[03:00:16] 📋 Target: 15 dispositivi
[03:00:17] 📦 App: com.omnily.pos v1.2.3
[03:00:18] ⚙️ Modalità: Rollout Graduale (10%)
[03:00:19]
[03:00:20] 📱 Fase 1: Selezione dispositivi (10% = 2 dispositivi)
[03:00:21] ✓ POS-Milano-01 selezionato
[03:00:22] ✓ POS-Milano-02 selezionato
[03:00:23]
[03:00:25] 📥 POS-Milano-01: Inizio download APK (45 MB)
[03:00:26] 📥 POS-Milano-02: Inizio download APK (45 MB)
[03:01:58] ✓ POS-Milano-01: Download completato
[03:01:59] 🔧 POS-Milano-01: Inizio installazione
[03:02:12] ✓ POS-Milano-02: Download completato
[03:02:13] 🔧 POS-Milano-02: Inizio installazione
[03:03:45] ✅ POS-Milano-01: Installazione completata!
[03:04:02] ✅ POS-Milano-02: Installazione completata!
[03:04:03]
[03:04:04] ✓ Fase 1 completata con successo (100%)
[03:04:05] ⏰ Attesa 1 ora prima della Fase 2...
```

### Azioni Disponibili Durante Monitoraggio

#### 1. Pausa Operazione

Clicca **"Pausa"** (pulsante in alto):
- Mette in pausa l'intero push update
- I download in corso vengono completati
- Nuovi dispositivi non partono
- Puoi riprendere quando vuoi

#### 2. Riprendi Operazione

Se in pausa, clicca **"Riprendi"**:
- L'operazione riprende da dove era rimasta
- I dispositivi in attesa ripartono
- Rispetta la configurazione originale

#### 3. Ferma Operazione

Clicca **"Ferma"** (attenzione!):
- Interrompe completamente il push update
- I download in corso vengono annullati
- I dispositivi già aggiornati restano aggiornati
- I dispositivi non ancora iniziati non riceveranno update

Conferma digitando "FERMA":
```
┌────────────────────────────────────┐
│ ⚠️ FERMARE PUSH UPDATE?            │
├────────────────────────────────────┤
│ Questa azione fermerà il push update│
│ definitivamente.                   │
│                                    │
│ • 9 dispositivi già aggiornati     │
│ • 6 dispositivi NON riceveranno    │
│   l'update                         │
│                                    │
│ Digita "FERMA" per confermare:    │
│ [______________]                   │
│                                    │
│ [Annulla]  [Ferma Definitivo]     │
└────────────────────────────────────┘
```

#### 4. Retry Dispositivi Falliti

Per i dispositivi con errori:

1. **Clicca sul dispositivo fallito** nella tabella
2. Visualizza dettagli errore:
   ```
   ╔═══════════════════════════════════╗
   ║ ERRORE: POS-Roma-01               ║
   ╠═══════════════════════════════════╣
   ║ Tipo: Storage insufficiente       ║
   ║ Codice: ERR_NO_SPACE              ║
   ║ Dettagli:                         ║
   ║ • Storage richiesto: 500 MB       ║
   ║ • Storage disponibile: 120 MB     ║
   ║ • Differenza: -380 MB             ║
   ╚═══════════════════════════════════╝
   ```

3. **Pulsanti disponibili**:
   - **Retry Ora**: Riprova immediatamente
   - **Libera Spazio**: Azione remota per liberare storage
   - **Retry Quando Pronto**: Riprova quando condizioni OK
   - **Salta Dispositivo**: Escludi da questo update

#### 5. Esporta Report

Clicca **"Esporta Report"**:

Scegli formato:
- **📄 PDF**: Report formattato con grafici
- **📊 CSV**: Tabella per analisi Excel
- **📋 JSON**: Dati strutturati per API

Il report include:
- Riepilogo operazione completo
- Statistiche finali
- Dettaglio per ogni dispositivo
- Timeline delle fasi
- Lista errori con dettagli
- Grafici distribuzione stati

---

## Gestire Errori Comuni

### Errore: Storage Insufficiente

**Cosa Fare**:

1. **Clicca sul dispositivo fallito**
2. **Clicca "Libera Spazio"**
3. Il sistema tenta automaticamente:
   - Pulizia cache app
   - Rimozione file temporanei
   - Rimozione log vecchi
4. **Dopo pulizia, clicca "Retry"**

Oppure manualmente:
1. Vai in **Gestione Dispositivi**
2. Trova il dispositivo
3. **Azioni → Pulisci Storage**
4. Torna al push update e retry

### Errore: Dispositivo Offline

**Cosa Fare**:

Il sistema accoderà automaticamente l'update:
- Update in attesa finché dispositivo torna online
- Validità: 7 giorni (configurabile)
- Non richiede azione da parte tua

Per forzare:
1. Attendi che dispositivo torni online
2. Verrà eseguito automaticamente
3. Oppure vai su dispositivo e clicca "Forza Sync"

### Errore: Firma APK Invalida

**Cosa Fare**:

Questo è un errore critico:

1. **Ferma l'intero push update** (clicca Ferma)
2. Vai in **Repository App**
3. **Rimuovi la versione problematica**
4. **Ricompila e firma correttamente l'APK**
5. **Carica nuovamente nel repository**
6. **Ricrea il push update**

### Errore: App in Uso

**Cosa Fare**:

Se app è in uso su dispositivo:

1. Sistema attende che app venga chiusa
2. Se configurato "Chiudi app se aperta":
   - Sistema chiude app forzatamente
   - Installa update
   - Riavvia app
3. Altrimenti:
   - Update resta in coda
   - Viene installato alla prossima chiusura app

---

## Best Practices

### 📋 Pianificazione

1. **Testa sempre su gruppo pilota**:
   - Seleziona 2-3 dispositivi di test
   - Esegui push update
   - Verifica funzionamento
   - Solo dopo, distribuisci a tutti

2. **Scegli orari appropriati**:
   - ✅ Notte (02:00-05:00): Negozi chiusi
   - ✅ Domenica notte: Minimo impatto
   - ❌ Ore di punta (12:00-14:00, 18:00-20:00)
   - ❌ Sabato: Giorno più trafficato

3. **Usa rollout graduale per update critici**:
   - Permette di rilevare problemi presto
   - Minimizza impatto se qualcosa va storto
   - Consigliato per: major version, refactoring, nuove feature

### 🔍 Monitoraggio

1. **Monitora attivamente durante rollout**:
   - Controlla dashboard ogni 15-30 minuti
   - Rivedi log per errori anomali
   - Verifica success rate > 90%

2. **Configura alert appropriati**:
   - ✅ Alert se failure rate > 10%
   - ✅ Notifica completamento
   - ❌ Non alert per ogni singolo dispositivo

3. **Mantieni storico**:
   - Esporta report di ogni push update
   - Documenta problemi riscontrati
   - Usa per migliorare prossimi update

### 🔐 Sicurezza

1. **Verifica sempre l'APK prima del push**:
   - Testa su dispositivi di test
   - Scansiona per malware
   - Verifica firma digitale

2. **Usa prerequisiti appropriati**:
   - Solo WiFi per app > 50MB
   - Batteria > 30% sempre
   - Storage libero sufficiente

3. **Backup prima di update maggiori**:
   - Configura backup automatico dati app
   - Permette rollback completo se necessario

---

## FAQ

**Q: Posso modificare un push update mentre è in corso?**
A: No, ma puoi metterlo in pausa, fermarlo, o fare retry sui falliti.

**Q: Cosa succede se un dispositivo si spegne durante l'installazione?**
A: L'installazione viene ripresa automaticamente al riavvio del dispositivo.

**Q: Posso fare rollback dopo un push update?**
A: Sì, puoi creare un nuovo push update con la versione precedente.

**Q: I dati dell'app vengono persi durante l'update?**
A: No, i dati app vengono preservati automaticamente. Solo l'APK viene sostituito.

**Q: Quanto tempo resta in coda un update per dispositivi offline?**
A: 7 giorni di default, configurabile fino a 30 giorni.

**Q: Posso programmare push update ricorrenti?**
A: Sì, salva la configurazione come template ricorrente (es. "Update settimanale").
