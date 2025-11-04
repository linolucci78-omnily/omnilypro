# Repository App

## Panoramica

Il **Repository App** è il sistema centralizzato per gestire tutte le applicazioni distribuite sui dispositivi. Permette di caricare, versionare e distribuire app in modo controllato.

---

## Gestione App

### Visualizzazione App

Ogni app nel repository mostra:

- **📱 Nome App**: Nome visualizzato dell'applicazione
- **📦 Package Name**: Identificatore univoco (es. com.omnily.pos)
- **🔢 Versione Corrente**: Ultima versione disponibile (es. 1.2.3)
- **📅 Data Caricamento**: Quando è stata caricata l'ultima versione
- **💾 Dimensione APK**: Peso del file in MB
- **📊 Installazioni**: Numero di dispositivi con l'app installata
- **✅ Stato**: Attiva / In Test / Deprecata

### Ricerca e Filtri

#### Barra di Ricerca
Cerca app per:
- Nome dell'app
- Package name
- Descrizione

#### Filtri Rapidi
- **Tutte**: Mostra tutte le app
- **Attive**: Solo app in produzione
- **In Test**: App in fase di testing
- **Deprecate**: App non più supportate
- **Aggiornamenti Disponibili**: App con nuove versioni non ancora installate

---

## Aggiungere Nuova App

### Passo 1: Clicca "Aggiungi App"

Nel Repository App, clicca il pulsante **Aggiungi App** in alto a destra.

### Passo 2: Informazioni Base

Compila i dati dell'app:

#### Dettagli App
```
Nome App*: Omnily POS
Package Name*: com.omnily.pos
Versione*: 1.2.3
Descrizione: Sistema POS per gestione vendite e magazzino
```

**Nota**: Il package name deve essere univoco e non modificabile dopo la creazione.

#### Categoria
Seleziona la categoria appropriata:
- **📊 Business**: App aziendali
- **🛒 POS**: Sistemi punto vendita
- **📦 Inventario**: Gestione magazzino
- **💳 Pagamenti**: App di pagamento
- **🔧 Utilità**: Strumenti e utility
- **🔐 Sicurezza**: App di sicurezza
- **📱 Sistema**: App di sistema

### Passo 3: Carica APK

#### Upload File
1. **Clicca "Seleziona File APK"**
2. Scegli il file .apk dal tuo computer
3. Attendi il caricamento (può richiedere alcuni minuti)
4. Verifica che il checksum sia corretto

#### Requisiti APK
- **Formato**: .apk (Android Package)
- **Dimensione Max**: 500 MB
- **Firma**: APK deve essere firmato
- **Target SDK**: Android 8.0+ (API 26+)

### Passo 4: Configurazione Distribuzione

#### Tipo Distribuzione
- **🌍 Globale**: Disponibile per tutti i dispositivi
- **🏪 Per Store**: Solo store specifici
- **🧪 Test Group**: Solo gruppo di test

#### Auto-Update
- **✅ Abilita**: L'app si aggiorna automaticamente sui dispositivi
- **⏰ Orario**: Scegli quando eseguire gli update (es. 03:00)
- **📶 Solo WiFi**: Update solo con connessione WiFi

#### Rollout Graduale
- **Percentuale Iniziale**: 10% (consigliato)
- **Incremento Automatico**: +10% ogni ora se nessun errore
- **Rollback Automatico**: Se errori > 5%

### Passo 5: Permessi App

Rivedi e conferma i permessi richiesti dall'app:

#### Permessi Comuni
- 📷 **Camera**: Accesso fotocamera
- 📍 **Location**: Accesso GPS
- 📞 **Phone**: Stato telefono e chiamate
- 💾 **Storage**: Lettura/scrittura storage
- 📶 **Network**: Accesso a internet
- 📱 **Bluetooth**: Connessioni Bluetooth
- 🔊 **Audio**: Registrazione audio

**Importante**: Assicurati che i permessi siano giustificati dalla funzionalità dell'app.

### Passo 6: Conferma

Rivedi tutti i dettagli e clicca **Carica App**:
- App caricata nel repository
- Disponibile per l'installazione
- Appare nella lista app
- Pronta per la distribuzione

---

## Aggiornare un'App

### Carica Nuova Versione

Per aggiornare un'app esistente:

1. **Clicca sull'app** nella lista
2. **Clicca "Nuova Versione"**
3. Compila i dati dell'update:

```
Nuova Versione*: 1.2.4
Note di Rilascio*:
- Fix: Risolto crash all'avvio
- Feature: Aggiunto supporto carte regalo
- Improvement: Performance checkout migliorata del 30%
```

4. **Carica il nuovo APK**
5. **Scegli tipo di rollout**:
   - **Immediato**: Installa subito su tutti i dispositivi
   - **Programmato**: Scegli data/ora specifici
   - **Graduale**: Rollout progressivo (consigliato)

6. **Conferma Update**

### Versioning

Usa il **Semantic Versioning** (X.Y.Z):

- **X (Major)**: Cambiamenti incompatibili (1.0.0 → 2.0.0)
- **Y (Minor)**: Nuove funzionalità compatibili (1.0.0 → 1.1.0)
- **Z (Patch)**: Bug fix e piccole modifiche (1.0.0 → 1.0.1)

**Esempi**:
- `1.0.0 → 1.0.1`: Fix bug minori
- `1.0.1 → 1.1.0`: Aggiunta nuova feature
- `1.1.0 → 2.0.0`: Refactoring completo, breaking changes

---

## Distribuzione App

### Installazione Manuale

Per installare un'app su dispositivi specifici:

1. **Seleziona l'app** dal repository
2. **Clicca "Installa"**
3. **Scegli dispositivi target**:
   - Ricerca per nome dispositivo
   - Filtra per store o organizzazione
   - Seleziona multipli con checkbox
4. **Configura installazione**:
   - **Installa Ora**: Immediato
   - **Programma**: Scegli data/ora
   - **Solo WiFi**: Attendi connessione WiFi
5. **Conferma Installazione**

### Installazione Automatica

Per configurare installazione automatica su nuovi dispositivi:

1. Vai in **Configurazioni Store**
2. Seleziona lo store
3. Nella sezione **App Preinstallate**:
   - Aggiungi app dal repository
   - Seleziona versione (Ultima / Specifica)
   - Abilita auto-update
4. **Salva Configurazione**

Ora tutti i nuovi dispositivi dello store avranno queste app automaticamente.

### Rollout Graduale

Il rollout graduale minimizza i rischi distribuendo l'app progressivamente:

#### Come Funziona
1. **Fase 1 (10%)**: Installazione su 10% dispositivi
2. **Monitoraggio**: Sistema monitora per 1 ora
3. **Fase 2 (30%)**: Se OK, incrementa a 30%
4. **Fase 3 (60%)**: Se OK, incrementa a 60%
5. **Fase 4 (100%)**: Completamento distribuzione

#### Condizioni di Successo
- ✅ Nessun crash riportato
- ✅ Installazione completata con successo
- ✅ App avviata correttamente
- ✅ Nessun errore nei log

#### Rollback Automatico
Se durante una fase si verificano:
- > 5% crash rate
- > 10% failure installazione
- > 20% dispositivi offline dopo update

Il sistema:
1. **Blocca** il rollout
2. **Invia alert** agli admin
3. **Fa rollback** alla versione precedente
4. **Genera report** dettagliato

---

## Monitoraggio Installazioni

### Dashboard Installazioni

Per ogni app visualizza:

#### Statistiche Globali
- **📱 Totale Installazioni**: Numero totale dispositivi
- **✅ Versione Aggiornata**: Quanti hanno l'ultima versione
- **⏳ Update Pendenti**: Installazioni in corso
- **❌ Update Falliti**: Installazioni con errori

#### Per Versione
- **Distribuzione Versioni**: Grafico a torta delle versioni installate
- **Timeline Adozione**: Velocità di adozione nuove versioni
- **Dispositivi Obsoleti**: Quanti hanno versioni vecchie

#### Mappa Geografica
- Visualizzazione su mappa delle installazioni
- Marker colorati per versione installata
- Zoom per dettagli per area

### Log Installazioni

Ogni installazione registra:

```json
{
  "timestamp": "2024-01-15T14:30:00Z",
  "device_id": "device-uuid-123",
  "device_name": "POS-Milano-01",
  "app": "com.omnily.pos",
  "version": "1.2.3",
  "status": "success",
  "duration": "45s",
  "method": "auto_update",
  "network": "wifi"
}
```

### Report Errori

Se un'installazione fallisce, il log include:

- **Tipo Errore**: Spazio insufficiente, firma invalida, ecc.
- **Codice Errore**: Codice Android specifico
- **Device Info**: Modello, Android version, RAM, storage
- **Stack Trace**: Errore tecnico completo (se disponibile)

---

## Gestione Versioni

### Visualizza Storico

Per ogni app puoi vedere tutte le versioni storiche:

1. **Clicca sull'app** nel repository
2. **Tab "Versioni"**
3. Visualizza lista versioni con:
   - Numero versione
   - Data rilascio
   - Note di rilascio
   - Numero installazioni
   - Stato (Attiva / Deprecata)

### Deprecare Versione

Per deprecare una versione obsoleta:

1. Seleziona la versione
2. **Clicca "Depreca"**
3. La versione:
   - Non è più installabile
   - I dispositivi con quella versione ricevono alert
   - Auto-update forzato alla versione successiva
   - Resta nello storico per riferimento

### Rollback

Per fare rollback a una versione precedente:

1. Seleziona la versione precedente
2. **Clicca "Ripristina Come Corrente"**
3. Conferma l'azione
4. La versione precedente diventa la "latest"
5. Viene avviato rollout ai dispositivi

**Quando fare rollback**:
- Bug critico scoperto nella nuova versione
- Performance peggiorate
- Feedback negativi massicci
- Incompatibilità non previste

---

## Gestione Permessi

### Analisi Permessi

Analizza i permessi richiesti dalle app:

1. **Clicca sull'app** nel repository
2. **Tab "Permessi"**
3. Visualizza:
   - Lista completa permessi
   - Categoria (Normale / Pericoloso / Firma)
   - Giustificazione d'uso
   - Device con permesso negato

### Permessi Pericolosi

I permessi pericolosi richiedono approvazione esplicita:

- 📷 **Camera**
- 📍 **Location (Fine)**
- 📞 **Call Logs**
- 📱 **SMS**
- 📁 **External Storage**
- 🎤 **Microphone**
- 📋 **Contacts**
- 📅 **Calendar**

**Best Practice**:
- Richiedi solo permessi necessari
- Documenta perché ogni permesso è necessario
- Richiedi permessi just-in-time (quando serve)
- Gestisci gracefully i permessi negati

---

## Best Practices

### 📦 Gestione APK

- **Testa sempre** l'APK su dispositivi di test prima del caricamento
- **Firma con certificato** di produzione (non debug)
- **Usa ProGuard/R8** per offuscare il codice
- **Ottimizza dimensione** con Android App Bundle
- **Includi sempre** note di rilascio dettagliate

### 🚀 Distribuzione

- **Usa rollout graduale** per update maggiori
- **Programma update** fuori dalle ore di punta
- **Testa su gruppo pilota** prima del rilascio globale
- **Monitora metriche** nelle prime 24h dopo rilascio
- **Tieni pronta** una versione di rollback

### 📊 Versioning

- **Segui Semantic Versioning** rigorosamente
- **Incrementa major** per breaking changes
- **Documenta deprecations** con almeno 1 versione di anticipo
- **Mantieni compatibilità** backwards per almeno 2 versioni
- **Non riutilizzare** numeri di versione

### 🔐 Sicurezza

- **Scansiona APK** per malware prima del caricamento
- **Verifica firma** dell'APK
- **Limita permessi** al minimo necessario
- **Cripta dati sensibili** nell'APK
- **Non includere** API keys o secrets hardcoded

---

## Troubleshooting

### Installazione Fallita

**Problema**: L'app non si installa sui dispositivi

**Cause Comuni**:
1. **Spazio insufficiente**: Device storage pieno
2. **Firma invalida**: APK non firmato correttamente
3. **Versione incompatibile**: Target SDK troppo vecchio
4. **Permessi negati**: Permessi necessari non concessi
5. **Conflitto package**: App con stesso package già installata

**Soluzioni**:
1. Verifica storage disponibile sul dispositivo
2. Ricompila e firma l'APK correttamente
3. Aggiorna il target SDK dell'app
4. Concedi permessi manualmente sul dispositivo
5. Disinstalla la vecchia app prima di installare

### Update Non Applicato

**Problema**: I dispositivi non ricevono l'update

**Soluzioni**:
1. Verifica che auto-update sia abilitato
2. Controlla che i dispositivi siano online
3. Verifica connessione WiFi (se richiesta)
4. Forza l'update manualmente
5. Controlla gli activity logs per errori

### App Crashata Dopo Update

**Problema**: L'app crasha dopo l'aggiornamento

**Soluzioni**:
1. **Immediato**: Fai rollback alla versione precedente
2. Analizza i crash logs nei device
3. Identifica la causa del crash
4. Correggi e rilascia hotfix
5. Testa il fix prima di ridistribuire

### APK Non Caricato

**Problema**: Il caricamento dell'APK fallisce

**Soluzioni**:
1. Verifica dimensione APK (max 500 MB)
2. Controlla la connessione internet
3. Riprova il caricamento
4. Verifica che l'APK non sia corrotto
5. Prova da browser diverso

---

## FAQ

**Q: Posso caricare app non sviluppate da me?**
A: Sì, ma devi avere i diritti di distribuzione e rispettare le licenze.

**Q: Quante versioni posso mantenere nello storico?**
A: Illimitate, ma consigliamo di deprecare versioni > 6 mesi.

**Q: Posso forzare la disinstallazione di un'app?**
A: Sì, tramite comando remoto, ma richiede conferma dell'utente finale.

**Q: Gli APK sono archiviati in modo sicuro?**
A: Sì, archiviati con crittografia AES-256 su storage cloud ridondante.

**Q: Posso limitare l'accesso al repository?**
A: Sì, tramite ruoli e permessi utente puoi limitare chi può caricare/distribuire app.

**Q: C'è un limite al numero di app nel repository?**
A: No, nessun limite tecnico al numero di app gestibili.
