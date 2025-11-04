# Template di Stampa

## Panoramica

I **Template di Stampa** permettono di personalizzare il formato e il contenuto di scontrini, etichette e altri documenti stampati dai dispositivi POS. Sistema centralizzato per gestire tutti i template di stampa.

---

## Come Accedere

### Passo 1: Apri Template di Stampa

1. Accedi alla dashboard OmnilyPro
2. Vai in **Dashboard Admin → MDM**
3. Clicca sulla tab **Template di Stampa**
4. Visualizzi la libreria template esistenti

### Interfaccia Principale

```
┌─────────────────────────────────────────────┐
│ [🔍 Cerca template...]   [Nuovo Template]  │ ← Header
├─────────────────────────────────────────────┤
│ LIBRERIA TEMPLATE                           │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🧾 Scontrino Standard IT                │ │
│ │ Tipo: Scontrino • 58mm                  │ │
│ │ Usato da: 45 dispositivi                │ │
│ │ [👁️ Anteprima] [✏️ Modifica] [📋]       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏷️ Etichetta Prezzo Standard            │ │
│ │ Tipo: Etichetta • 40x30mm               │ │
│ │ Usato da: 32 dispositivi                │ │
│ │ [👁️ Anteprima] [✏️ Modifica] [📋]       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Tipi di Template

### 🧾 Scontrini

Documenti fiscali emessi alla vendita:

**Caratteristiche**:
- Larghezza: 58mm o 80mm
- Lunghezza: Variabile
- Include: Logo, intestazione, articoli, totale, footer
- Formati: Fiscale IT, Ricevuta, Pro-forma

### 🏷️ Etichette Prezzo

Etichette adesive per prodotti:

**Formati Comuni**:
- 40x30mm (piccola)
- 50x30mm (media)
- 60x40mm (grande)
- 100x70mm (extra large)

**Include**: Nome prodotto, prezzo, barcode, valuta

### 📦 Etichette Spedizione

Etichette per pacchi e spedizioni:

**Formati Standard**:
- 100x150mm (standard)
- 100x200mm (grande)

**Include**: Mittente, destinatario, barcode tracking, corriere

### 📄 Report

Report stampabili:

**Tipi**:
- Chiusura cassa
- Report vendite giornaliero
- Inventario
- Report turno operatore

---

## Creare Nuovo Template

### Guida Completa Step-by-Step

#### PASSO 1: Clicca "Nuovo Template"

1. In alto a destra, clicca **"Nuovo Template"**
2. Si apre l'editor template

#### PASSO 2: Informazioni Base

```
┌─────────────────────────────────────────┐
│ INFORMAZIONI TEMPLATE                   │
├─────────────────────────────────────────┤
│                                         │
│ Nome Template*:                         │
│ [Scontrino Standard IT_____________]    │
│                                         │
│ Tipo*:                                  │
│ ● Scontrino                             │
│ ○ Etichetta Prezzo                      │
│ ○ Etichetta Spedizione                  │
│ ○ Report                                │
│                                         │
│ Categoria:                              │
│ [Fiscale ▼_________________________]    │
│ • Fiscale                               │
│ • Ricevuta                              │
│ • Pro-forma                             │
│ • Personalizzato                        │
│                                         │
│ Descrizione:                            │
│ ┌─────────────────────────────────────┐ │
│ │ Scontrino standard per negozi IT    │ │
│ │ Formato conforme normativa fiscale  │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

Clicca **"Avanti"**

#### PASSO 3: Formato Carta

Configura dimensioni e formato:

```
┌─────────────────────────────────────────┐
│ FORMATO CARTA                           │
├─────────────────────────────────────────┤
│                                         │
│ Larghezza Carta*:                       │
│ ● 58mm (termica standard)               │
│ ○ 80mm (termica large)                  │
│ ○ 40mm (etichette)                      │
│ ○ Personalizzato: [___] mm             │
│                                         │
│ Lunghezza:                              │
│ ● Variabile (dipende da contenuto)      │
│ ○ Fissa: [___] mm                      │
│                                         │
│ Margini:                                │
│ Superiore:  [3] mm                     │
│ Inferiore:  [3] mm                     │
│ Sinistro:   [2] mm                     │
│ Destro:     [2] mm                     │
│                                         │
│ Tipo Carta:                             │
│ ● Termica (senza ribbon)                │
│ ○ Laser                                 │
│ ○ Inkjet                                │
│ ○ Etichette adesive                     │
│                                         │
│ Orientamento:                           │
│ ● Verticale (Portrait)                  │
│ ○ Orizzontale (Landscape)               │
│                                         │
└─────────────────────────────────────────┘
```

Clicca **"Avanti"**

#### PASSO 4: Design Template

Editor visuale per creare il layout:

```
┌─────────────────────────────────────────┐
│ EDITOR TEMPLATE                         │
├─────────────────────────────────────────┤
│                                         │
│ Sezioni Disponibili:           Preview: │
│ ┌──────────────────┐    ┌──────────────┤
│ │ 📷 Logo          │    │ ┌──────────┐ │
│ │ 📝 Testo         │    │ │ [LOGO]   │ │
│ │ 📊 Barcode       │    │ ├──────────┤ │
│ │ 📋 Tabella       │    │ │ Store    │ │
│ │ ➖ Linea         │    │ │ Address  │ │
│ │ ⬜ Spazio        │    │ ├──────────┤ │
│ │ 🔢 Variabile     │    │ │ Receipt  │ │
│ │ 🖼️ Immagine      │    │ │ N.123    │ │
│ │ 📅 Data/Ora      │    │ │ 15/01/24 │ │
│ └──────────────────┘    │ ├──────────┤ │
│                         │ │ Items:   │ │
│ Trascina sezioni →      │ │ Product1 │ │
│ nell'area preview       │ │ €10.00   │ │
│                         │ │          │ │
│ [+ Aggiungi Sezione]    │ │ Total    │ │
│                         │ │ €10.00   │ │
│                         │ ├──────────┤ │
│                         │ │ Thanks!  │ │
│                         │ └──────────┘ │
│                         │              │
│ [🔄 Reset] [💾 Salva]   └──────────────┘
└─────────────────────────────────────────┘
```

#### Esempio: Creare Sezione Logo

1. **Trascina "Logo"** nel preview
2. **Clicca sulla sezione** per configurare:

```
┌─────────────────────────────────────────┐
│ CONFIGURAZIONE SEZIONE: LOGO            │
├─────────────────────────────────────────┤
│                                         │
│ Immagine Logo*:                         │
│ [📁 Carica Logo...]                    │
│ Corrente: omnily_logo.png (120x40px)   │
│                                         │
│ Dimensioni:                             │
│ Larghezza: [100] px                    │
│ Altezza:   [Auto ▼] (mantieni ratio)   │
│                                         │
│ Allineamento:                           │
│ ○ Sinistra                              │
│ ● Centro                                │
│ ○ Destra                                │
│                                         │
│ Margine Inferiore: [5] mm              │
│                                         │
│ [Annulla] [Applica]                    │
└─────────────────────────────────────────┘
```

#### Esempio: Creare Sezione Intestazione Store

1. **Trascina "Testo"** nel preview
2. **Configura**:

```
┌─────────────────────────────────────────┐
│ CONFIGURAZIONE SEZIONE: TESTO           │
├─────────────────────────────────────────┤
│                                         │
│ Contenuto:                              │
│ Tipo: ● Statico  ○ Variabile           │
│                                         │
│ Testo:                                  │
│ ┌─────────────────────────────────────┐ │
│ │ {store_name}                        │ │
│ │ {store_address}                     │ │
│ │ {store_city}, {store_zip}           │ │
│ │ P.IVA: {store_vat}                  │ │
│ │ Tel: {store_phone}                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Variabili Disponibili:                  │
│ {store_name}, {store_address},          │
│ {store_city}, {store_zip},              │
│ {store_vat}, {store_phone}              │
│                                         │
│ Formattazione:                          │
│ Font: [Arial ▼]                        │
│ Dimensione: [12] pt                    │
│ Stile: ☐ Grassetto ☐ Corsivo           │
│ Allineamento: ● Centro                  │
│                                         │
│ [Annulla] [Applica]                    │
└─────────────────────────────────────────┘
```

#### Esempio: Creare Tabella Articoli

1. **Trascina "Tabella"** nel preview
2. **Configura**:

```
┌─────────────────────────────────────────┐
│ CONFIGURAZIONE SEZIONE: TABELLA         │
├─────────────────────────────────────────┤
│                                         │
│ Tipo Tabella:                           │
│ ● Articoli Vendita                      │
│ ○ Personalizzata                        │
│                                         │
│ Colonne:                                │
│ ☑ Quantità     Larghezza: [10]%        │
│ ☑ Descrizione  Larghezza: [60]%        │
│ ☑ Prezzo Unità Larghezza: [15]%        │
│ ☑ Totale       Larghezza: [15]%        │
│                                         │
│ Intestazioni:                           │
│ ☑ Mostra intestazioni colonne           │
│ Stile: ☑ Grassetto ☐ Sottolineato      │
│                                         │
│ Righe:                                  │
│ Font: [Arial ▼] Dimensione: [10] pt   │
│ Spaziatura: [2] mm tra righe           │
│ Bordi: ☐ Mostra bordi celle            │
│                                         │
│ Totali:                                 │
│ ☑ Riga Subtotale                        │
│ ☑ Riga Tasse/IVA                        │
│ ☑ Riga Totale (grassetto)               │
│                                         │
│ [Annulla] [Applica]                    │
└─────────────────────────────────────────┘
```

#### Esempio: Creare Footer

1. **Trascina "Linea"** (separatore)
2. **Trascina "Testo"** per messaggio finale:

```
Contenuto Footer:
┌─────────────────────────────────────┐
│ Grazie per l'acquisto!              │
│ Ti aspettiamo presto!               │
│                                     │
│ Servizio Clienti: 800-123-456       │
│ www.omnily.com                      │
└─────────────────────────────────────┘

Formattazione:
Font: Arial, 10pt
Allineamento: Centro
Stile: Normale
```

#### PASSO 5: Configurazione Barcode (Se Applicabile)

Per scontrini e etichette:

```
┌─────────────────────────────────────────┐
│ CONFIGURAZIONE BARCODE                  │
├─────────────────────────────────────────┤
│                                         │
│ Tipo Barcode:                           │
│ ● Code128 (alfanumerico)                │
│ ○ EAN-13 (prodotti retail)              │
│ ○ QR Code (dati complessi)              │
│ ○ Code39 (industriale)                  │
│                                         │
│ Dati Barcode:                           │
│ ● Numero Ricevuta: {receipt_number}     │
│ ○ ID Transazione: {transaction_id}      │
│ ○ Personalizzato: [_______________]     │
│                                         │
│ Dimensioni:                             │
│ Larghezza: [40] mm                     │
│ Altezza:   [10] mm                     │
│                                         │
│ Opzioni:                                │
│ ☑ Mostra numeri sotto barcode           │
│ ☑ Checksum automatico                   │
│                                         │
│ Posizione:                              │
│ ● In alto (dopo header)                 │
│ ○ In basso (footer)                     │
│ ○ Personalizzata                        │
│                                         │
│ [Annulla] [Applica]                    │
└─────────────────────────────────────────┘
```

#### PASSO 6: Variabili Disponibili

Sistema di variabili dinamiche:

```
┌─────────────────────────────────────────┐
│ VARIABILI DISPONIBILI                   │
├─────────────────────────────────────────┤
│                                         │
│ 🏪 Store:                               │
│ {store_name}        Nome negozio        │
│ {store_address}     Indirizzo           │
│ {store_city}        Città               │
│ {store_zip}         CAP                 │
│ {store_phone}       Telefono            │
│ {store_vat}         Partita IVA         │
│ {store_fiscal}      Codice Fiscale      │
│                                         │
│ 🧾 Ricevuta:                            │
│ {receipt_number}    Numero ricevuta     │
│ {receipt_date}      Data (DD/MM/YYYY)   │
│ {receipt_time}      Ora (HH:MM:SS)      │
│ {receipt_datetime}  Data e ora completa │
│ {transaction_id}    ID transazione      │
│                                         │
│ 💰 Importi:                             │
│ {subtotal}          Subtotale           │
│ {tax}               IVA/Tasse           │
│ {tax_rate}          Aliquota IVA        │
│ {discount}          Sconto              │
│ {total}             Totale              │
│                                         │
│ 💳 Pagamento:                           │
│ {payment_method}    Metodo pagamento    │
│ {payment_amount}    Importo pagato      │
│ {change}            Resto               │
│                                         │
│ 👤 Operatore:                           │
│ {operator_name}     Nome operatore      │
│ {operator_id}       ID operatore        │
│ {cashier_name}      Nome cassiere       │
│                                         │
│ 📦 Articoli:                            │
│ {items}             Tabella articoli    │
│ {items_count}       Numero articoli     │
│                                         │
│ 📱 Dispositivo:                         │
│ {device_name}       Nome dispositivo    │
│ {device_id}         ID dispositivo      │
│                                         │
│ [Inserisci Variabile]                   │
└─────────────────────────────────────────┘
```

**Come usare variabili**:
- Scrivi `{nome_variabile}` nel testo
- Viene sostituita automaticamente in stampa
- Formattazione automatica per valuta e date

#### PASSO 7: Anteprima e Test

Prima di salvare, testa il template:

```
┌─────────────────────────────────────────┐
│ ANTEPRIMA TEMPLATE                      │
├─────────────────────────────────────────┤
│                                         │
│ Dati Test:                              │
│ ☑ Usa dati di esempio                   │
│ ○ Usa transazione reale: [Cerca...]    │
│                                         │
│ [🖨️ Stampa Test] [📄 Esporta PDF]      │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Preview:                                │
│ ┌─────────────────────────────────────┐ │
│ │        [OMNILY LOGO]                │ │
│ │                                     │ │
│ │      Store Milano Centro            │ │
│ │      Via Dante, 15                  │ │
│ │      20100 Milano                   │ │
│ │      P.IVA: IT12345678901           │ │
│ │      Tel: 02-1234567                │ │
│ │                                     │ │
│ │ ─────────────────────────────────   │ │
│ │                                     │ │
│ │ Ricevuta N. 12345                   │ │
│ │ 15/01/2024 14:30                    │ │
│ │ Operatore: Mario Rossi              │ │
│ │                                     │ │
│ │ |||||||||||||||||||||||||||||||     │ │
│ │ 12345                               │ │
│ │                                     │ │
│ │ ─────────────────────────────────   │ │
│ │                                     │ │
│ │ QTÀ DESC.           P.UN    TOTALE  │ │
│ │ 2   Prodotto A      €5.00   €10.00  │ │
│ │ 1   Prodotto B      €15.00  €15.00  │ │
│ │ 3   Prodotto C      €3.00   €9.00   │ │
│ │                                     │ │
│ │ ─────────────────────────────────   │ │
│ │                                     │ │
│ │ Subtotale:              €34.00      │ │
│ │ IVA (22%):              €7.48       │ │
│ │ TOTALE:                 €41.48      │ │
│ │                                     │ │
│ │ Pagato: Contanti        €50.00      │ │
│ │ Resto:                  €8.52       │ │
│ │                                     │ │
│ │ ─────────────────────────────────   │ │
│ │                                     │ │
│ │    Grazie per l'acquisto!           │ │
│ │    Ti aspettiamo presto!            │ │
│ │                                     │ │
│ │ Servizio Clienti: 800-123-456       │ │
│ │ www.omnily.com                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Dimensioni: 58mm x 180mm                │
│ Peso: ~15g di carta termica             │
│                                         │
└─────────────────────────────────────────┘
```

**Pulsanti Test**:
- **Stampa Test**: Stampa su stampante reale
- **Esporta PDF**: Salva PDF per verificare layout
- **Invia Email**: Invia anteprima via email

#### PASSO 8: Salva Template

```
┌─────────────────────────────────────────┐
│ SALVA TEMPLATE                          │
├─────────────────────────────────────────┤
│                                         │
│ Nome Finale*:                           │
│ [Scontrino Standard IT_____________]    │
│                                         │
│ Versione:                               │
│ [1.0________________________________]   │
│                                         │
│ Tag (per ricerca):                      │
│ [fiscale, italiano, retail_________]    │
│                                         │
│ Note Versione:                          │
│ ┌─────────────────────────────────────┐ │
│ │ Template iniziale per scontrini     │ │
│ │ fiscali italiani. Conforme normativa│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Visibilità:                             │
│ ● Privato (solo la mia organizzazione) │
│ ○ Pubblico (marketplace template)      │
│                                         │
│ [← Indietro] [Salva Template →]       │
└─────────────────────────────────────────┘
```

Clicca **"Salva Template"**

#### RISULTATO

```
╔═══════════════════════════════════════╗
║ ✅ TEMPLATE SALVATO!                  ║
╠═══════════════════════════════════════╣
║ Scontrino Standard IT v1.0            ║
║ salvato con successo.                 ║
║                                       ║
║ Puoi ora:                             ║
║ • Assegnarlo a dispositivi            ║
║ • Usarlo in config store              ║
║ • Testarlo con stampe reali           ║
╚═══════════════════════════════════════╝

[Assegna a Dispositivi] [Chiudi]
```

---

## Assegnare Template

### A Singolo Dispositivo

1. Vai in **Gestione Dispositivi**
2. **Seleziona dispositivo**
3. **Tab "Stampa"**
4. **Scegli template** dal dropdown:
   ```
   Template Scontrino: [Scontrino Standard IT ▼]
   Template Etichetta: [Etichetta Prezzo Standard ▼]
   ```
5. **Salva**

### A Configurazione Store

1. Vai in **Configurazioni Store**
2. **Seleziona/Crea config**
3. **Sezione "Template Stampa"**
4. **Assegna template**:
   ```
   Scontrino:        [Scontrino Standard IT ▼]
   Etichetta Prezzo: [Etichetta 40x30mm ▼]
   Report:           [Report Chiusura Cassa ▼]
   ```
5. **Salva config**

Tutti i dispositivi con quella config useranno questi template automaticamente.

### In Massa

1. Vai in **Template di Stampa**
2. **Seleziona template**
3. **Clicca "Assegna a Dispositivi"**
4. **Seleziona dispositivi target**
5. **Tipo Assegnazione**:
   ```
   ○ Scontrino
   ○ Etichetta Prezzo
   ○ Etichetta Spedizione
   ○ Report
   ```
6. **Applica**

---

## Gestire Template

### Modificare Template

1. **Clicca sul template** nella lista
2. **Clicca "Modifica"**
3. L'editor si apre con template caricato
4. **Modifica sezioni** desiderate
5. **Salva**:
   - ● Crea nuova versione (consigliato)
   - ○ Sovrascrivi versione corrente

**Importante**: Creare nuova versione permette rollback se necessario.

### Duplicare Template

Per creare varianti:

1. **Clicca sul template** da duplicare
2. **Clicca "Duplica"**
3. **Cambia nome**: `Scontrino Standard IT - Compatto`
4. **Modifica layout** per variante
5. **Salva come nuovo template**

### Versionamento

Ogni template mantiene storico versioni:

```
╔═══════════════════════════════════════╗
║ STORICO VERSIONI                      ║
║ Scontrino Standard IT                 ║
╠═══════════════════════════════════════╣
║ v2.1 (Corrente) - 15/01/2024          ║
║ ├─ Aggiunto QR Code per fidelity      ║
║ ├─ Ridotto spazio header              ║
║ └─ Usato da: 45 dispositivi           ║
║                                       ║
║ v2.0 - 10/01/2024                     ║
║ ├─ Aggiornato logo aziendale          ║
║ ├─ Modificato footer                  ║
║ └─ Usato da: 12 dispositivi (legacy)  ║
║                                       ║
║ v1.0 - 01/01/2024                     ║
║ └─ Versione iniziale                  ║
║                                       ║
║ [Ripristina v2.0] [Confronta Versioni]║
╚═══════════════════════════════════════╝
```

### Esportare/Importare Template

**Export** (per backup o condivisione):
1. **Seleziona template**
2. **Clicca "Esporta"**
3. **Formato**: JSON
4. File: `scontrino_standard_it_v2.1.json`

**Import** (per ripristino o da altri):
1. **Clicca "Importa Template"**
2. **Seleziona file JSON**
3. **Valida template**
4. **Salva** con nuovo nome

### Eliminare Template

1. **Seleziona template**
2. **Clicca "Elimina"**
3. **Conferma**:
   ```
   ⚠️ Eliminare template "Scontrino Standard IT"?

   45 dispositivi lo usano attualmente.

   Cosa fare:
   ● Assegna template alternativo: [Seleziona ▼]
   ○ Rimuovi assegnazione (dispositivi senza template)

   [Annulla] [Elimina]
   ```

---

## Best Practices

### 🎨 Design

- **Mantieni semplice**: Troppe informazioni confondono
- **Leggibilità**: Font min 10pt, contrasto sufficiente
- **Logo dimensioni corrette**: Non troppo grande
- **Allineamenti coerenti**: Centro/sinistra/destra
- **Spaziatura**: Aria tra sezioni

### 📏 Dimensioni

- **58mm**: Standard per POS compatti
- **80mm**: Per info aggiuntive (promozioni, fidelity)
- **Lunghezza**: Minima necessaria (risparmio carta)

### 🔐 Compliance Fiscale

Per scontrini fiscali Italia:
- ✅ Ragione sociale completa
- ✅ Indirizzo completo
- ✅ Partita IVA o Codice Fiscale
- ✅ Numero progressivo ricevuta
- ✅ Data e ora
- ✅ Dettaglio articoli con IVA
- ✅ Totale comparto importi

### 🔄 Manutenzione

- **Testa dopo modifiche**: Stampa reale su carta
- **Versiona correttamente**: Semantic versioning
- **Documenta cambiamenti**: Note versione dettagliate
- **Mantieni template aggiornati**: Logo, info, promozioni

---

## Troubleshooting

### Template Non Stampa Correttamente

**Problema**: Layout rotto o contenuto tagliato

**Soluzioni**:
1. Verifica larghezza carta corretta
2. Controlla margini (non troppo stretti)
3. Riduci dimensioni font se necessario
4. Testa su stampante reale, non solo preview
5. Verifica driver stampante aggiornato

### Variabili Non Sostituite

**Problema**: `{store_name}` appare letteralmente invece del nome

**Soluzioni**:
1. Verifica sintassi: `{variabile}` non `{{variabile}}`
2. Controlla che variabile sia valida (vedi lista disponibili)
3. Assicurati dati siano configurati su dispositivo
4. Forza sync dispositivo

### Barcode Non Leggibile

**Problema**: Scanner non legge barcode stampato

**Soluzioni**:
1. Aumenta dimensioni barcode (min 30mm larghezza)
2. Migliora contrasto (nero su bianco)
3. Verifica tipo barcode corretto per scanner
4. Pulizia testina stampante termica
5. Qualità carta termica sufficiente

### Logo/Immagini Non Appaiono

**Problema**: Immagini non stampate

**Soluzioni**:
1. Verifica formato immagine (PNG, JPG supportati)
2. Dimensioni file < 1MB
3. Risoluzione adeguata (min 150 DPI)
4. Converti in bianco/nero per stampanti termiche
5. Ricarica immagine nel template

---

## FAQ

**Q: Posso usare colori nei template?**
A: Solo se stampante supporta. Stampanti termiche: solo bianco/nero.

**Q: Limite numero template?**
A: Nessun limite tecnico.

**Q: Template funziona su tutte le stampanti?**
A: Sì, sistema adatta automaticamente al modello stampante.

**Q: Posso stampare loghi a colori?**
A: Solo con stampanti inkjet/laser a colori. Termiche: solo bianco/nero.

**Q: Come testo template senza sprecare carta?**
A: Usa "Esporta PDF" per vedere layout prima di stampare.

**Q: Posso condividere template con altri utenti?**
A: Sì, esporta JSON e condividi file. Oppure pubblica su marketplace template.

**Q: Template supporta più lingue?**
A: Sì, usa variabili diverse per lingue diverse, o crea template per lingua.
