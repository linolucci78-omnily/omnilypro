# Setup Tokens

## Panoramica

I **Setup Tokens** sono chiavi di provisioning usa-e-getta che permettono di registrare nuovi dispositivi in modo sicuro e rapido. Ogni token contiene tutte le informazioni necessarie per la configurazione iniziale.

---

## Come Accedere

### Passo 1: Apri Setup Tokens

1. Accedi alla dashboard OmnilyPro
2. Vai in **Dashboard Admin → MDM**
3. Clicca sulla tab **Setup Tokens**
4. Visualizzi la lista dei token esistenti

### Interfaccia Principale

```
┌─────────────────────────────────────────────┐
│ [🔍 Cerca token...]         [Genera Token] │ ← Header
├─────────────────────────────────────────────┤
│ LISTA TOKEN                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔑 TOKEN-2024-001                       │ │
│ │ POS-Milano-Centro-01                    │ │
│ │ Store: Milano Centro                    │ │
│ │ Stato: ✅ Attivo • Scade: 30 giorni    │ │
│ │ [📄 QR Code] [🔗 Link] [🗑️ Revoca]    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔑 TOKEN-2024-002                       │ │
│ │ POS-Roma-Termini-02                     │ │
│ │ Store: Roma Termini                     │ │
│ │ Stato: ✅ Usato • Dispositivo registrato│ │
│ │ [📄 Vedi QR] [📊 Dettagli]             │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Generare un Token

### Guida Completa Step-by-Step

#### PASSO 1: Clicca "Genera Token"

1. In alto a destra, clicca il pulsante **"Genera Token"**
2. Si apre la modale di configurazione token

#### PASSO 2: Informazioni Dispositivo

Compila i dati identificativi del dispositivo:

```
┌─────────────────────────────────────────┐
│ INFORMAZIONI DISPOSITIVO                │
├─────────────────────────────────────────┤
│                                         │
│ Nome Dispositivo*:                      │
│ [POS-Milano-Centro-01________________]  │
│ ℹ️ Usa naming convention chiara        │
│   Esempio: POS-[Città]-[Store]-[N]     │
│                                         │
│ Descrizione (opzionale):                │
│ [POS principale cassa 1 Milano Centro]  │
│                                         │
│ Serial Number / IMEI (opzionale):       │
│ [356938035643809_____________________]  │
│ ℹ️ Per tracking hardware               │
│                                         │
└─────────────────────────────────────────┘
```

**Suggerimenti Naming**:
- ✅ `POS-Milano-Duomo-01` (chiaro, organizzato)
- ✅ `POS-Roma-Termini-Cassa3` (descrittivo)
- ❌ `Device123` (non descrittivo)
- ❌ `Andrea` (confuso con persona)

#### PASSO 3: Associazione Store

Associa il dispositivo a uno store esistente:

```
┌─────────────────────────────────────────┐
│ STORE E ORGANIZZAZIONE                  │
├─────────────────────────────────────────┤
│                                         │
│ 🔍 Cerca Store:                         │
│ [Milano_________________________] 🔍    │
│                                         │
│ Risultati:                              │
│ ┌─────────────────────────────────────┐ │
│ │ ● Milano Centro                     │ │
│ │   Via Dante, 15 - Milano            │ │
│ │   Org: Retail Nord                  │ │
│ ├─────────────────────────────────────┤ │
│ │ ○ Milano Duomo                      │ │
│ │   Piazza Duomo, 1 - Milano          │ │
│ │   Org: Retail Nord                  │ │
│ ├─────────────────────────────────────┤ │
│ │ ○ Milano Centrale                   │ │
│ │   Piazza Duca d'Aosta - Milano      │ │
│ │   Org: Retail Nord                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Oppure:                                 │
│ [➕ Crea Nuovo Store]                  │
│                                         │
└─────────────────────────────────────────┘
```

**Cosa succede quando selezioni uno store**:
- Il dispositivo eredita configurazioni store
- WiFi, orari, app predefinite applicate automaticamente
- Apparirà nel gruppo store nella dashboard

**Opzione "Nessuno Store"**:
- Dispositivo standalone, non associato
- Dovrai configurare manualmente WiFi e app
- Utile per device di test o temporanei

#### PASSO 4: Configurazione Store (Opzionale)

Scegli se applicare una configurazione store specifica:

```
┌─────────────────────────────────────────┐
│ CONFIGURAZIONE STORE                    │
├─────────────────────────────────────────┤
│                                         │
│ ○ Nessuna configurazione                │
│   Configurazione manuale dopo           │
│                                         │
│ ● Applica Configurazione Store          │
│   Usa configurazione predefinita store  │
│                                         │
│   Config Selezionata:                   │
│   📋 Config Milano Centro v2.1          │
│   ├─ WiFi: Store-WiFi-Milano           │
│   ├─ App: 5 app predefinite            │
│   ├─ Orari: 09:00-20:00                │
│   └─ Tema: Light Mode                  │
│                                         │
│   [📋 Vedi Dettagli Config]            │
│                                         │
│ ○ Config Personalizzata                 │
│   Crea config specifica per dispositivo │
│   [⚙️ Configura →]                     │
│                                         │
└─────────────────────────────────────────┘
```

**Consiglio**: Usa "Applica Configurazione Store" per consistenza.

#### PASSO 5: Opzioni Avanzate

Configura opzioni aggiuntive:

```
┌─────────────────────────────────────────┐
│ OPZIONI AVANZATE                        │
├─────────────────────────────────────────┤
│                                         │
│ Validità Token:                         │
│ ● 30 giorni (default)                   │
│ ○ 7 giorni                              │
│ ○ 90 giorni                             │
│ ○ Personalizzato: [__] giorni          │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Utilizzi Consentiti:                    │
│ ● Una volta (consigliato)               │
│ ○ Fino a 3 volte                        │
│ ○ Illimitati (⚠️ non sicuro)           │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Restrizioni IP (opzionale):             │
│ ☐ Limita a IP specifici                 │
│   [192.168.1.0/24_________________]     │
│   ℹ️ Solo da questa rete               │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Notifiche:                              │
│ ☑ Email quando token viene usato        │
│ ☑ Alert se token scade senza essere    │
│   utilizzato                            │
│                                         │
└─────────────────────────────────────────┘
```

#### PASSO 6: Rivedi e Genera

Riepilogo finale prima della generazione:

```
╔═══════════════════════════════════════╗
║ RIEPILOGO TOKEN                       ║
╠═══════════════════════════════════════╣
║ Dispositivo:                          ║
║ • Nome: POS-Milano-Centro-01          ║
║ • Store: Milano Centro                ║
║ • Config: Config Milano Centro v2.1   ║
║                                       ║
║ Token:                                ║
║ • Validità: 30 giorni                 ║
║ • Utilizzi: 1 volta                   ║
║ • Restrizioni: Nessuna                ║
║                                       ║
║ Auto-Configurazione:                  ║
║ ✅ WiFi Store-WiFi-Milano             ║
║ ✅ 5 app predefinite                  ║
║ ✅ Orari apertura 09:00-20:00         ║
║ ✅ Tema Light Mode                    ║
╚═══════════════════════════════════════╝

[← Indietro]  [Genera Token →]
```

Clicca **"Genera Token"**

#### PASSO 7: Token Generato!

Il token viene creato e visualizzata la schermata di successo:

```
╔═══════════════════════════════════════╗
║ ✅ TOKEN GENERATO CON SUCCESSO!       ║
╠═══════════════════════════════════════╣
║                                       ║
║ Token ID: TOKEN-2024-001              ║
║ Dispositivo: POS-Milano-Centro-01     ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ QR CODE:                              ║
║                                       ║
║   ███████████████████████████         ║
║   ██ ▄▄▄▄▄ █▀ █▀▀ ▀█ ▄▄▄▄▄ ██         ║
║   ██ █   █ █▀▀ ▄ ▀██ █   █ ██         ║
║   ██ █▄▄▄█ ██▄█ ▄ ██ █▄▄▄█ ██         ║
║   ██▄▄▄▄▄▄▄█ █▄▀▄▀▄█▄▄▄▄▄▄▄██         ║
║   ██ ▀▄█ ▄▄  ▄▄ ▀ █▀▀▄█▄█ ▀██         ║
║   ████████████████████████████         ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Scansiona questo QR Code con          ║
║ Omnily Bridge per registrare          ║
║ il dispositivo automaticamente.       ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Azioni:                               ║
║ [📥 Scarica QR] [🖨️ Stampa]          ║
║ [📋 Copia Link] [✉️ Invia Email]     ║
║                                       ║
║ [✕ Chiudi]                           ║
╚═══════════════════════════════════════╝
```

---

## Utilizzare il Token

### Metodo 1: QR Code (Consigliato)

#### Sul Computer:
1. **Scarica QR Code**: Clicca "Scarica QR"
2. Il file viene salvato: `token-POS-Milano-Centro-01.png`

#### Sul Dispositivo Android:
1. **Installa Omnily Bridge** (se non già installato)
2. **Apri Omnily Bridge**
3. **Tap su "Provisioning Guidato"**
4. **Scegli "Scansiona QR Code"**
5. **Inquadra il QR Code** con la camera
6. **Automatico**: Dispositivo si configura automaticamente
7. **Attendi 30-60 secondi**
8. **✅ Registrazione completata!**

Il dispositivo ora:
- È registrato nella piattaforma
- Ha il WiFi configurato
- Ha le app predefinite installate
- Appare nella dashboard MDM

### Metodo 2: Link Diretto

Se non puoi usare QR Code:

#### Sul Computer:
1. **Clicca "Copia Link"**
2. Link copiato: `https://omnilypro.com/provision?token=abc123...`

#### Sul Dispositivo Android:
1. **Apri Omnily Bridge**
2. **Tap su "Provisioning Guidato"**
3. **Scegli "Inserisci Link"**
4. **Incolla il link** copiato
5. **Tap "Continua"**
6. Registrazione procede automaticamente

### Metodo 3: Setup Manuale

Per tecnici avanzati:

#### Ottieni Token String:
1. Clicca **"Vedi Token"** nel dettaglio
2. Token string: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **Copia Token**

#### Sul Dispositivo:
1. Omnily Bridge → **Setup Manuale**
2. **Server URL**: `https://omnilypro.com`
3. **Token**: Incolla token copiato
4. **Device ID**: Auto-generato o personalizza
5. **Registra**

---

## Gestire Token Esistenti

### Visualizzare Lista Token

La lista mostra tutti i token con stati:

```
┌─────────────────────────────────────┐
│ 🟢 Attivo                           │
│ Token valido, non ancora utilizzato │
│                                     │
│ 🔵 Usato                            │
│ Token utilizzato, dispositivo reg.  │
│                                     │
│ ⏰ In Scadenza                      │
│ Scade tra meno di 7 giorni          │
│                                     │
│ ❌ Scaduto                          │
│ Token non più valido                │
│                                     │
│ 🚫 Revocato                         │
│ Token annullato manualmente         │
└─────────────────────────────────────┘
```

### Cercare Token

Usa la barra di ricerca per trovare:

```
🔍 Ricerca: "Milano"

Risultati:
• TOKEN-2024-001 - POS-Milano-Centro-01
• TOKEN-2024-005 - POS-Milano-Duomo-02
• TOKEN-2024-012 - POS-Milano-Centrale-01
```

### Filtrare Token

Dropdown filtri:

```
┌─────────────────────────────────────┐
│ Stato:                              │
│ ● Tutti                             │
│ ○ Attivi                            │
│ ○ Usati                             │
│ ○ Scaduti                           │
│ ○ Revocati                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Store:                              │
│ ● Tutti                             │
│ ○ Milano Centro                     │
│ ○ Roma Termini                      │
│ ○ Firenze Santa Maria Novella       │
└─────────────────────────────────────┘
```

### Azioni Token

Per ogni token nella lista:

#### 📄 Scarica QR Code
- Download immagine PNG QR Code
- Pronta per stampa o condivisione

#### 🖨️ Stampa QR Code
- Apre dialog stampa browser
- Include info dispositivo e istruzioni
- Formato A4 ottimizzato

#### 📋 Copia Link
- Copia link provisioning negli appunti
- Pronto per invio via email/chat

#### ✉️ Invia Email
Apre dialog invio email:

```
┌─────────────────────────────────────┐
│ INVIA TOKEN VIA EMAIL               │
├─────────────────────────────────────┤
│                                     │
│ A (Email destinatario):             │
│ [tecnico@store.com______________]   │
│                                     │
│ Oggetto:                            │
│ [Token Setup POS-Milano-Centro-01]  │
│                                     │
│ Messaggio:                          │
│ ┌─────────────────────────────────┐ │
│ │ Gentile Tecnico,                │ │
│ │                                 │ │
│ │ In allegato trovi il QR Code    │ │
│ │ per configurare il dispositivo: │ │
│ │ POS-Milano-Centro-01            │ │
│ │                                 │ │
│ │ Istruzioni:                     │ │
│ │ 1. Installa Omnily Bridge       │ │
│ │ 2. Scansiona QR Code            │ │
│ │ 3. Attendi configurazione       │ │
│ │                                 │ │
│ │ Il token scade tra 30 giorni.   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Allegati:                           │
│ ✅ QR Code PNG                      │
│ ✅ Istruzioni PDF                   │
│                                     │
│ [Annulla]  [Invia Email →]         │
└─────────────────────────────────────┘
```

#### 🗑️ Revoca Token
Invalida il token:

```
┌─────────────────────────────────────┐
│ ⚠️ REVOCARE TOKEN?                  │
├─────────────────────────────────────┤
│                                     │
│ Stai per revocare:                  │
│ TOKEN-2024-001                      │
│ POS-Milano-Centro-01                │
│                                     │
│ Il token diventerà inutilizzabile.  │
│                                     │
│ Motivo revoca (opzionale):          │
│ [Token non più necessario_______]   │
│                                     │
│ [Annulla]  [Revoca Definitivo]     │
└─────────────────────────────────────┘
```

**Quando revocare**:
- Token compromesso (condiviso per errore)
- Dispositivo non più necessario
- Token generato per errore

#### 🔄 Rigenera QR Code
Se QR Code è stato perso:

1. Clicca "Rigenera QR"
2. Nuovo QR Code viene generato
3. Il token ID resta lo stesso
4. Configurazione resta invariata

### Visualizzare Dettagli Token

Clicca su un token per dettagli completi:

```
╔═══════════════════════════════════════╗
║ DETTAGLI TOKEN                        ║
╠═══════════════════════════════════════╣
║ Token ID: TOKEN-2024-001              ║
║ Stato: 🟢 Attivo                      ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Dispositivo:                          ║
║ • Nome: POS-Milano-Centro-01          ║
║ • Store: Milano Centro                ║
║ • Organizzazione: Retail Nord         ║
║ • Serial: 356938035643809             ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Configurazione:                       ║
║ • Config: Milano Centro v2.1          ║
║ • WiFi: Store-WiFi-Milano             ║
║ • App Predefinite: 5 app              ║
║ • Orari: 09:00-20:00                  ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Validità:                             ║
║ • Creato: 15/01/2024 10:30            ║
║ • Scade: 14/02/2024 10:30             ║
║ • Giorni rimanenti: 23                ║
║ • Utilizzi: 0/1                       ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Creato da:                            ║
║ • Utente: admin@omnily.com            ║
║ • IP: 192.168.1.100                   ║
║ • Data: 15/01/2024 10:30:45           ║
║                                       ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Storico:                              ║
║ • 15/01 10:30 - Token creato          ║
║ • 15/01 10:31 - QR Code scaricato     ║
║ • 15/01 10:35 - Email inviata a       ║
║   tecnico@store.com                   ║
║ • In attesa di utilizzo...            ║
╚═══════════════════════════════════════╝

[📥 Scarica QR] [✉️ Invia Email] [🗑️ Revoca]
```

---

## Best Practices

### 🔐 Sicurezza

1. **Usa token usa-e-getta**: 1 utilizzo per massima sicurezza
2. **Validità breve**: 7-30 giorni sufficiente
3. **Revoca immediatamente** token compromessi
4. **Non condividere** token via canali non sicuri
5. **Verifica utilizzo** regolarmente nei log

### 📋 Organizzazione

1. **Naming convention**: Usa schema consistente per nomi dispositivi
2. **Associa sempre a store**: Facilita gestione e configurazione
3. **Usa config store**: Evita configurazioni manuali
4. **Documenta serial number**: Utile per tracking hardware

### 📊 Monitoraggio

1. **Rivedi token attivi** settimanalmente
2. **Elimina token scaduti** per pulizia lista
3. **Traccia utilizzi** nei activity logs
4. **Alert per token non usati**: Configura notifiche

### 🔄 Workflow

**Setup Massa (es. 10 nuovi POS)**:
1. **Prepara lista** dispositivi con info complete
2. **Genera token in batch** (uno per dispositivo)
3. **Scarica tutti QR Code** in una cartella
4. **Stampa QR Codes** (1 pagina per dispositivo)
5. **Allega a dispositivi** fisici
6. **Invia a tecnici** con istruzioni
7. **Monitora registrazioni** in dashboard

---

## Troubleshooting

### Token Non Funziona

**Problema**: QR Code scansionato ma registrazione fallisce

**Cause Possibili**:
1. Token scaduto
2. Token già utilizzato
3. Token revocato
4. QR Code corrotto/illeggibile
5. Dispositivo senza internet

**Soluzioni**:
1. Verifica stato token in piattaforma
2. Se scaduto, genera nuovo token
3. Rigenera QR Code se corrotto
4. Verifica connessione internet dispositivo
5. Prova metodo link diretto invece di QR

### QR Code Non Scansionabile

**Problema**: Camera non riesce a leggere QR Code

**Soluzioni**:
1. **Aumenta luminosità** schermo o stampa
2. **Pulisci camera** dispositivo
3. **Migliora illuminazione** ambiente
4. **Scarica QR ad alta risoluzione**
5. **Usa link diretto** come alternativa

### Configurazione Non Applicata

**Problema**: Dispositivo registrato ma senza config store

**Soluzioni**:
1. Verifica che config store sia assegnata al token
2. Forza sync dispositivo dopo registrazione
3. Applica manualmente config da dashboard dispositivi
4. Controlla activity logs per errori configurazione

### Email Token Non Arrivata

**Problema**: Email con token non ricevuta

**Soluzioni**:
1. Controlla cartella spam
2. Verifica email destinatario corretta
3. Riinvia email da piattaforma
4. Scarica QR e invia manualmente

---

## FAQ

**Q: Posso riutilizzare un token scaduto?**
A: No, devi generarne uno nuovo. I token scaduti non possono essere riattivati.

**Q: Cosa succede se perdo il QR Code?**
A: Se token non ancora utilizzato, puoi rigenerare il QR dalla piattaforma. Stesso token, nuovo QR.

**Q: Posso cambiare la configurazione dopo aver generato il token?**
A: Sì, fino a quando token non è stato utilizzato. Dopo utilizzo, modifica da dashboard dispositivo.

**Q: Il token contiene dati sensibili?**
A: Sì, contiene info configurazione e credenziali WiFi criptate. Non condividere pubblicamente.

**Q: Quanti token posso generare?**
A: Nessun limite. Puoi generare token illimitati.

**Q: Posso generare token per provisioning multipli dispositivi?**
A: Sconsigliato. Meglio 1 token per dispositivo per sicurezza e tracking. Per masse, usa batch generation.

**Q: Token funziona offline?**
A: No, il dispositivo deve avere connessione internet per validare token e scaricare configurazione.
