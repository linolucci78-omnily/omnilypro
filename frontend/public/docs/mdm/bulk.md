# Operazioni in Blocco

## Panoramica

Le **Operazioni in Blocco** permettono di eseguire comandi simultaneamente su più dispositivi. Ideale per gestire flotte di dispositivi in modo efficiente.

---

## Selezione Dispositivi

### Metodi di Selezione

#### 1. Selezione Manuale

Seleziona dispositivi individualmente:

1. **Visualizza griglia dispositivi**
2. **Spunta checkbox** dei dispositivi desiderati
3. I dispositivi selezionati vengono evidenziati
4. Il contatore mostra: "5 dispositivi selezionati"

#### 2. Filtri Avanzati

Seleziona automaticamente dispositivi che corrispondono a criteri:

**Per Store/Organizzazione**
```
Store: Milano Centro
Organizzazione: Retail Nord
→ Seleziona: 12 dispositivi
```

**Per Stato**
```
Stato: Online
Batteria: > 50%
→ Seleziona: 45 dispositivi
```

**Per Modello**
```
Modello: Sunmi T2
Android Version: 10.0+
→ Seleziona: 23 dispositivi
```

**Per App Installata**
```
App: com.omnily.pos
Versione: < 1.2.0
→ Seleziona: 8 dispositivi (necessitano update)
```

#### 3. Selezione da File

Carica un file CSV con lista dispositivi:

```csv
device_id
device-uuid-001
device-uuid-002
device-uuid-003
```

O usa i nomi dispositivi:
```csv
device_name
POS-Milano-01
POS-Milano-02
POS-Roma-01
```

### Anteprima Selezione

Prima di procedere, rivedi:
- **Numero totale** dispositivi selezionati
- **Lista completa** con nome e store
- **Dispositivi offline** (verranno accodati)
- **Conflitti potenziali** (es. comandi già in esecuzione)

---

## Tipi di Operazioni

### 📱 Comandi Sistema

#### Riavvio di Massa
Riavvia tutti i dispositivi selezionati:
- **Quando**: Dopo aggiornamenti critici, manutenzione programmata
- **Durata**: ~2 minuti per dispositivo
- **Nota**: Dispositivi saranno offline durante riavvio

#### Lock/Unlock di Massa
Blocca o sblocca schermi simultaneamente:
- **Quando**: Emergenze sicurezza, manutenzione negozi
- **Effetto**: Immediato sui dispositivi online
- **Nota**: Dispositivi offline riceveranno comando al reconnect

#### Aggiorna Posizione
Richiedi update GPS da tutti i dispositivi:
- **Quando**: Verifica posizioni, audit periodici
- **Durata**: ~10 secondi per dispositivo
- **Nota**: Richiede permessi GPS attivi

### 📦 Gestione App

#### Installazione di Massa
Installa un'app su tutti i dispositivi:

**Configurazione**:
```
App: Omnily POS
Versione: 1.2.3
Metodo: Auto (WiFi preferito)
Orario: 03:00 (fuori orario)
Retry: Fino a 3 tentativi
```

**Monitoraggio**:
- Progressione real-time (15/50 completati)
- Tempo stimato rimanente
- Dispositivi con errori

#### Aggiornamento di Massa
Aggiorna un'app esistente su tutti i dispositivi:

**Opzioni**:
- **Forza Update**: Chiude app e installa subito
- **Background**: Update in background quando possibile
- **Solo WiFi**: Attende connessione WiFi
- **Orario Specifico**: Programma per orario preciso

#### Disinstallazione di Massa
Rimuove un'app da tutti i dispositivi:
- **Attenzione**: Azione irreversibile
- **Backup**: Opzionale backup dati app prima rimozione
- **Conferma**: Richiede conferma esplicita

### ⚙️ Configurazioni

#### Applica Configurazione Store
Applica una configurazione store a più dispositivi:

**Include**:
- Impostazioni WiFi
- Configurazioni display
- App predefinite
- Orari apertura/chiusura
- Template stampa

**Metodo**:
```
Configurazione: Store Milano Centro
Target: 15 dispositivi
Override esistente: Sì
Riavvia dopo: Sì
```

#### Cambia WiFi
Cambia rete WiFi su tutti i dispositivi:

```
SSID: Store-WiFi-New
Password: ********
Priorità: Alta
Auto-Connect: Sì
```

**Utile quando**: Cambio router, nuova rete, aggiornamento password

#### Imposta Kiosk Mode
Attiva modalità kiosk su più dispositivi:

```
App Kiosk: com.omnily.pos
Esci con PIN: 1234
Nascondi Status Bar: Sì
Blocca Tasti Hardware: Sì
```

### 📊 Raccolta Dati

#### Export Dati Dispositivi
Esporta dati da tutti i dispositivi selezionati:

**Dati esportabili**:
- Info hardware (modello, serial, IMEI)
- Info sistema (Android version, storage, RAM)
- Info batteria (livello, salute, cicli)
- Info rete (WiFi, IP, MAC)
- App installate (lista completa con versioni)
- Log recenti (ultimi 7 giorni)

**Formato Export**:
- CSV: Tabella per analisi Excel
- JSON: Per integrazioni API
- PDF: Report formattato con grafici

#### Backup Configurazioni
Crea backup configurazioni di tutti i dispositivi:

**Include**:
- Configurazioni app
- Impostazioni sistema
- Credenziali WiFi (criptate)
- Profili utente
- Configurazioni store

**Storage**:
- Cloud sicuro (criptato)
- Download locale (zip file)
- Retention: 90 giorni

---

## Esecuzione Operazioni

### Modalità di Esecuzione

#### 1. Immediata
Esegue subito il comando su tutti i dispositivi:
- **Pro**: Risultato immediato
- **Contro**: Possibile impatto su utenti attivi
- **Quando**: Emergenze, fuori orario lavorativo

#### 2. Programmata
Programma esecuzione per orario specifico:
```
Data: 15/01/2024
Ora: 03:00
Fuso Orario: Europe/Rome
```
- **Pro**: Zero impatto su utenti
- **Contro**: Risultati non immediati
- **Quando**: Operazioni di manutenzione, update maggiori

#### 3. Sequenziale
Esegue comando su un dispositivo alla volta:
- **Ordine**: Alfabetico, per store, per priorità
- **Pausa**: Opzionale tra dispositivi (es. 30 secondi)
- **Stop su Errore**: Opzionale blocco se errori
- **Quando**: Rollout cauto, test progressivi

#### 4. A Onde (Waves)
Esegue su gruppi di dispositivi progressivamente:
```
Onda 1: 10% dispositivi → Attendi 1h
Onda 2: 30% dispositivi → Attendi 1h
Onda 3: 60% dispositivi → Attendi 1h
Onda 4: 100% dispositivi
```
- **Pro**: Minimizza rischi, rileva problemi presto
- **Contro**: Completamento più lento
- **Quando**: Update critici, cambi configurazioni importanti

### Configurazione Avanzata

#### Retry Policy
Configura comportamento in caso di fallimento:

```
Max Retry: 3 tentativi
Intervallo: 5 minuti tra retry
Backoff: Esponenziale (5min, 10min, 20min)
Timeout: 10 minuti per tentativo
```

#### Condizioni Prerequisiti
Imposta condizioni che devono essere soddisfatte:

```
✅ Dispositivo online
✅ Batteria > 30%
✅ WiFi connesso (se richiesto)
✅ Storage libero > 500MB
✅ Nessuna operazione in corso
```

Se condizioni non soddisfatte, comando viene accodato.

#### Notifiche
Configura quando ricevere notifiche:

- ✅ **Inizio operazione**
- ✅ **Completamento** (100% successo)
- ✅ **Errori critici** (> 10% fallimenti)
- ⬜ **Ogni dispositivo** (troppo verbose)
- ✅ **Report finale** (riepilogo completo)

---

## Monitoraggio Esecuzione

### Dashboard Progress

Monitor in tempo reale dell'operazione:

#### Statistiche Globali
```
📊 Progresso: ████████░░ 80% (40/50)
✅ Successo: 35 dispositivi
⏳ In Corso: 5 dispositivi
❌ Falliti: 3 dispositivi
⏸️ In Attesa: 7 dispositivi
⏱️ Tempo Trascorso: 00:12:34
⏱️ Tempo Stimato: 00:03:12
```

#### Progress Bar
- **Verde**: Completati con successo
- **Blu**: In esecuzione
- **Giallo**: In attesa/accodati
- **Rosso**: Falliti

#### Dettaglio per Dispositivo

Lista completa con stato per ogni dispositivo:

| Dispositivo | Stato | Progresso | Durata | Errore |
|-------------|--------|-----------|--------|--------|
| POS-Milano-01 | ✅ Completato | 100% | 2m 34s | - |
| POS-Milano-02 | ⏳ In Corso | 65% | 1m 12s | - |
| POS-Roma-01 | ❌ Fallito | 0% | - | Storage insufficiente |
| POS-Roma-02 | ⏸️ In Attesa | 0% | - | Offline |

### Log Real-Time

Streaming log di tutte le operazioni:

```log
[14:30:01] Operazione avviata: Installazione app com.omnily.pos
[14:30:02] Target: 50 dispositivi selezionati
[14:30:03] POS-Milano-01: Avvio installazione...
[14:30:45] POS-Milano-01: Installazione completata ✅
[14:30:46] POS-Milano-02: Avvio installazione...
[14:31:23] POS-Roma-01: Errore - Storage insufficiente ❌
[14:31:24] POS-Roma-01: Retry 1/3 in 5 minuti...
```

### Gestione Errori

Per i dispositivi falliti:

#### 1. Visualizza Dettaglio Errore
Clicca sul dispositivo per vedere:
- Codice errore
- Descrizione dettagliata
- Stack trace (se disponibile)
- Suggerimento risoluzione

#### 2. Retry Manuale
Pulsanti azione:
- **Retry Dispositivo**: Riprova solo questo
- **Retry Tutti Falliti**: Riprova tutti i falliti
- **Salta**: Escludi da questa operazione

#### 3. Risolvi e Riprova
Per alcuni errori, puoi risolvere al volo:
- **Storage pieno**: Libera spazio da remoto
- **WiFi richiesto**: Attendi connessione WiFi
- **Dispositivo offline**: Attendi reconnect

---

## Operazioni Salvate

### Template Operazioni

Salva operazioni frequenti come template:

**Esempio: "Update Settimanale POS"**
```yaml
Nome: Update Settimanale POS
Descrizione: Update app POS ogni domenica notte
Tipo: Installazione App
App: com.omnily.pos
Versione: Latest
Target: Tutti i dispositivi store retail
Esecuzione: Programmata (Domenica 03:00)
Notifiche: Solo errori critici
```

**Vantaggi**:
- Riutilizzabile con 1 click
- Parametri preconfigurati
- Schedulabile ricorrente
- Condivisibile con team

### Operazioni Ricorrenti

Configura operazioni che si ripetono automaticamente:

**Esempio: "Riavvio Notturno"**
```yaml
Operazione: Riavvio
Target: Tutti i dispositivi
Frequenza: Giornaliero
Orario: 03:00
Giorni: Lunedì-Domenica
Prerequisiti: Dispositivo idle da > 1h
Notifiche: Solo se fallimento
```

### Storico Operazioni

Accedi allo storico di tutte le operazioni bulk:

**Filtri**:
- Per tipo operazione
- Per data esecuzione
- Per utente che ha eseguito
- Per esito (successo/fallito)
- Per dispositivi coinvolti

**Dettagli Disponibili**:
- Configurazione completa usata
- Risultati per dispositivo
- Log completi
- Report esportabile

---

## Best Practices

### 🎯 Pianificazione

- **Testa sempre** su gruppo pilota prima di eseguire su tutti
- **Programma operazioni** fuori dalle ore di punta
- **Usa modalità a onde** per operazioni critiche
- **Verifica prerequisiti** prima di avviare
- **Prepara piano B** in caso di problemi

### 📊 Monitoraggio

- **Monitora in tempo reale** durante esecuzione
- **Configura alert** per fallimenti > 10%
- **Rivedi log** per individuare pattern errori
- **Documenta problemi** ricorrenti
- **Mantieni storico** per almeno 90 giorni

### 🔄 Gestione Errori

- **Analizza cause** prima di retry indiscriminato
- **Risolvi problemi comuni** (storage, batteria)
- **Usa retry intelligente** con backoff esponenziale
- **Esclude dispositivi problematici** se necessario
- **Pianifica follow-up** per dispositivi falliti

### 🔐 Sicurezza

- **Limita accesso** alle operazioni bulk (ruoli admin)
- **Richiedi approvazione** per operazioni critiche
- **Log completo** di chi esegue cosa
- **Backup prima** di operazioni distruttive
- **Test in staging** prima di produzione

---

## Troubleshooting

### Molti Dispositivi Falliti

**Problema**: > 20% dispositivi falliscono l'operazione

**Analisi**:
1. Controlla log per errori comuni
2. Verifica prerequisiti (batteria, storage, WiFi)
3. Verifica che comando sia valido
4. Controlla stato server/network

**Soluzioni**:
- Risolvi causa comune (es. libera storage)
- Modifica prerequisiti se troppo restrittivi
- Dividi operazione in batch più piccoli
- Contatta supporto se problema server

### Operazione Troppo Lenta

**Problema**: Operazione richiede troppo tempo

**Cause**:
- Esecuzione sequenziale invece che parallela
- Dispositivi lenti nel rispondere
- Network congestionato
- Retry multipli su molti dispositivi

**Soluzioni**:
- Passa a esecuzione parallela
- Aumenta timeout per dispositivi lenti
- Esegui durante ore di basso traffico
- Riduci numero retry automatici

### Impossibile Selezionare Dispositivi

**Problema**: Filtri non trovano dispositivi

**Soluzioni**:
1. Verifica criteri di filtro non troppo restrittivi
2. Controlla che dispositivi esistano
3. Verifica permessi utente per visualizzare dispositivi
4. Prova selezione manuale invece che filtri

### Comando Non Eseguito su Dispositivo Offline

**Problema**: Dispositivi offline non ricevono comandi accodati

**Soluzioni**:
1. Verifica che dispositivo torni online
2. Controlla che comando sia ancora nella coda
3. Verifica data scadenza comando (default 7 giorni)
4. Forza sincronizzazione dispositivo quando online

---

## FAQ

**Q: Quanti dispositivi posso controllare simultaneamente?**
A: Non c'è limite tecnico, ma consigliamo batch di max 100 per operazioni pesanti.

**Q: Cosa succede se stoppo un'operazione a metà?**
A: I comandi già completati restano, quelli in corso vengono cancellati, quelli in attesa non partono.

**Q: Posso eseguire più operazioni bulk contemporaneamente?**
A: Sì, ma ogni dispositivo può eseguire solo 1 comando alla volta. Altri vengono accodati.

**Q: Come esporto i risultati di un'operazione?**
A: Clicca "Esporta Report" nella dashboard dell'operazione, scegli formato (CSV/PDF/JSON).

**Q: Posso delegare l'esecuzione di operazioni bulk?**
A: Sì, tramite ruoli e permessi puoi assegnare capacità di eseguire operazioni bulk.

**Q: I comandi bulk hanno priorità sui comandi singoli?**
A: No, stessa priorità. Vengono eseguiti in ordine FIFO (First In First Out).
