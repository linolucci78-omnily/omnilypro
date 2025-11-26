# OMNY Wallet - Guida Attivazione

## 📦 Cosa è Stato Creato

### 1. Feature Flags
- `frontend/src/config/features.ts` - Sistema di controllo features
- `.env.example` - Template configurazione (OMNY disabilitato di default)

### 2. Servizi Backend (Web3)
- `frontend/src/services/web3Service.ts` - Connessione MetaMask & Polygon
- `frontend/src/services/omnyService.ts` - Interazione smart contract OMNY

### 3. React Hooks
- `frontend/src/hooks/useWeb3.ts` - Gestione stato wallet
- `frontend/src/hooks/useOmnyBalance.ts` - Fetch saldo token

### 4. Componenti UI
- `frontend/src/components/OmnyWallet/OmnyWalletHub.tsx` - Dashboard principale
- `frontend/src/components/OmnyWallet/ConnectMetaMask.tsx` - Bottone connessione
- `frontend/src/components/OmnyWallet/OmnyBalance.tsx` - Display saldo
- + Tutti i relativi file CSS

---

## 🎯 Stato Attuale

**STANDBY MODE** ✅ 
- Feature flags = `false` (disabilitato)
- Codice presente e pronto
- Non visibile agli utenti
- Wallet Fiat esistente non impattato

---

## 🚀 Come Attivare OMNY Wallet

### Step 1: Configurare Environment
Crea file `.env` nella cartella `frontend/`:

```bash
# Abilita OMNY Wallet
VITE_ENABLE_OMNY_WALLET=true

# Polygon Configuration
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_POLYGON_CHAIN_ID=137

# OMNY Contract
VITE_OMNY_CONTRACT_ADDRESS=0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4
```

### Step 2: Aggiungere Rotta nel Router
In `src/App.tsx` o `src/routes.tsx`:

```tsx
import OmnyWalletHub from './components/OmnyWallet/OmnyWalletHub'
import { FEATURES } from './config/features'

// Nel routing
{FEATURES.OMNY_WALLET && (
  <Route path="/omny-wallet" element={
    <OmnyWalletHub 
      organizationId={currentOrg.id}
      primaryColor={currentOrg.primary_color}
      secondaryColor={currentOrg.secondary_color}
    />
  } />
)}
```

### Step 3: Aggiungere Link nella Navigazione
Nel menu admin (es. `AdminLayout.tsx`):

```tsx
{FEATURES.OMNY_WALLET && (
  <NavLink to="/omny-wallet">
    🪙 OMNY Wallet
  </NavLink>
)}
```

### Step 4: Installare Dipendenze
```bash
cd frontend
npm install ethers
```

### Step 5: Restart Dev Server
```bash
npm run dev
```

---

## 📊 Database Migration (Quando attivo)

Quando abiliti OMNY per la prima volta, esegui questa migration in Supabase:

```sql
-- Extend customers table
ALTER TABLE customers 
ADD COLUMN omny_wallet_address VARCHAR(42),
ADD COLUMN omny_balance_cache DECIMAL(18,2) DEFAULT 0;

CREATE INDEX idx_customers_omny_wallet ON customers(omny_wallet_address);

-- Create transactions table
CREATE TABLE omny_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  organization_id UUID REFERENCES organizations(id),
  type VARCHAR(20) NOT NULL,
  omny_amount DECIMAL(18,2) NOT NULL,
  euro_equivalent DECIMAL(10,2),
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

CREATE INDEX idx_omny_tx_customer ON omny_transactions(customer_id);
CREATE INDEX idx_omny_tx_org ON omny_transactions(organization_id);
```

---

## 🧪 Testing

### Test Locale (Senza Blockchain)
1. Copia il codice in un branch separato
2. Abilita `VITE_ENABLE_OMNY_WALLET=true`
3. Testa UI senza connettere MetaMask

### Test con MetaMask (Polygon Testnet)
1. Switch a Polygon Mumbai (testnet)
2. Ottieni MATIC test da faucet
3. Deploy OMNY di test
4. Connetti MetaMask e testa flusso completo

### Test Produzione
1. Verifica contratto su Polygon Mainnet
2. Testa con piccolo importo OMNY
3. Attiva gradualmente (beta users first)

---

## 🔐 Sicurezza

- ✅ Nessuna chiave privata nel frontend
- ✅ Solo lettura saldo (no transfers diretti)
- ✅ Future operazioni mint/burn via Edge Functions autorizzate
- ✅ Feature flags per controllo accesso

---

## 📁 File Creati (Summary)

```
frontend/
├── .env.example (NEW)
├── src/
│   ├── config/
│   │   └── features.ts (NEW)
│   ├── services/
│   │   ├── web3Service.ts (NEW)
│   │   └── omnyService.ts (NEW)
│   ├── hooks/
│   │   ├── useWeb3.ts (NEW)
│   │   └── useOmnyBalance.ts (NEW)
│   └── components/
│       └── OmnyWallet/
│           ├── OmnyWalletHub.tsx (NEW)
│           ├── OmnyWalletHub.css (NEW)
│           ├── Connect MetaMask.tsx (NEW)
│           ├── ConnectMetaMask.css (NEW)
│           ├── OmnyBalance.tsx (NEW)
│           └── OmnyBalance.css (NEW)
```

**Totale:** 12 nuovi file creati ✅

---

## ✅ Checklist Pre-Attivazione

- [ ] Database migration completata
- [ ] `.env` configurato correttamente
- [ ] Dipendenza `ethers` installata
- [ ] Rotte aggiunte al router
- [ ] Link menu aggiunto
- [ ] Test su testnet completati
- [ ] MetaMask installato e configurato
- [ ] Documentazione letta dal team

---

## 💡 Prossimi Step (Future)

1. **Edge Functions Backend:**
   - `mint-omny-rewards` per dare premi
   - `burn-omny-discount` per sconti
   
2. **Admin Panels:**
   - `EarnOmnyPanel.tsx` per assegnare premi
   - `SpendOmnyPanel.tsx` per applicare sconti

3. **Analytics:**
   - Dashboard OMNY statistics
   - Tracking earn/spend per organization

Tutto pronto per il lancio! 🎉
