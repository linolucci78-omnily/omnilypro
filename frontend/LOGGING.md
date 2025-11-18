# 📝 Sistema di Logging OmnilyPro

## Come funziona

Abbiamo un sistema di logging intelligente che si comporta diversamente in sviluppo e produzione.

### 🔧 In Sviluppo (localhost)
```typescript
import { logger } from '@/utils/logger'

logger.log('Messaggio normale')      // ✅ Visibile
logger.info('Info')                   // ✅ Visibile
logger.warn('Warning')                // ✅ Visibile
logger.error('Errore!')               // ✅ Visibile
logger.debug('Debug dettagliato')     // ✅ Visibile
```

Tutti i log sono visibili per facilitare il debugging durante lo sviluppo.

### 🚀 In Produzione (Vercel)
```typescript
import { logger } from '@/utils/logger'

logger.log('Messaggio normale')      // ❌ Nascosto (a meno che debug attivo)
logger.info('Info')                   // ❌ Nascosto (a meno che debug attivo)
logger.warn('Warning')                // ✅ Visibile (importante)
logger.error('Errore!')               // ✅ Visibile (critico!)
logger.debug('Debug dettagliato')     // ❌ Nascosto (a meno che debug attivo)
```

Solo warning ed errori sono visibili per mantenere la console pulita per i clienti.

## 🔍 Attivare Debug Mode in Produzione

⚠️ **PROTETTO DA PASSWORD** - Solo team OmnilyPro può attivare debug mode!

Se devi debuggare un problema in produzione:

### Opzione 1: Da Console Browser (PROTETTA)
```javascript
// Apri la console del browser (F12)
enableDebug("omnily2025debug")  // ⚠️ PASSWORD RICHIESTA!
// Ricarica la pagina
location.reload()
// Ora vedi TUTTI i log!
```

### Opzione 2: Da localStorage (bypass - solo per emergenze)
```javascript
localStorage.setItem('OMNILY_DEBUG', 'true')
location.reload()
```

### Disattivare Debug Mode
```javascript
disableDebug()
location.reload()
```

### 🔐 Sicurezza
- ✅ Password richiesta per `enableDebug()`
- ✅ Impedisce ai clienti di vedere log interni
- ✅ Solo team OmnilyPro conosce la password
- ⚠️ **NON condividere la password con clienti!**

## 📦 Migrazione da console.log

### Prima (vecchio modo)
```typescript
console.log('Loading customer data...')
console.error('Failed to load customer:', error)
```

### Dopo (nuovo modo)
```typescript
import { logger } from '@/utils/logger'

logger.log('Loading customer data...')
logger.error('Failed to load customer:', error)
```

## 🎯 Best Practices

### ✅ Cosa fare
```typescript
// Usa logger.log per debug generale
logger.log('🔍 DEBUG: Customer points:', customer.points)

// Usa logger.error per errori critici
logger.error('❌ Failed to save transaction:', error)

// Usa logger.warn per situazioni anomale ma non bloccanti
logger.warn('⚠️ Customer has negative points:', customer.id)

// Usa emoji per distinguere facilmente i log
logger.log('✅ Transaction completed successfully')
logger.log('📧 Sending email to:', email)
logger.log('💰 Payment processed:', amount)
```

### ❌ Cosa NON fare
```typescript
// ❌ NON usare console.log direttamente
console.log('Customer data:', data)

// ❌ NON loggare dati sensibili anche con logger
logger.log('Password:', password) // MAI!
logger.log('Credit card:', cardNumber) // MAI!

// ❌ NON usare logger.error per cose non critiche
logger.error('User clicked button') // Usa logger.log
```

## 🔐 Sicurezza

- ⚠️ **MAI** loggare password, token, o dati sensibili
- ⚠️ **MAI** loggare informazioni PII (email, telefoni, etc.) in produzione
- ✅ Usa logger.debug per dati sensibili (visibile solo con debug attivo)

## 🚀 Integrazione Future

Il logger è pronto per integrazioni future con servizi di error tracking:

```typescript
// TODO: Integrare Sentry
logger.error('Payment failed', error)
// → Automaticamente inviato a Sentry in produzione
```

## 📊 Esempio Completo

```typescript
import { logger } from '@/utils/logger'

async function processTransaction(customerId: string, amount: number) {
  logger.log('💰 Processing transaction...', { customerId, amount })

  try {
    const customer = await getCustomer(customerId)
    logger.debug('Customer data:', customer)

    if (customer.points < 0) {
      logger.warn('⚠️ Customer has negative points:', customer.points)
    }

    const result = await saveTransaction(amount)
    logger.log('✅ Transaction saved:', result.id)

    return result
  } catch (error) {
    logger.error('❌ Transaction failed:', error)
    throw error
  }
}
```

## 🎓 Quiz Rapido

**Quando usi logger.log?**
- Debug generale, info non critiche

**Quando usi logger.warn?**
- Situazioni anomale ma non bloccanti

**Quando usi logger.error?**
- Errori critici, exception, fallimenti

**Come attivi debug in produzione?**
- `enableDebug()` nella console, poi reload

---

**Migrare gradualmente da console.log a logger!** 🎯
