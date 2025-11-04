# Scheduler Comandi

## Panoramica

Lo **Scheduler Comandi** permette di programmare l'esecuzione automatica di comandi sui dispositivi in orari specifici. Ideale per automazioni e manutenzione programmata.

---

## Tipi di Comandi Programmabili

### Sistema

- **🔄 Riavvio**: Riavvia il dispositivo
- **🔒 Lock Screen**: Blocca lo schermo
- **🔓 Unlock Screen**: Sblocca lo schermo
- **📍 Aggiorna Posizione**: Richiedi update GPS

### Applicazioni

- **📦 Installa App**: Installa un'app dal repository
- **♻️ Aggiorna App**: Aggiorna app esistente
- **🗑️ Disinstalla App**: Rimuovi un'app

### Configurazione

- **⚙️ Applica Config**: Applica una configurazione store
- **📶 WiFi**: Cambia rete WiFi
- **🎨 Tema**: Cambia tema visual

### Kiosk

- **🔐 Attiva Kiosk**: Attiva modalità kiosk
- **🔓 Disattiva Kiosk**: Disattiva modalità kiosk
- **🔄 Cambia App Kiosk**: Cambia l'app in modalità kiosk

---

## Creare un Comando Programmato

### Passo 1: Clicca "Programma Comando"

Nella sezione Scheduler, clicca il pulsante **Programma Comando** in alto a destra.

### Passo 2: Seleziona Dispositivo

Scegli il dispositivo target dalla lista:
- Usa la ricerca per trovare rapidamente
- Filtra per store o organizzazione
- Verifica che il dispositivo sia online

### Passo 3: Scegli Tipo Comando

Seleziona il comando da eseguire:
- **Categoria**: Sistema, App, Config, Kiosk
- **Comando Specifico**: Riavvio, Install App, ecc.

### Passo 4: Configura Parametri

A seconda del comando, inserisci i parametri necessari:

#### Esempio: Installa App
```json
{
  "packageName": "com.example.app",
  "version": "1.2.0",
  "autoUpdate": true
}
```

#### Esempio: Applica Config
```json
{
  "storeConfigId": "uuid-store-config",
  "forceReboot": false
}
```

### Passo 5: Programma Esecuzione

Scegli quando eseguire il comando:

#### Esecuzione Singola
- **Data**: Seleziona giorno dal calendario
- **Ora**: Imposta ora precisa (HH:MM)
- **Fuso Orario**: Verificato automaticamente

#### Ricorrenza (Opzionale)
- **Giornaliero**: Ogni giorno alla stessa ora
- **Settimanale**: Giorni della settimana specifici
- **Mensile**: Giorno del mese specifico

### Passo 6: Conferma

Rivedi i dettagli e clicca **Programma**:
- Comando creato e salvato
- Eseguirà all'orario programmato
- Puoi modificarlo o cancellarlo prima dell'esecuzione

---

## Visualizzazione Comandi

### Filtri

Filtra i comandi per stato:

- **Tutti**: Mostra tutti i comandi
- **In Attesa**: Comandi programmati non ancora eseguiti
- **Completati**: Comandi eseguiti con successo
- **Falliti**: Comandi che hanno generato errori
- **Annullati**: Comandi cancellati manualmente

### Cerca Comandi

Usa la barra di ricerca per trovare:
- Nome dispositivo
- Tipo di comando
- Store

### Ordinamento

I comandi sono ordinati per:
- **Data Programmata**: Dal più recente al più vecchio
- **Stato**: Priorità a quelli in attesa

---

## Gestione Comandi

### Visualizza Dettagli

Clicca su un comando per vedere:

- **📱 Dispositivo Target**: Nome e store
- **⚙️ Tipo Comando**: Categoria e azione
- **📋 Parametri**: JSON dei parametri
- **📅 Programmato Per**: Data e ora esecuzione
- **📊 Stato Attuale**: In attesa/Completato/Fallito
- **⏱️ Eseguito il**: Timestamp esecuzione effettiva
- **📝 Risultato**: Output del comando o errore

### Azioni Disponibili

#### ▶️ Esegui Ora
- Esegue immediatamente senza aspettare l'orario
- Utile per test o emergenze
- Il comando passa a stato "Executing"

#### ⏸️ Pausa
- Mette in pausa un comando ricorrente
- Non eseguirà alla prossima occorrenza
- Può essere riattivato in seguito

#### ▶️ Riprendi
- Riattiva un comando in pausa
- Riprenderà alla prossima occorrenza programmata

#### 🔄 Retry
- Riprova esecuzione di un comando fallito
- Usa gli stessi parametri
- Esegue immediatamente

#### 🗑️ Elimina
- Cancella il comando definitivamente
- Se ricorrente, cancella tutte le occorrenze future
- Non elimina lo storico passato

---

## Comandi Ricorrenti

### Configurazione Ricorrenza

Quando crei un comando, abilita **Ricorrenza**:

#### Giornaliero
- **Esegui ogni**: Ogni N giorni
- **Ora**: Orario fisso (es. 03:00)
- **Esempio**: Riavvio quotidiano alle 3 del mattino

#### Settimanale
- **Giorni**: Seleziona giorni della settimana
- **Ora**: Orario fisso per tutti i giorni
- **Esempio**: Aggiornamenti ogni lunedì e giovedì alle 23:00

#### Mensile
- **Giorno del mese**: 1-31
- **Ora**: Orario fisso
- **Esempio**: Backup primo giorno del mese alle 02:00

### Gestione Ricorrenza

I comandi ricorrenti creano automaticamente:
- **Istanza Successiva**: Dopo ogni esecuzione
- **Storico**: Mantiene risultati esecuzioni precedenti
- **Notifiche**: Alert se un'esecuzione fallisce

### Modifica Ricorrenza

Per modificare un comando ricorrente:
1. Clicca **Modifica**
2. Cambia parametri o schedule
3. **Applica a**:
   - Solo prossima occorrenza
   - Tutte le occorrenze future
   - Tutto incluso lo storico

---

## Monitoraggio Esecuzione

### Stati del Comando

Un comando passa attraverso questi stati:

1. **⏳ In Attesa** (Pending)
   - Comando creato
   - In attesa dell'orario programmato

2. **▶️ In Esecuzione** (Executing)
   - Comando inviato al dispositivo
   - In corso di elaborazione

3. **✅ Completato** (Completed)
   - Eseguito con successo
   - Risultato positivo ricevuto

4. **❌ Fallito** (Failed)
   - Errore durante l'esecuzione
   - Dettagli errore disponibili

5. **⏸️ Annullato** (Cancelled)
   - Cancellato manualmente
   - Non sarà eseguito

### Log di Esecuzione

Ogni esecuzione registra:

- **Timestamp Inizio**: Ora esatta invio comando
- **Timestamp Fine**: Ora ricezione risposta
- **Durata**: Tempo totale esecuzione
- **Risultato**: Output del comando
- **Errori**: Se presenti, descrizione dettagliata

### Notifiche

Ricevi notifiche per:
- ✅ Comando completato con successo
- ❌ Comando fallito (con dettagli errore)
- ⚠️ Dispositivo offline (comando accodato)
- 🔄 Retry automatico programmato

---

## Use Cases Comuni

### Riavvio Notturno Automatico

**Scenario**: Riavvio giornaliero per mantenere performance ottimali

**Configurazione**:
- **Comando**: Riavvio Sistema
- **Dispositivi**: Tutti i POS
- **Schedule**: Giornaliero alle 03:00
- **Parametri**: Nessuno

**Benefici**:
- Libera memoria
- Applica aggiornamenti in attesa
- Reset servizi
- Nessun impatto sugli utenti

### Aggiornamenti App Settimanali

**Scenario**: Installazione automatica aggiornamenti app

**Configurazione**:
- **Comando**: Aggiorna App
- **Dispositivi**: POS specifici o tutti
- **Schedule**: Domenica alle 23:00
- **Parametri**:
  ```json
  {
    "packageName": "com.omnily.pos",
    "checkLatest": true,
    "autoInstall": true
  }
  ```

**Benefici**:
- Sempre aggiornati
- Orario fuori dalle ore di lavoro
- Rollout controllato

### Backup Configurazione Mensile

**Scenario**: Backup della configurazione dispositivo

**Configurazione**:
- **Comando**: Backup Config
- **Dispositivi**: Tutti
- **Schedule**: Primo del mese alle 02:00
- **Parametri**:
  ```json
  {
    "includeApps": true,
    "includeSettings": true,
    "uploadToCloud": true
  }
  ```

**Benefici**:
- Ripristino rapido in caso di problemi
- Storico configurazioni
- Disaster recovery

---

## Best Practices

### ⏰ Timing

- **Evita** orari di punta (10-14, 18-20)
- **Preferisci** notte (02:00-05:00) per operazioni pesanti
- **Considera** fusi orari per catene nazionali
- **Testa** prima un comando singolo, poi programma per tutti

### 🎯 Target

- **Inizia** con pochi dispositivi (test group)
- **Monitora** risultati prima di espandere
- **Usa** gruppi per organizzare (es. "POS-Nord", "POS-Sud")
- **Documenta** ragioni per comandi ricorrenti

### 🔄 Gestione Errori

- **Attiva** notifiche per comandi falliti
- **Configura** retry automatici (max 3 tentativi)
- **Rivedi** log settimanalmente
- **Documenta** problemi ricorrenti

### 📊 Monitoraggio

- **Controlla** dashboard scheduler giornalmente
- **Verifica** successo comandi critici
- **Analizza** pattern di fallimento
- **Ottimizza** timing basandosi su dati storici

---

## Troubleshooting

### Comando Non Eseguito

**Problema**: Il comando resta "In Attesa" anche dopo l'orario

**Cause Possibili**:
1. Dispositivo offline
2. Scheduler service down
3. Fuso orario errato

**Soluzioni**:
1. Verifica stato dispositivo
2. Esegui manualmente con "Esegui Ora"
3. Controlla fuso orario nelle impostazioni

### Comando Fallito

**Problema**: Comando eseguito ma risultato "Fallito"

**Soluzioni**:
1. Leggi dettagli errore nei log
2. Verifica parametri comando
3. Verifica permessi app sul dispositivo
4. Prova retry manuale

### Comandi Ricorrenti Non Generano Nuove Istanze

**Problema**: Comando ricorrente non crea prossima occorrenza

**Soluzioni**:
1. Verifica che ricorrenza sia ancora attiva
2. Controlla che comando non sia stato eliminato
3. Verifica che non ci siano errori nel pattern di ricorrenza

---

## FAQ

**Q: Posso programmare un comando per più dispositivi contemporaneamente?**
A: Sì, usa le **Operazioni in Blocco** per selezionare multipli dispositivi.

**Q: Cosa succede se il dispositivo è offline all'orario programmato?**
A: Il comando viene accodato e eseguito quando il dispositivo torna online.

**Q: Posso vedere uno storico dei comandi eseguiti?**
A: Sì, usa il filtro "Completati" e la ricerca per vedere lo storico.

**Q: C'è un limite al numero di comandi programmabili?**
A: No, ma consigliamo di mantenere sotto i 1000 comandi attivi per performance.

**Q: Posso esportare i log dei comandi?**
A: Sì, vai in Activity Logs e filtra per tipo "scheduled_command".
