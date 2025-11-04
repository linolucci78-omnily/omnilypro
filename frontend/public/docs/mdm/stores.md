# Configurazioni Store

## Panoramica

Le **Configurazioni Store** sono profili predefiniti che contengono tutte le impostazioni necessarie per un punto vendita. Permettono di configurare automaticamente tutti i dispositivi di uno store con un click.

---

## Come Accedere

### Passo 1: Apri Configurazioni Store

1. Accedi alla dashboard OmnilyPro
2. Vai in **Dashboard Admin → MDM**
3. Clicca sulla tab **Configurazioni Store**
4. Visualizzi la lista delle configurazioni esistenti

### Interfaccia Principale

```
┌─────────────────────────────────────────────┐
│ [🔍 Cerca config...]  [Nuova Configurazione]│ ← Header
├─────────────────────────────────────────────┤
│ LISTA CONFIGURAZIONI                        │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏪 Config Milano Centro v2.1            │ │
│ │ Store: Milano Centro                    │ │
│ │ • WiFi: Store-WiFi-Milano (+ backup)    │ │
│ │ • 5 app predefinite                     │ │
│ │ • Orari: 09:00-20:00                    │ │
│ │ • 12 dispositivi attivi                 │ │
│ │ [📋 Dettagli] [✏️ Modifica] [🗑️]        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Creare Nuova Configurazione

### Guida Completa Step-by-Step

#### PASSO 1: Clicca "Nuova Configurazione"

1. In alto a destra, clicca **"Nuova Configurazione"**
2. Si apre il wizard di configurazione

#### PASSO 2: Informazioni Base Store

Compila le informazioni identificative:

```
┌─────────────────────────────────────────┐
│ INFORMAZIONI STORE                      │
├─────────────────────────────────────────┤
│                                         │
│ Nome Store*:                            │
│ [Milano Centro_____________________]    │
│                                         │
│ Codice Store*:                          │
│ [MIL-CTR___________________________]    │
│ ℹ️ Codice univoco (es. ROM-TRM, FI-SMN)│
│                                         │
│ Indirizzo:                              │
│ [Via Dante, 15_____________________]    │
│                                         │
│ Città*:                                 │
│ [Milano____________________________]    │
│                                         │
│ CAP:                                    │
│ [20100_____________________________]    │
│                                         │
│ Organizzazione*:                        │
│ [Retail Nord ▼_____________________]    │
│                                         │
│ Telefono:                               │
│ [+39 02 1234567____________________]    │
│                                         │
└─────────────────────────────────────────┘
```

Clicca **"Avanti"**

#### PASSO 3: Configurazione WiFi

Configura le reti WiFi dello store:

```
┌─────────────────────────────────────────┐
│ CONFIGURAZIONE WIFI                     │
├─────────────────────────────────────────┤
│                                         │
│ 📶 WiFi Principale*                     │
│                                         │
│ SSID*:                                  │
│ [Store-WiFi-Milano_________________]    │
│                                         │
│ Password*:                              │
│ [••••••••••••••••] [👁️ Mostra]         │
│                                         │
│ Tipo Sicurezza*:                        │
│ ● WPA2-Personal                         │
│ ○ WPA3-Personal                         │
│ ○ WPA2-Enterprise                       │
│ ○ Nessuna (⚠️ non consigliato)         │
│                                         │
│ IP Statico (opzionale):                 │
│ ☐ Usa IP statico invece di DHCP        │
│   IP: [192.168.1._____]                │
│   Gateway: [192.168.1.1____]           │
│   DNS: [8.8.8.8________]               │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ 📶 WiFi Backup (opzionale)              │
│                                         │
│ ☑ Configura WiFi di backup              │
│                                         │
│ SSID Backup:                            │
│ [Store-WiFi-Milano-Backup__________]    │
│                                         │
│ Password Backup:                        │
│ [••••••••••••••••] [👁️ Mostra]         │
│                                         │
│ ℹ️ Usato automaticamente se WiFi       │
│    principale non disponibile          │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Priorità Connessione:                   │
│ 1. WiFi Principale                      │
│ 2. WiFi Backup                          │
│ 3. Hotspot Mobile (se configurato)      │
│                                         │
└─────────────────────────────────────────┘
```

**Suggerimenti WiFi**:
- Usa password complesse (min 12 caratteri)
- Cambia password periodicamente (ogni 3 mesi)
- Configura sempre WiFi backup per ridondanza
- Preferisci WPA2/WPA3 per sicurezza

Clicca **"Avanti"**

#### PASSO 4: App Predefinite

Scegli quali app installare automaticamente:

```
┌─────────────────────────────────────────┐
│ APP PREDEFINITE                         │
├─────────────────────────────────────────┤
│                                         │
│ 🔍 Cerca app: [____________] 🔍         │
│                                         │
│ App Disponibili:                        │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ Omnily POS                        │ │
│ │   v1.2.3 • 45 MB                    │ │
│ │   Sistema POS principale            │ │
│ │   [Sempre Aggiorna] [Richiesto]     │ │
│ ├─────────────────────────────────────┤ │
│ │ ☑ Inventory Manager                 │ │
│ │   v2.1.0 • 32 MB                    │ │
│ │   Gestione magazzino e inventario   │ │
│ │   [Auto Update] [Opzionale]         │ │
│ ├─────────────────────────────────────┤ │
│ │ ☑ Payment Gateway                   │ │
│ │   v1.5.2 • 28 MB                    │ │
│ │   Integrazione pagamenti            │ │
│ │   [Auto Update] [Richiesto]         │ │
│ ├─────────────────────────────────────┤ │
│ │ ☐ Staff Manager                     │ │
│ │   v1.0.5 • 18 MB                    │ │
│ │   Gestione turni personale          │ │
│ │   [Manuale] [Opzionale]             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ App Selezionate: 3                      │
│ Spazio Totale: 105 MB                   │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Politica Update:                        │
│ ● Auto Update Notturno (03:00)          │
│ ○ Manuale (richiede conferma)          │
│ ○ Prompt Utente                         │
│                                         │
│ Condizioni Update:                      │
│ ☑ Solo con WiFi                         │
│ ☑ Batteria > 30%                        │
│ ☑ Dispositivo idle                      │
│                                         │
└─────────────────────────────────────────┘
```

**Per ogni app puoi configurare**:
- **Richiesto/Opzionale**: App essenziale o accessoria
- **Auto Update**: Aggiornamento automatico o manuale
- **Versione**: Specifica o sempre latest

Clicca **"Avanti"**

#### PASSO 5: Orari e Automazioni

Configura orari operativi e automazioni:

```
┌─────────────────────────────────────────┐
│ ORARI OPERATIVI                         │
├─────────────────────────────────────────┤
│                                         │
│ Fuso Orario*:                           │
│ [Europe/Rome ▼_____________________]    │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Orari Apertura:                         │
│                                         │
│ Lunedì    [09:00] - [20:00] ☑ Aperto   │
│ Martedì   [09:00] - [20:00] ☑ Aperto   │
│ Mercoledì [09:00] - [20:00] ☑ Aperto   │
│ Giovedì   [09:00] - [20:00] ☑ Aperto   │
│ Venerdì   [09:00] - [21:00] ☑ Aperto   │
│ Sabato    [09:00] - [21:00] ☑ Aperto   │
│ Domenica  [10:00] - [19:00] ☑ Aperto   │
│                                         │
│ [Copia a Tutti] [Applica Festivi]      │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ AUTOMAZIONI                             │
│                                         │
│ Avvio Automatico:                       │
│ ☑ Accendi dispositivi all'apertura      │
│   ⏰ 15 minuti prima orario apertura    │
│   📱 Avvia app POS automaticamente      │
│                                         │
│ Spegnimento Automatico:                 │
│ ☑ Spegni dispositivi alla chiusura      │
│   ⏰ 30 minuti dopo orario chiusura     │
│   💾 Backup automatico prima spegnimento│
│                                         │
│ Manutenzione:                           │
│ ☑ Riavvio automatico notturno           │
│   ⏰ Ogni notte alle 03:00              │
│   🧹 Pulizia cache e temp files        │
│                                         │
│ ☑ Update automatico notturno            │
│   ⏰ Ogni domenica alle 02:00           │
│   📦 Solo app non critiche              │
│                                         │
└─────────────────────────────────────────┘
```

Clicca **"Avanti"**

#### PASSO 6: Impostazioni Display e Tema

Configura aspetto e comportamento display:

```
┌─────────────────────────────────────────┐
│ DISPLAY E TEMA                          │
├─────────────────────────────────────────┤
│                                         │
│ Luminosità:                             │
│ ○ Automatica (sensore luce)             │
│ ● Manuale: [████████░░] 80%            │
│                                         │
│ Timeout Schermo:                        │
│ ● Mai (sempre acceso)                   │
│ ○ 5 minuti di inattività                │
│ ○ 10 minuti di inattività               │
│ ○ 30 minuti di inattività               │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Tema Interfaccia:                       │
│ ● Light Mode (chiaro)                   │
│ ○ Dark Mode (scuro)                     │
│ ○ Auto (segue orari: giorno/notte)     │
│                                         │
│ Schema Colori:                          │
│ ● Default (blu/bianco)                  │
│ ○ Warm (arancione/beige)                │
│ ○ Cool (azzurro/grigio)                 │
│ ○ Brand (colori aziendali)              │
│                                         │
│ Font Size:                              │
│ ○ Piccolo                               │
│ ● Medio (consigliato)                   │
│ ○ Grande (accessibilità)                │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Screensaver:                            │
│ ☑ Abilita screensaver dopo 5 min idle   │
│   Tipo: ● Logo Aziendale                │
│         ○ Orologio                      │
│         ○ Slideshow Prodotti            │
│                                         │
└─────────────────────────────────────────┘
```

Clicca **"Avanti"**

#### PASSO 7: Configurazione Kiosk Mode

Configura modalità kiosk se necessaria:

```
┌─────────────────────────────────────────┐
│ MODALITÀ KIOSK                          │
├─────────────────────────────────────────┤
│                                         │
│ ☑ Abilita Modalità Kiosk                │
│                                         │
│ App Kiosk*:                             │
│ [Omnily POS ▼______________________]    │
│                                         │
│ Comportamento:                          │
│ ☑ Avvio automatico al boot              │
│ ☑ Riavvio app se crasha                 │
│ ☑ Blocca uscita dall'app                │
│                                         │
│ PIN Uscita Kiosk*:                      │
│ [••••] [👁️ Mostra]                     │
│ ℹ️ 4 cifre per uscire da kiosk mode    │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Restrizioni:                            │
│ ☑ Nascondi Status Bar                   │
│ ☑ Nascondi Navigation Bar               │
│ ☑ Blocca pulsante Home                  │
│ ☑ Blocca pulsante Back                  │
│ ☑ Blocca pulsante Recent Apps           │
│ ☑ Disabilita notifiche                  │
│                                         │
│ Funzioni Consentite:                    │
│ ☐ Impostazioni WiFi                     │
│ ☐ Impostazioni Bluetooth                │
│ ☐ Regolazione Volume                    │
│ ☐ Regolazione Luminosità                │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Whitelist App (opzionale):              │
│ App utilizzabili anche in kiosk mode:   │
│ ☑ Fotocamera (per scan barcode)         │
│ ☑ Calcolatrice                          │
│ ☐ Browser                               │
│                                         │
└─────────────────────────────────────────┘
```

**Kiosk Mode è utile per**:
- Dispositivi dedicati (es. solo POS)
- Prevenire uso improprio
- Sicurezza negozi ad alto traffico
- Ridurre errori utente

Clicca **"Avanti"**

#### PASSO 8: Template Stampa (Opzionale)

Associa template di stampa predefiniti:

```
┌─────────────────────────────────────────┐
│ TEMPLATE STAMPA                         │
├─────────────────────────────────────────┤
│                                         │
│ Stampante Predefinita:                  │
│ [Sunmi T2 Built-in ▼_______________]    │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Template Scontrino:                     │
│ [Standard IT Retail ▼______________]    │
│ [👁️ Anteprima]                         │
│                                         │
│ Larghezza Carta: [58mm ▼]              │
│ Include Logo: ☑                         │
│ Include P.IVA: ☑                        │
│ Include Footer: ☑                       │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Template Etichette:                     │
│ [Prezzo Standard ▼_________________]    │
│ [👁️ Anteprima]                         │
│                                         │
│ Formato: [40x30mm ▼]                   │
│ Barcode: ☑ EAN-13                       │
│ Include Valuta: ☑                       │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Opzioni Stampa:                         │
│ ☑ Stampa automatica scontrino           │
│ ☑ Chiedi conferma prima stampa          │
│ ☐ Copia scontrino di default            │
│                                         │
└─────────────────────────────────────────┘
```

Clicca **"Avanti"**

#### PASSO 9: Impostazioni Avanzate

Configura opzioni avanzate:

```
┌─────────────────────────────────────────┐
│ IMPOSTAZIONI AVANZATE                   │
├─────────────────────────────────────────┤
│                                         │
│ Sicurezza:                              │
│ ☑ Crittografia storage dispositivo      │
│ ☑ Richiedi PIN all'avvio                │
│ ☑ Blocco dopo 3 tentativi errati        │
│ ☑ Wipe automatico dopo 10 tentativi     │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Backup:                                 │
│ Backup Automatico:                      │
│ ● Giornaliero (ogni notte 02:00)        │
│ ○ Settimanale (domenica 02:00)          │
│ ○ Mensile (1° del mese 02:00)           │
│                                         │
│ Cosa includere:                         │
│ ☑ Configurazioni app                    │
│ ☑ Dati transazioni                      │
│ ☑ Log sistema                           │
│ ☐ Media files (foto, video)             │
│                                         │
│ Retention: [30 giorni ▼]               │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Telemetria:                             │
│ ☑ Invia diagnostica automatica          │
│ ☑ Report crash anonimi                  │
│ ☑ Statistiche utilizzo                  │
│ ☐ Screenshots errori (privacy)          │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Performance:                            │
│ CPU Limit: [Nessun limite ▼]           │
│ RAM Limit: [Nessun limite ▼]           │
│                                         │
│ ☑ Power Saving Mode (se batteria < 20%) │
│ ☑ Limita processi background            │
│                                         │
└─────────────────────────────────────────┘
```

Clicca **"Avanti"**

#### PASSO 10: Rivedi e Salva

Riepilogo finale della configurazione:

```
╔═══════════════════════════════════════╗
║ RIEPILOGO CONFIGURAZIONE              ║
╠═══════════════════════════════════════╣
║ Store: Milano Centro                  ║
║ Codice: MIL-CTR                       ║
║ Città: Milano                         ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ WiFi:                                 ║
║ • Principale: Store-WiFi-Milano       ║
║ • Backup: Store-WiFi-Milano-Backup    ║
║                                       ║
║ App Predefinite: 3                    ║
║ • Omnily POS v1.2.3                   ║
║ • Inventory Manager v2.1.0            ║
║ • Payment Gateway v1.5.2              ║
║                                       ║
║ Orari:                                ║
║ • Lun-Gio: 09:00-20:00                ║
║ • Ven-Sab: 09:00-21:00                ║
║ • Domenica: 10:00-19:00               ║
║                                       ║
║ Kiosk Mode: ✅ Abilitato              ║
║ • App: Omnily POS                     ║
║ • PIN Uscita: ••••                    ║
║                                       ║
║ Automazioni:                          ║
║ • Riavvio notturno: 03:00             ║
║ • Update automatici: Domenica 02:00   ║
║ • Backup giornaliero: 02:00           ║
╚═══════════════════════════════════════╝

Nome Configurazione*:
[Config Milano Centro v2.1____________]

Versione:
[2.1___________________________________]

Note (opzionale):
┌─────────────────────────────────────┐
│ Configurazione completa per store   │
│ Milano Centro. Include tutte app,   │
│ kiosk mode e automazioni standard.  │
└─────────────────────────────────────┘

[← Indietro]  [Salva Configurazione →]
```

Clicca **"Salva Configurazione"**

#### RISULTATO

```
╔═══════════════════════════════════════╗
║ ✅ CONFIGURAZIONE CREATA!             ║
╠═══════════════════════════════════════╣
║ Config Milano Centro v2.1             ║
║ salvata con successo.                 ║
║                                       ║
║ Puoi ora:                             ║
║ • Applicarla a dispositivi esistenti  ║
║ • Usarla per nuovi token setup        ║
║ • Duplicarla per store simili         ║
╚═══════════════════════════════════════╝

[Applica a Dispositivi] [Chiudi]
```

---

## Applicare Configurazione

### Applica a Dispositivi Esistenti

#### Metodo 1: Da Configurazioni Store

1. **Clicca sulla config** nella lista
2. **Clicca "Applica a Dispositivi"**
3. **Seleziona dispositivi target**:
   - Ricerca per nome
   - Filtra per store attuale
   - Seleziona multipli con checkbox
4. **Configura override**:
   ```
   ☑ Override configurazione esistente
   ☐ Mantieni app già installate
   ☑ Riavvia dopo applicazione
   ```
5. **Clicca "Applica"**
6. Operazione viene eseguita in background

#### Metodo 2: Da Gestione Dispositivi

1. Vai in **Gestione Dispositivi**
2. **Seleziona dispositivo**
3. **Clicca "Applica Config"**
4. **Scegli config** dal dropdown
5. **Conferma applicazione**

### Applica a Nuovi Dispositivi (Token)

Quando generi un token setup:
1. Nel wizard token, **sezione "Configurazione Store"**
2. Seleziona la config desiderata
3. Il nuovo dispositivo verrà configurato automaticamente alla registrazione

---

## Gestire Configurazioni

### Modificare Configurazione

1. **Clicca sulla config** nella lista
2. **Clicca "Modifica"**
3. Modifica le sezioni desiderate
4. **Salva Modifiche**

**Importante**: Le modifiche non si applicano automaticamente ai dispositivi già configurati. Devi riapplicare manualmente.

### Duplicare Configurazione

Utile per store simili:

1. **Clicca sulla config** da duplicare
2. **Clicca "Duplica"**
3. **Modifica nome**: `Config Roma Termini` (basata su Milano)
4. **Modifica differenze**:
   - SSID WiFi specifico
   - Orari diversi
   - Indirizzo
5. **Salva come nuova config**

### Versioning

Ogni modifica crea una nuova versione:

```
Storico Versioni:
• v2.1 (Corrente) - 15/01/2024
  Aggiunto WiFi backup

• v2.0 - 10/01/2024
  Update orari festivi

• v1.5 - 05/01/2024
  Aggiunta app Inventory Manager

• v1.0 - 01/01/2024
  Versione iniziale
```

**Ripristino versione precedente**:
1. Clicca **"Storico Versioni"**
2. Seleziona versione da ripristinare
3. Clicca **"Ripristina"**
4. Viene creata come nuova versione corrente

### Eliminare Configurazione

1. **Clicca sulla config**
2. **Clicca "Elimina"**
3. **Conferma**:
   ```
   ⚠️ Eliminare Config Milano Centro?

   12 dispositivi usano questa config.

   Cosa fare con i dispositivi:
   ○ Rimuovi config (dispositivi senza config)
   ● Assegna altra config: [Seleziona ▼]

   [Annulla] [Elimina]
   ```

---

## Best Practices

### 🏗️ Struttura Configurazioni

**Per Catena Retail**:
```
Struttura consigliata:
├─ Config Base Retail
│  └─ Impostazioni comuni a tutti gli store
│
├─ Config Nord
│  └─ Fuso orario, lingua, specifiche area
│  ├─ Config Milano Centro
│  ├─ Config Milano Duomo
│  └─ Config Torino Centro
│
├─ Config Centro
│  ├─ Config Roma Termini
│  └─ Config Firenze SMN
│
└─ Config Sud
   ├─ Config Napoli Centrale
   └─ Config Bari Centro
```

### 🔄 Manutenzione

- **Revisiona config** ogni 3 mesi
- **Aggiorna password WiFi** periodicamente
- **Mantieni app aggiornate** nelle config
- **Documenta modifiche** nelle note versione

### 🔐 Sicurezza

- **Non condividere** password WiFi nelle config pubbliche
- **Usa kiosk mode** per dispositivi esposti pubblico
- **Abilita crittografia** per dati sensibili
- **Backup regolari** configurazioni importanti

---

## FAQ

**Q: Posso avere più configurazioni per lo stesso store?**
A: Sì, utile per dispositivi con ruoli diversi (POS vs Back Office).

**Q: Le modifiche si applicano automaticamente?**
A: No, devi riapplicare manualmente o configurare sync automatico.

**Q: Posso importare config da file?**
A: Sì, formato JSON supportato per import/export.

**Q: Limite numero configurazioni?**
A: Nessun limite tecnico.

**Q: Config include dati sensibili?**
A: Sì (password WiFi), sono criptate a riposo e in transito.
