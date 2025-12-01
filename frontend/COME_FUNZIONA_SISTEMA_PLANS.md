# 🎯 Come Funziona il Sistema di Gestione Plans

## 📊 Flusso Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1. ADMIN crea/modifica piani in AdminPlansManager          │
│     - Imposta features (emailMarketing: true/false)         │
│     - Imposta limiti (maxEmailsPerMonth: 10000)             │
│     - Salva in database omnilypro_plans                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. WIZARD mostra piani disponibili                         │
│     - EnterpriseWizard carica piani da database             │
│     - Business owner seleziona un piano                     │
│     - Wizard salva plan_id nell'organizations table         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. RUNTIME controlla features                              │
│     - usePlanFeatures() legge plan_id dall'organization     │
│     - Carica features dal piano in omnilypro_plans          │
│     - FeatureGate blocca/mostra componenti                  │
│     - LimitGate controlla limiti numerici                   │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Struttura Database

### Tabella: `omnilypro_plans`
```sql
CREATE TABLE omnilypro_plans (
  id UUID PRIMARY KEY,
  name TEXT,                    -- "Professional"
  slug TEXT UNIQUE,             -- "professional"
  price_monthly NUMERIC,        -- 99
  features JSONB,               -- {"emailMarketing": true, ...}
  limits JSONB,                 -- {"maxEmailsPerMonth": 10000, ...}
  is_active BOOLEAN,
  ...
);
```

**Esempio record:**
```json
{
  "id": "uuid-professional",
  "name": "Professional",
  "slug": "professional",
  "price_monthly": 99,
  "features": {
    "emailMarketing": true,
    "smsMarketing": true,
    "posEnabled": true,
    "advancedAnalytics": true
  },
  "limits": {
    "maxEmailsPerMonth": 10000,
    "maxSMSPerMonth": 5000,
    "maxCustomers": 5000
  }
}
```

### Tabella: `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  plan_id UUID REFERENCES omnilypro_plans(id),  -- Link al piano
  plan_type TEXT,  -- Deprecato, mantenuto per compatibilità
  ...
);
```

**Esempio record:**
```json
{
  "id": "uuid-pizzeria-mario",
  "name": "Pizzeria Da Mario",
  "plan_id": "uuid-professional",  // ← Questo è il link!
  "plan_type": "professional"      // Deprecato
}
```

## 🔧 Come Usare il Sistema

### STEP 1: Popolare i Piani (ADMIN)

**Opzione A: Via SQL (Migrazione)**
```bash
# Esegui la migrazione seed
cd /Users/pasqualelucci/omnilypro-clean
npx supabase db push
```

**Opzione B: Via AdminPlansManager UI**
1. Vai su `/admin/subscriptions`
2. Clicca "+ Nuovo Abbonamento"
3. Compila i campi:
   - Nome: "Professional"
   - Prezzo mensile: 99
   - Features: ✅ Email Marketing, ✅ SMS Marketing
   - Limiti: Max Email/Mese = 10000
4. Salva

### STEP 2: Assegnare Piano a Organizzazione

**Quando crei una nuova organizzazione nel wizard:**
```typescript
// EnterpriseWizard.tsx (già fatto!)
<select onChange={(e) => setFormData({...formData, planId: e.target.value})}>
  {availablePlans.map(plan => (
    <option value={plan.id}>{plan.name} - €{plan.price_monthly}/mese</option>
  ))}
</select>
```

Il wizard salva automaticamente `plan_id` quando crei l'organizzazione.

### STEP 3: Proteggere Funzionalità

**Esempio: Proteggere Email Marketing**

```typescript
// src/components/EmailMarketingHub.tsx
import { FeatureWithLimitGate } from './FeatureWithLimitGate'

export default function EmailMarketingHub() {
  const [emailsSentThisMonth, setEmailsSentThisMonth] = useState(0)

  // Carica usage dal database
  useEffect(() => {
    // Query email_logs per contare email inviate questo mese
    loadEmailUsage().then(count => setEmailsSentThisMonth(count))
  }, [])

  return (
    <FeatureWithLimitGate
      feature="emailMarketing"
      currentUsage={{ maxEmailsPerMonth: emailsSentThisMonth }}
    >
      {/* Se emailMarketing=false nel piano → mostra upgrade prompt */}
      {/* Se emailsSentThisMonth >= maxEmailsPerMonth → mostra limite raggiunto */}
      {/* Altrimenti → mostra interfaccia email marketing */}
      <EmailMarketingInterface />
    </FeatureWithLimitGate>
  )
}
```

## 🎨 Cosa Vede l'Utente

### Scenario 1: Feature NON disponibile nel piano

```
┌─────────────────────────────────────────────────┐
│  🔒 Email Marketing Professionale               │
│                                                 │
│  Raggiungi i tuoi clienti con campagne email   │
│  professionali                                  │
│                                                 │
│  COSA INCLUDE:                                  │
│  ✓ Campagne illimitate                         │
│  ✓ Segmentazione avanzata                      │
│  ✓ A/B testing                                  │
│  ✓ Analytics dettagliate                        │
│                                                 │
│  LIMITI DISPONIBILI:                            │
│  • 10000 email al mese                          │
│                                                 │
│  Piano attuale: Basic - €29/mese               │
│                                                 │
│  [Effettua l'Upgrade Ora]                      │
└─────────────────────────────────────────────────┘
```

### Scenario 2: Limite RAGGIUNTO

```
┌─────────────────────────────────────────────────┐
│  ⚠️ Limite Raggiunto                            │
│                                                 │
│  Hai raggiunto il limite di 10000 per il       │
│  piano Professional.                            │
│                                                 │
│  [Upgrade Piano]                                │
└─────────────────────────────────────────────────┘
```

### Scenario 3: Warning AVVICINAMENTO limite (80%)

```
┌─────────────────────────────────────────────────┐
│  ⚠️ Attenzione: stai raggiungendo il limite     │
│  (8500/10000). Considera un upgrade.            │
└─────────────────────────────────────────────────┘
```

## 🧪 Come Testare

### Test 1: Creare un Piano
```bash
1. Vai su http://localhost:5173/admin/subscriptions
2. Clicca "+ Nuovo Abbonamento"
3. Crea piano "Starter" con:
   - Email Marketing: ❌ NO
   - Max Clienti: 100
4. Salva
```

### Test 2: Assegnare Piano a Org
```bash
1. Crea nuova organizzazione nel wizard
2. Seleziona "Starter"
3. Completa wizard
4. Organizzazione avrà plan_id = uuid-starter
```

### Test 3: Verificare Blocco Feature
```bash
1. Login come user di organizzazione "Starter"
2. Vai su Email Marketing
3. Dovresti vedere upgrade prompt (emailMarketing=false)
```

### Test 4: Verificare Limite
```bash
1. Login come user di organizzazione con Professional
2. Invia 10000 email
3. Prova a inviare 10001-esima email
4. Dovresti vedere "Limite Raggiunto"
```

## 🔍 Debugging

### Verifica piano assegnato
```sql
SELECT
  o.name as org_name,
  p.name as plan_name,
  p.features,
  p.limits
FROM organizations o
JOIN omnilypro_plans p ON o.plan_id = p.id
WHERE o.id = 'uuid-tua-org';
```

### Verifica piani disponibili
```sql
SELECT
  name,
  slug,
  features->>'emailMarketing' as has_email,
  limits->>'maxEmailsPerMonth' as email_limit
FROM omnilypro_plans
WHERE is_active = true;
```

### Console Browser
```javascript
// Nel browser, apri console e esegui:
const { data } = await supabase
  .from('omnilypro_plans')
  .select('*')

console.log('Piani disponibili:', data)
```

## 📝 Riepilogo

**Per far funzionare il sistema:**

1. ✅ **Popola piani** - Esegui migrazione seed oppure usa AdminPlansManager
2. ✅ **Assegna piano** - Nel wizard quando crei organizzazione
3. ✅ **Proteggi features** - Usa `<FeatureGate>` o `<FeatureWithLimitGate>`
4. ✅ **Monitora usage** - Traccia metriche (email inviate, SMS, etc.)

**Il sistema è già pronto!** Devi solo:
1. Eseguire la migrazione seed per creare i 3 piani iniziali
2. Le nuove organizzazioni potranno selezionare un piano
3. Le features saranno automaticamente controllate
