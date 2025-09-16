# Integrazione POS ZCS - OMNILY PRO

## Overview

OMNILY PRO include un'integrazione completa con i terminali POS ZCS per gestire transazioni loyalty, lettori NFC, stampa ricevute e pagamenti EMV.

## Modelli Supportati

### Smart POS Android
- **Z108** - Android POS (Consigliato) - 2.3GHz Octa-core, 4GB RAM, Android 14.0
- **Z100** - Smart POS completo
- **Z92** - Smart POS con display cliente
- **Z91** - Smart POS standard
- **Z90** - Smart POS base

### MPOS e Lettori
- **Z70** - MPOS Bluetooth portatile
- **Z45** - Card Reader USB all-in-one

## Funzionalità Implementate

### 1. Lettura NFC/Contactless
- Lettura tessere loyalty contactless
- Supporto ISO/IEC 14443 A&B + Mifare
- UID card e dati personalizzati
- Timeout configurabile

### 2. Stampa Ricevute
- Stampa automatica ricevute loyalty
- QR code per app mobile
- Logo aziendale personalizzato
- Formattazione professionale

### 3. Transazioni EMV
- Chip & PIN sicuro
- Autorizzazione online/offline  
- Certificazioni PCI DSS
- Crittografia avanzata

### 4. PinPad Sicuro
- Crittografia PIN DUKPT
- MAC generation
- Chiavi master/work separate
- Hardware security module

## Implementazione Tecnica

### Struttura SDK Service

```typescript
// Inizializzazione
const result = await zcsSDK.initializeSDK('Z108', 'usb')

// Lettura NFC
const cardData = await zcsSDK.readNFCCard(timeout)

// Stampa ricevuta  
await zcsSDK.printLoyaltyReceipt({
  merchantName: 'OMNILY PRO',
  customerName: 'Mario Rossi', 
  pointsEarned: 50,
  totalPoints: 1250,
  qrCode: 'https://app.omnily.pro/loyalty/abc123'
})

// Test hardware
const results = await zcsSDK.testHardware()
```

### Configurazione Android WebView

Per l'integrazione in app React/WebView:

```javascript
// Bridge verso SDK nativo Android
window.ZCSDriver = {
  getInstance: () => ({ /* native bridge */ }),
  getCardReadManager: () => ({ /* card operations */ }),
  getPrinter: () => ({ /* print operations */ })
}
```

## Setup Wizard Integration

Il wizard OMNILY PRO include:

1. **Selezione Modello POS**
   - Dropdown con tutti i modelli supportati
   - Specifiche hardware dettagliate
   - Consigli per settore business

2. **Configurazione Connessione**
   - USB per modelli integrati
   - Bluetooth per MPOS Z70
   - Test automatico connessione

3. **Attivazione Funzioni**
   - Toggle per ogni funzionalità
   - Stampa ricevute con QR code
   - Lettore NFC per tessere
   - EMV per pagamenti sicuri
   - PinPad crittografato

4. **Test Hardware Live**
   - Connessione POS real-time
   - Test LED, beeper, stampa
   - Lettura carte demo
   - Console log dettagliata

## Flusso Transazione Loyalty

### 1. Cliente Presenta Tessera
```
Cliente avvicina tessera NFC → 
Lettura automatica UID →
Lookup cliente nel database →
Calcolo punti transazione
```

### 2. Aggiornamento Punti
```
Punti guadagnati calcolati →
Database aggiornato →  
Stampa ricevuta con saldo →
QR code per app mobile
```

### 3. Riscatto Rewards
```
Selezione reward da catalogo →
Verifica punti sufficienti →
Detrazione punti →
Ricevuta di riscatto
```

## Sicurezza e Compliance

### Crittografia
- **PIN**: Crittografia DUKPT con hardware security
- **Comunicazioni**: TLS 1.3 per tutti i dati
- **Storage**: Dati sensibili encrypted at rest
- **Chiavi**: Gestione sicura chiavi master/work

### Conformità
- **PCI DSS**: Livello 1 per pagamenti carta
- **EMV**: Certificazione Europea/Visa/Mastercard
- **GDPR**: Privacy by design per dati clienti
- **ISO 27001**: Security management system

## Troubleshooting

### Problemi Comuni

**POS non si connette via USB**
```bash
# Verificare permessi USB Android
adb shell pm grant com.omnily.app android.permission.USB_PERMISSION
```

**Bluetooth Z70 non trovato**
```bash  
# Reset pairing e ricerca
BluetoothAdapter.getDefaultAdapter().cancelDiscovery()
BluetoothAdapter.getDefaultAdapter().startDiscovery()
```

**Stampa fallisce**
```bash
# Controllo stato carta
int status = printer.getPrinterStatus()
if (status == SDK_PRN_STATUS_PAPEROUT) {
  // Sostituire carta
}
```

### Log Debug

Abilita logging dettagliato:
```javascript
window.ZCSDriver.setDebugMode(true)
```

## Performance e Scaling

### Ottimizzazioni
- **Connection Pool**: Riuso connessioni POS
- **Batch Operations**: Stampa multipla code
- **Caching**: Cache dati cliente frequenti
- **Async Operations**: Non blocking UI

### Monitoraggio
- **Uptime POS**: >99.9% availability target
- **Response Time**: <200ms per lettura NFC
- **Print Speed**: <3 secondi per ricevuta
- **Error Rate**: <0.1% transazioni

## Roadmap Future

### Q1 2025
- [ ] Supporto Apple Pay/Google Pay NFC
- [ ] Integrazione bilancia elettronica
- [ ] Scanner QR code prodotti
- [ ] Display cliente personalizzato

### Q2 2025  
- [ ] Multi-POS per negozi grandi
- [ ] Sincronizzazione offline/online
- [ ] Analytics real-time POS
- [ ] API webhooks transazioni

### Q3 2025
- [ ] Supporto crypto payments
- [ ] Loyalty gamification su display
- [ ] Voice commands per accessibility
- [ ] Machine learning fraud detection

## Supporto

**Documentazione ZCS**: [SDK Guide v1.2](./zcs_pos_guide_en.pdf)
**Omnily Support**: support@omnily.pro
**Emergency**: +39 800 123 456 (24/7)

---

*Ultima modifica: 5 Settembre 2024*
*Versione SDK: ZCS Android Platform v1.2*
*Versione OMNILY PRO: 1.0.0*