# ⚡ Quick Start - Features Dinamiche

## 🎯 Cosa Hai

Un sistema integrato con **2 tab** nello stesso pannello per gestire piani e features!

**URL Unico:** `http://localhost:5176/admin/subscription-plans`

---

## 🚀 Setup in 2 Minuti

### Step 1: Esegui Migration SQL

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor → **New Query**
3. **Copia e incolla questo SQL:**

```sql
-- Plan Feature Overrides Table
CREATE TABLE IF NOT EXISTS plan_feature_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
  feature_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(plan_type, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_plan_feature_overrides_plan ON plan_feature_overrides(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_feature_overrides_enabled ON plan_feature_overrides(plan_type, enabled);
CREATE INDEX IF NOT EXISTS idx_plan_feature_overrides_expires ON plan_feature_overrides(expires_at) WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION update_plan_feature_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_feature_overrides_updated_at
  BEFORE UPDATE ON plan_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_feature_overrides_updated_at();

ALTER TABLE plan_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage plan overrides"
  ON plan_feature_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid()
      AND staff.role = 'super_admin'
    )
  );

CREATE POLICY "Everyone can read plan overrides"
  ON plan_feature_overrides
  FOR SELECT
  USING (true);
```

4. Clicca **Run** ▶️
5. Vedi "Success. No rows returned" = ✅ OK!

### Step 2: Verifica

```sql
SELECT * FROM plan_feature_overrides;
-- Deve tornare 0 rows senza errori
```

### Step 3: Usa il Sistema!

```
http://localhost:5176/admin/subscription-plans
```

Vedrai 2 tab:
- **👥 Piani Organizzazioni** → Cambia piano delle org
- **⚙️ Features Dinamiche** → Override features! 🎉

---

## 💡 Esempi Pratici

### Esempio 1: Aggiungi Marketing a BASIC per promo

1. Vai su `/admin/subscription-plans`
2. Clicca tab **"Features Dinamiche"**
3. Sub-tab **"BASIC"**
4. **"+ Aggiungi Override"**
5. Feature: `marketingCampaigns` (bool: false)
6. Toggle: ✅ **Abilitata**
7. Descrizione: "Promo Black Friday"
8. Scadenza: 30/11/2025
9. **Salva**

Risultato:
- TUTTE le org BASIC hanno Marketing fino al 30/11
- Login come org BASIC → Marketing sbloccato! ✨

---

### Esempio 2: Dai 200 Clienti a BASIC invece di 100

1. Vai su `/admin/subscription-plans`
2. Tab **"Features Dinamiche"** → Sub-tab **"BASIC"**
3. **"+ Aggiungi Override"**
4. Feature: `maxCustomers` (num: 100)
5. **Valore**: `200` ← Inserisci numero!
6. Descrizione: "Promo clienti extra"
7. Scadenza: (vuoto per permanente)
8. **Salva**

Risultato:
- BASIC ora ha limite 200 clienti invece di 100
- Zero modifiche al codice!

---

### Esempio 3: Cambia Tier Limit con valore custom

1. Tab **"Features Dinamiche"** → Piano desiderato
2. **"+ Aggiungi Override"**
3. Feature: `maxTiers` o campo numerico
4. **Valore**: `10` (invece del valore base)
5. **Salva**

Risultato:
- Piano modificato con limite custom!

---

## 📊 Screenshot Atteso

```
┌──────────────────────────────────────────────────┐
│  👑 Gestione Piani e Features                    │
│                                                   │
│  [👥 Piani Org]  [⚙️ Features Dinamiche]  ← TAB │
│  ─────────────                                    │
│                                                   │
│  (Quando selezioni Features Dinamiche)           │
│                                                   │
│  [FREE] [BASIC] [PRO] [ENTERPRISE] ← Sub-tabs    │
│                                                   │
│  [+ Aggiungi Override per BASIC]                 │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Feature │ Base │ Override │ Desc │ ...     │ │
│  ├─────────────────────────────────────────────┤ │
│  │ rewards │ ✅   │ -        │ -    │ -       │ │
│  │ coupon  │ ❌   │ ✅       │ Promo│ [🗑]    │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## ✅ Fatto!

Dopo la migration SQL il sistema è **100% funzionante**!

## 🎯 Cosa Puoi Fare Ora

### ✅ Override Boolean (On/Off)
```
marketingCampaigns: false → true
rewards: true → false
```

### 🔢 Override Numerici (Limiti Custom)
```
maxCustomers: 50 → 200
maxWorkflows: 1 → 10
maxNotifications: 100 → 5000
```

### 📝 Override Testuali (Configurazioni)
```
tierLevel: "basic" → "premium"
customConfig: "" → "special_mode"
```

**Use Cases:**
- ✅ Promozioni temporanee con scadenza
- ✅ Limiti personalizzati per clienti VIP
- ✅ Beta test features con utenti FREE
- ✅ Upgrade graduali senza cambiare piano
- ✅ Configurazioni custom per eventi

**Server attivo:** `http://localhost:5176/`

---

**Il sistema rileva automaticamente il tipo!**
- Feature boolean → Mostra toggle switch
- Feature numerica → Mostra input numero
- Feature testuale → Mostra input testo

**Hai domande o vuoi testare subito?** 🚀
