# Sistema Alert

## Panoramica

Il **Sistema Alert** monitora proattivamente lo stato dei dispositivi e invia notifiche in tempo reale per eventi critici. Ti permette di reagire rapidamente a problemi e anomalie.

---

## Tipi di Alert

### 🔴 Critici

Richiedono attenzione immediata:

- **Dispositivo Offline > 1h**: Dispositivo non raggiungibile da più di un'ora
- **Batteria Critica < 10%**: Batteria molto bassa, rischio spegnimento
- **Temperatura Critica > 70°C**: Rischio di danni hardware
- **Storage Critico < 5%**: Spazio disco quasi esaurito
- **Errore Kiosk**: Modalità kiosk crashata o app non risponde

### 🟡 Avviso

Richiedono monitoraggio:

- **Batteria Bassa < 20%**: Batteria in esaurimento
- **Temperatura Alta > 60°C**: Dispositivo surriscaldato
- **Storage Basso < 10%**: Spazio disco limitato
- **Connessione WiFi Instabile**: Segnale debole o disconnessioni frequenti
- **App Non Risponde**: App principale non risponde ai comandi

### 🔵 Informativo

Solo notifiche informative:

- **Dispositivo Tornato Online**: Dispositivo riconnesso dopo essere stato offline
- **Aggiornamento Completato**: Update app o sistema completato con successo
- **Comando Eseguito**: Comando programmato eseguito correttamente
- **Backup Completato**: Backup automatico completato

---

## Visualizzazione Alert

### Dashboard Alert

La dashboard mostra tutti gli alert attivi con:

- **🔴 Icona di Priorità**: Colore indica gravità (rosso/giallo/blu)
- **📱 Dispositivo**: Nome del dispositivo interessato
- **⚠️ Tipo Alert**: Descrizione del problema
- **📊 Valore**: Dato specifico (es. batteria 8%, temperatura 72°C)
- **⏰ Timestamp**: Quando è stato generato l'alert
- **✅ Stato**: Non confermato / Confermato / Risolto

### Filtri

Filtra gli alert per:

- **Tutti**: Mostra tutti gli alert
- **Non Confermati**: Solo alert che richiedono azione
- **Critici**: Solo alert di priorità massima
- **Avvisi**: Solo alert di priorità media
- **Informativi**: Solo alert informativi
- **Per Dispositivo**: Filtra per nome dispositivo

### Ordinamento

Gli alert sono ordinati per:
1. **Priorità**: Critici prima, poi avvisi, poi informativi
2. **Data**: Dal più recente al più vecchio
3. **Stato**: Non confermati prima dei confermati

---

## Gestione Alert

### Conferma Singola

Per confermare un alert:

1. **Clicca sull'alert** nella lista
2. Visualizza i dettagli completi
3. **Clicca "Conferma"**
4. L'alert viene marcato come "Confermato"
5. Scompare dalla vista "Non Confermati"

**Cosa significa confermare?**
- Hai preso visione del problema
- Stai lavorando alla risoluzione
- L'alert non richiede più attenzione immediata

### Conferma Multipla

Per confermare più alert contemporaneamente:

1. **Seleziona gli alert** con le checkbox
2. **Clicca "Conferma Selezionati"** in alto
3. Tutti gli alert selezionati vengono confermati

**Usa quando**:
- Hai risolto lo stesso problema su più dispositivi
- Stai facendo una revisione generale degli alert
- Vuoi pulire la dashboard da alert già gestiti

### Conferma Tutti

Per confermare tutti gli alert visibili:

1. **Clicca "Conferma Tutti"** nel header
2. Conferma l'azione nel popup
3. Tutti gli alert non confermati vengono confermati

**⚠️ ATTENZIONE**: Usa con cautela! Assicurati di aver effettivamente preso visione di tutti gli alert prima di confermare in massa.

### Risoluzione Automatica

Alcuni alert si risolvono automaticamente quando il problema è risolto:

- **Dispositivo Offline**: Si risolve quando torna online
- **Batteria Bassa**: Si risolve quando raggiunge 30%
- **Temperatura Alta**: Si risolve quando scende sotto 55°C
- **WiFi Instabile**: Si risolve quando connessione si stabilizza

Gli alert risolti automaticamente:
- Cambiano stato in "Risolto"
- Mostrano il timestamp di risoluzione
- Possono essere filtrati separatamente

---

## Configurazione Alert

### Soglie Personalizzate

Personalizza le soglie che generano alert:

#### Batteria
- **Critico**: < 10% (default)
- **Avviso**: < 20% (default)
- **Range**: 5-30%

#### Temperatura
- **Critico**: > 70°C (default)
- **Avviso**: > 60°C (default)
- **Range**: 50-80°C

#### Storage
- **Critico**: < 5% (default)
- **Avviso**: < 10% (default)
- **Range**: 5-20%

#### Offline
- **Critico**: > 1 ora (default)
- **Avviso**: > 30 minuti (default)
- **Range**: 15 min - 4 ore

### Come Modificare le Soglie

1. Vai in **Impostazioni Alert**
2. Seleziona il **Tipo Alert** da configurare
3. Modifica i **Valori Soglia**
4. **Salva Configurazione**
5. Le nuove soglie si applicano immediatamente

---

## Notifiche

### Canali di Notifica

Ricevi alert attraverso:

#### 📧 Email
- Configurabile per singolo utente
- Supporta alert critici e avvisi
- Template HTML formattato
- Include link diretto al dispositivo

#### 📱 Push Notification (Web)
- Notifiche browser in tempo reale
- Richiede permessi browser
- Solo per alert critici
- Click per aprire dashboard

#### 💬 SMS (Opzionale)
- Solo per alert critici
- Richiede configurazione provider SMS
- Addebito per messaggio
- Utile per emergenze fuori orario

#### 🔔 In-App
- Badge con conteggio alert non letti
- Suono di notifica configurabile
- Toast notification nell'angolo
- Sempre attivo

### Configurazione Notifiche

Per configurare le notifiche:

1. Vai in **Profilo Utente** → **Notifiche**
2. Abilita/Disabilita per canale
3. Scegli quali tipi di alert ricevere:
   - ✅ Critici (consigliato sempre ON)
   - ✅ Avvisi (consigliato per admin)
   - ⬜ Informativi (consigliato OFF per ridurre rumore)
4. Configura **Orari di Silenzio** (opzionale):
   - Non ricevi notifiche in certi orari
   - Gli alert vengono comunque registrati
   - Utile per notifiche notturne
5. **Salva Preferenze**

### Digest Email

Invece di email per ogni alert, ricevi un digest:

- **Giornaliero**: Ogni mattina alle 9:00
- **Settimanale**: Ogni lunedì mattina
- **Mensile**: Primo del mese

Il digest include:
- Riepilogo alert generati nel periodo
- Statistiche per tipo e gravità
- Dispositivi con più problemi
- Trend rispetto al periodo precedente

---

## Monitoraggio e Analytics

### Dashboard Analytics

Visualizza statistiche aggregate degli alert:

#### Statistiche Globali
- **Totale Alert Mese**: Numero alert generati nel mese corrente
- **Alert Attivi**: Alert non risolti attualmente
- **Tempo Medio Risoluzione**: Tempo medio tra generazione e risoluzione
- **Tasso Ricorrenza**: % di alert che si ripetono

#### Per Tipo
- **Distribuzione per Gravità**: Grafico a torta critici/avvisi/informativi
- **Top 5 Tipi Alert**: Quali tipi vengono generati più spesso
- **Trend Temporale**: Grafico a linee negli ultimi 30 giorni

#### Per Dispositivo
- **Top 10 Dispositivi Problematici**: Dispositivi con più alert
- **Dispositivi Senza Alert**: Quanti dispositivi non hanno generato alert
- **Mappa Geografica**: Distribuzione geografica degli alert

### Report Esportabili

Esporta report in formato:
- **CSV**: Per analisi in Excel
- **PDF**: Report formattato con grafici
- **JSON**: Per integrazioni esterne

---

## Best Practices

### 🎯 Gestione Proattiva

- **Controlla la dashboard** almeno 2 volte al giorno
- **Conferma gli alert** dopo averli gestiti
- **Non ignorare** gli alert critici
- **Analizza i pattern** negli alert ricorrenti

### 📊 Ottimizzazione Soglie

- **Inizia con le soglie default** per 2 settimane
- **Analizza i falsi positivi** (alert non realmente problematici)
- **Regola le soglie** per ridurre rumore
- **Rivedi periodicamente** ogni 3 mesi

### 🔔 Configurazione Notifiche

- **Abilita notifiche critiche** per tutti gli admin
- **Usa gli orari di silenzio** per evitare notifiche notturne non urgenti
- **Configura i digest** invece di notifiche singole per avvisi
- **Condividi la responsabilità** tra più persone

### 🚨 Gestione Emergenze

- **Documenta le procedure** per ogni tipo di alert critico
- **Testa le notifiche** periodicamente
- **Mantieni aggiornati** i contatti di emergenza
- **Esegui drill periodici** per testare i tempi di risposta

---

## Troubleshooting

### Alert Non Ricevuti

**Problema**: Non ricevi notifiche per gli alert

**Soluzioni**:
1. Verifica che le notifiche siano abilitate nel tuo profilo
2. Controlla i permessi browser per notifiche push
3. Verifica che l'email sia corretta
4. Controlla la cartella spam per email
5. Verifica che non ci siano orari di silenzio attivi

### Troppi Alert

**Problema**: Ricevi troppi alert, molti non rilevanti

**Soluzioni**:
1. Analizza quali tipi generano più alert
2. Regola le soglie per ridurre falsi positivi
3. Disabilita alert informativi se non necessari
4. Usa i digest invece di notifiche immediate
5. Filtra per gravità (solo critici e avvisi)

### Alert Ricorrenti

**Problema**: Stesso alert si ripete continuamente per un dispositivo

**Soluzioni**:
1. Identifica la causa root del problema
2. Risolvi il problema sul dispositivo
3. Se non risolvibile subito, crea un alert "sospeso" per il dispositivo
4. Considera di sostituire il dispositivo se problema hardware
5. Documenta il problema negli activity logs

### Alert Non Si Risolvono Automaticamente

**Problema**: Alert resta attivo anche se problema risolto

**Soluzioni**:
1. Forza refresh dello stato dispositivo
2. Verifica che il dispositivo sia effettivamente online
3. Controlla gli activity logs per errori di comunicazione
4. Risolvi manualmente l'alert
5. Segnala al supporto se persiste

---

## FAQ

**Q: Posso disabilitare completamente gli alert per un dispositivo?**
A: Sì, vai nei dettagli del dispositivo e abilita "Silenzio Alert". Utile per dispositivi in manutenzione.

**Q: Gli alert vengono cancellati automaticamente?**
A: Sì, gli alert risolti vengono archiviati dopo 30 giorni. Gli alert confermati ma non risolti restano visibili.

**Q: Posso creare alert personalizzati?**
A: Attualmente no, ma è in roadmap. Per ora puoi configurare solo le soglie degli alert esistenti.

**Q: Gli alert vengono inviati anche se sono fuori dalla dashboard?**
A: Sì, ricevi notifiche via email/SMS/push anche se non sei loggato nella piattaforma.

**Q: Posso delegare gli alert a colleghi?**
A: Sì, puoi assegnare alert a utenti specifici tramite il pulsante "Assegna" nei dettagli dell'alert.

**Q: Cosa succede se un alert critico viene ignorato?**
A: Dopo 1 ora senza conferma, viene inviata una notifica di escalation agli admin di livello superiore.
