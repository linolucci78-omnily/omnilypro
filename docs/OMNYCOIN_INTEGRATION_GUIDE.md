# 🪙 OmnyCoin Integration Guide - OmnilyPro

**Data:** 25 Novembre 2024  
**Obiettivo:** Integrare OmnyCoin (ERC-20 token su Polygon) in OmnilyPro  
**Tempo Stimato:** 4-6 ore sviluppo

---

## 📊 Informazioni OmnyCoin

- **Nome:** OmnyCoin
- **Simbolo:** OMNY
- **Blockchain:** Polygon Mainnet
- **Contratto:** `0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4`
- **Decimals:** 18
- **Supply Totale:** 1,000,000 OMNY
- **Verifica:** https://polygonscan.com/address/0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4

---

## 🏢 Architettura Multi-Tenant

### Gestione Wallet per Organizzazioni

OmnilyPro è un SaaS multi-tenant. Ogni organizzazione (negozio) ha il proprio wallet per gestire OMNY.

#### Livelli di Wallet

1. **Super Admin Wallet** (Lino - Proprietario OmnilyPro)
   - Controlla la riserva OMNY (es. 900,000 OMNY)
   - Vende OMNY alle organizzazioni
   - Monitora supply globale

2. **Organization Wallet** (Ogni Negozio)
   - Compra OMNY dal Super Admin
   - Regala OMNY ai clienti (reward)
   - Riceve OMNY dai clienti (redemption)

3. **Customer Wallet** (Clienti Finali)
   - Riceve OMNY da qualsiasi organizzazione
   - Spende OMNY in qualsiasi organizzazione
   - Vede saldo totale cross-organization

#### Database Schema

```sql
-- Aggiungi colonna wallet a organizations
ALTER TABLE organizations 
ADD COLUMN wallet_address VARCHAR(42),
ADD COLUMN omny_balance DECIMAL(18,2) DEFAULT 0,
ADD COLUMN omny_purchased DECIMAL(18,2) DEFAULT 0,
ADD COLUMN omny_distributed DECIMAL(18,2) DEFAULT 0,
ADD COLUMN omny_received DECIMAL(18,2) DEFAULT 0;

-- Tabella transazioni OMNY
CREATE TABLE omny_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  type VARCHAR(20), -- 'reward', 'redemption', 'purchase'
  amount DECIMAL(18,2),
  tx_hash VARCHAR(66), -- Blockchain transaction hash
  from_wallet VARCHAR(42),
  to_wallet VARCHAR(42),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_omny_tx_org ON omny_transactions(org_id);
CREATE INDEX idx_omny_tx_customer ON omny_transactions(customer_id);
```

#### Flusso Operativo

**1. Setup Organizzazione (Una Volta)**
```typescript
// Admin crea wallet per nuova organizzazione
const createOrgWallet = async (orgId: string) => {
  // Genera nuovo wallet
  const wallet = ethers.Wallet.createRandom();
  
  // Salva in Supabase (ENCRYPTED!)
  await supabase
    .from('organizations')
    .update({
      wallet_address: wallet.address,
      // IMPORTANTE: Salva private key ENCRYPTED in vault separato
    })
    .eq('id', orgId);
    
  return wallet.address;
};
```

**2. Organizzazione Compra OMNY (Periodico)**
```typescript
// Super Admin vende 10,000 OMNY a Bar Mario
const sellOMNYToOrg = async (orgId: string, amount: number) => {
  const org = await getOrganization(orgId);
  
  // Transfer da Super Admin wallet a Organization wallet
  const tx = await superAdminWallet.sendOMNY(
    org.wallet_address, 
    amount
  );
  
  // Aggiorna database
  await supabase
    .from('organizations')
    .update({
      omny_balance: org.omny_balance + amount,
      omny_purchased: org.omny_purchased + amount
    })
    .eq('id', orgId);
    
  // Registra transazione
  await supabase.from('omny_transactions').insert({
    org_id: orgId,
    type: 'purchase',
    amount,
    tx_hash: tx.hash,
    from_wallet: SUPER_ADMIN_WALLET,
    to_wallet: org.wallet_address
  });
};
```

**3. Cliente Guadagna OMNY (Ogni Vendita)**
```typescript
// Cliente compra caffè da Bar Mario
const rewardCustomer = async (
  orgId: string, 
  customerId: string, 
  amountEuros: number
) => {
  const org = await getOrganization(orgId);
  const customer = await getCustomer(customerId);
  
  const omnyAmount = amountEuros; // 1 EUR = 1 OMNY
  
  // Verifica che organizzazione abbia abbastanza OMNY
  if (org.omny_balance < omnyAmount) {
    throw new Error('Organizzazione senza OMNY! Deve comprarne altri.');
  }
  
  // Transfer da Organization wallet a Customer wallet
  const tx = await orgWallet.sendOMNY(
    customer.wallet_address,
    omnyAmount
  );
  
  // Aggiorna database
  await supabase
    .from('organizations')
    .update({
      omny_balance: org.omny_balance - omnyAmount,
      omny_distributed: org.omny_distributed + omnyAmount
    })
    .eq('id', orgId);
    
  await supabase.from('omny_transactions').insert({
    org_id: orgId,
    customer_id: customerId,
    type: 'reward',
    amount: omnyAmount,
    tx_hash: tx.hash,
    from_wallet: org.wallet_address,
    to_wallet: customer.wallet_address
  });
};
```

**4. Cliente Spende OMNY (Redemption)**
```typescript
// Cliente usa 50 OMNY per sconto da Parrucchiere Bella
const redeemOMNY = async (
  orgId: string,
  customerId: string,
  omnyAmount: number
) => {
  const org = await getOrganization(orgId);
  const customer = await getCustomer(customerId);
  
  // Transfer da Customer wallet a Organization wallet
  const tx = await customerWallet.sendOMNY(
    org.wallet_address,
    omnyAmount
  );
  
  // Aggiorna database
  await supabase
    .from('organizations')
    .update({
      omny_balance: org.omny_balance + omnyAmount,
      omny_received: org.omny_received + omnyAmount
    })
    .eq('id', orgId);
    
  await supabase.from('omny_transactions').insert({
    org_id: orgId,
    customer_id: customerId,
    type: 'redemption',
    amount: omnyAmount,
    tx_hash: tx.hash,
    from_wallet: customer.wallet_address,
    to_wallet: org.wallet_address
  });
  
  // Calcola sconto (es. 10 OMNY = 1 EUR)
  const discountEuros = omnyAmount / 10;
  return discountEuros;
};
```

#### Dashboard Organizzazione

```typescript
// src/components/Organization/OMNYDashboard.tsx
const OMNYDashboard = () => {
  const { currentOrg } = useTenant();
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <h3>Saldo OMNY</h3>
        <p className="text-3xl">{currentOrg.omny_balance.toLocaleString()}</p>
        <button onClick={buyMoreOMNY}>Compra Altri OMNY</button>
      </Card>
      
      <Card>
        <h3>OMNY Distribuiti</h3>
        <p className="text-3xl">{currentOrg.omny_distributed.toLocaleString()}</p>
        <p className="text-sm">Regalati ai clienti</p>
      </Card>
      
      <Card>
        <h3>OMNY Ricevuti</h3>
        <p className="text-3xl">{currentOrg.omny_received.toLocaleString()}</p>
        <p className="text-sm">Spesi dai clienti</p>
      </Card>
    </div>
  );
};
```

#### Sicurezza Multi-Tenant

**CRITICO:** Ogni organizzazione NON deve vedere/accedere ai wallet di altre organizzazioni.

```typescript
// Row Level Security (RLS) Supabase
CREATE POLICY "Organizations can only see their own OMNY transactions"
ON omny_transactions
FOR SELECT
USING (
  org_id IN (
    SELECT id FROM organizations 
    WHERE id IN (
      SELECT org_id FROM organization_users 
      WHERE user_id = auth.uid()
    )
  )
);
```

---

## 🎯 Funzionalità da Implementare

### 1. Connessione Wallet MetaMask
- Bottone "Connetti Wallet" in dashboard cliente
- Salva indirizzo wallet nel profilo cliente (Supabase)
- Mostra stato connessione (connesso/disconnesso)

### 2. Visualizzazione Saldo OMNY
- Mostra saldo OMNY del cliente in tempo reale
- Widget "Il tuo saldo: XXX OMNY"
- Aggiornamento automatico dopo ogni transazione

### 3. Guadagna OMNY su Acquisto
- Quando cliente compra (POS o online), regala OMNY automaticamente
- Formula: 1 euro speso = 1 OMNY guadagnato (configurabile)
- Transazione automatica da wallet organizzazione a wallet cliente

### 4. Spendi OMNY per Sconto
- Cliente può spendere OMNY per ottenere sconto
- Formula: 10 OMNY = 1 euro di sconto (configurabile)
- Transazione da wallet cliente a wallet organizzazione

---

## 🛠️ Stack Tecnico

### Frontend
- **React** (già presente)
- **ethers.js** v6 (per interazione blockchain)
- **MetaMask SDK** (opzionale, per UX migliore)

### Backend
- **Supabase** (già presente)
- **Node.js** (per transazioni server-side opzionali)

### Blockchain
- **Polygon Mainnet**
- **RPC URL:** `https://polygon-rpc.com/`
- **Chain ID:** 137

---

## 📦 Step 1: Installazione Dipendenze

```bash
cd /Users/pasqualelucci/omnilypro-clean/frontend
npm install ethers@6
```

---

## 🔧 Step 2: Configurazione Ambiente

Aggiungi al file `.env`:

```env
# OmnyCoin Configuration
VITE_OMNYCOIN_CONTRACT=0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4
VITE_POLYGON_RPC=https://polygon-rpc.com/
VITE_POLYGON_CHAIN_ID=137
```

---

## 💻 Step 3: Codice da Implementare

### 3.1 Context per Wallet (src/contexts/WalletContext.tsx)

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  account: string | null;
  balance: string;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sendOMNY: (to: string, amount: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const OMNYCOIN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask non installato! Scaricalo da metamask.io');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      // Verifica che sia Polygon
      if (network.chainId !== 137n) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }], // 137 in hex
        });
      }

      setAccount(accounts[0]);
      setProvider(provider);
      await updateBalance(accounts[0], provider);
    } catch (error) {
      console.error('Errore connessione wallet:', error);
    }
  };

  const updateBalance = async (address: string, prov: ethers.BrowserProvider) => {
    const contract = new ethers.Contract(
      import.meta.env.VITE_OMNYCOIN_CONTRACT,
      OMNYCOIN_ABI,
      prov
    );
    const bal = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    setBalance(ethers.formatUnits(bal, decimals));
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
    setProvider(null);
  };

  const sendOMNY = async (to: string, amount: string) => {
    if (!provider || !account) throw new Error('Wallet non connesso');

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      import.meta.env.VITE_OMNYCOIN_CONTRACT,
      OMNYCOIN_ABI,
      signer
    );

    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.transfer(to, amountWei);
    await tx.wait();
    
    await updateBalance(account, provider);
  };

  useEffect(() => {
    if (account && provider) {
      const interval = setInterval(() => updateBalance(account, provider), 10000);
      return () => clearInterval(interval);
    }
  }, [account, provider]);

  return (
    <WalletContext.Provider value={{
      account,
      balance,
      isConnected: !!account,
      connectWallet,
      disconnectWallet,
      sendOMNY
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
```

### 3.2 Componente Wallet Widget (src/components/WalletWidget.tsx)

```typescript
import { useWallet } from '../contexts/WalletContext';

export const WalletWidget = () => {
  const { account, balance, isConnected, connectWallet, disconnectWallet } = useWallet();

  if (!isConnected) {
    return (
      <button 
        onClick={connectWallet}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
      >
        🦊 Connetti Wallet
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm opacity-80">Il tuo saldo</p>
          <p className="text-2xl font-bold">{parseFloat(balance).toLocaleString()} OMNY</p>
          <p className="text-xs opacity-60">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
        </div>
        <button 
          onClick={disconnectWallet}
          className="text-xs underline opacity-80 hover:opacity-100"
        >
          Disconnetti
        </button>
      </div>
    </div>
  );
};
```

### 3.3 Integrazione in App.tsx

```typescript
import { WalletProvider } from './contexts/WalletContext';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <WalletProvider>  {/* AGGIUNGI QUESTO */}
              {/* ... resto del codice ... */}
            </WalletProvider>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}
```

### 3.4 Aggiungi Widget in Dashboard Cliente

```typescript
// src/pages/Dashboard.tsx o BusinessCustomers.tsx
import { WalletWidget } from '../components/WalletWidget';

// Dentro il componente, aggiungi:
<WalletWidget />
```

---

## 🗄️ Step 4: Database (Supabase)

Aggiungi colonna `wallet_address` alla tabella `customers`:

```sql
ALTER TABLE customers 
ADD COLUMN wallet_address VARCHAR(42);

CREATE INDEX idx_customers_wallet ON customers(wallet_address);
```

Salva l'indirizzo wallet quando cliente connette MetaMask:

```typescript
// Dopo connectWallet, salva in Supabase
const { data: customer } = await supabase
  .from('customers')
  .select('id')
  .eq('user_id', currentUser.id)
  .single();

if (customer) {
  await supabase
    .from('customers')
    .update({ wallet_address: account })
    .eq('id', customer.id);
}
```

---

## 💰 Step 5: Logica "Guadagna OMNY"

Quando cliente compra, regala OMNY automaticamente.

### Opzione A: Client-Side (Più Semplice)

```typescript
// src/services/rewardService.ts
import { ethers } from 'ethers';

export const rewardCustomer = async (
  customerWallet: string, 
  amountEuros: number
) => {
  // 1 euro = 1 OMNY
  const omnyAmount = amountEuros.toString();
  
  // Wallet organizzazione (chi paga)
  const orgProvider = new ethers.BrowserProvider(window.ethereum);
  const orgSigner = await orgProvider.getSigner();
  
  const contract = new ethers.Contract(
    import.meta.env.VITE_OMNYCOIN_CONTRACT,
    ["function transfer(address to, uint256 amount) returns (bool)"],
    orgSigner
  );
  
  const decimals = 18;
  const amountWei = ethers.parseUnits(omnyAmount, decimals);
  
  const tx = await contract.transfer(customerWallet, amountWei);
  await tx.wait();
  
  return tx.hash;
};
```

Chiamala dopo una vendita:

```typescript
// Nel POS, dopo vendita completata
if (customer.wallet_address) {
  try {
    const txHash = await rewardCustomer(customer.wallet_address, totalAmount);
    console.log('OMNY inviati! TX:', txHash);
  } catch (error) {
    console.error('Errore invio OMNY:', error);
  }
}
```

### Opzione B: Server-Side (Più Sicuro)

Crea Edge Function Supabase:

```typescript
// supabase/functions/send-omny/index.ts
import { ethers } from 'ethers';

Deno.serve(async (req) => {
  const { customerWallet, amount } = await req.json();
  
  const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
  const wallet = new ethers.Wallet(Deno.env.get('ORG_PRIVATE_KEY')!, provider);
  
  const contract = new ethers.Contract(
    Deno.env.get('OMNYCOIN_CONTRACT')!,
    ["function transfer(address to, uint256 amount) returns (bool)"],
    wallet
  );
  
  const tx = await contract.transfer(
    customerWallet, 
    ethers.parseUnits(amount, 18)
  );
  await tx.wait();
  
  return new Response(JSON.stringify({ txHash: tx.hash }));
});
```

---

## 🧪 Step 6: Testing

### Test Manuale

1. **Connetti Wallet:**
   - Apri app in dev (`npm run dev`)
   - Clicca "Connetti Wallet"
   - Approva in MetaMask
   - Verifica che saldo OMNY appaia

2. **Test Reward:**
   - Simula vendita da POS
   - Verifica che OMNY arrivino a cliente
   - Controlla transazione su Polygonscan

3. **Test Sconto:**
   - Cliente spende OMNY
   - Verifica che sconto venga applicato
   - Verifica che OMNY tornino a organizzazione

### Test Automatici (Opzionale)

```typescript
// tests/omnycoin.test.ts
import { describe, it, expect } from 'vitest';
import { rewardCustomer } from '../src/services/rewardService';

describe('OmnyCoin Integration', () => {
  it('should reward customer with OMNY', async () => {
    const txHash = await rewardCustomer('0x...', 10);
    expect(txHash).toBeTruthy();
  });
});
```

---

## 🚀 Step 7: Deploy

1. **Build Frontend:**
   ```bash
   npm run build
   ```

2. **Deploy su Vercel:**
   - Aggiungi variabili ambiente in Vercel dashboard
   - Push su GitHub
   - Auto-deploy

3. **Verifica Produzione:**
   - Test connessione wallet
   - Test transazioni OMNY
   - Monitoraggio errori (Sentry)

---

## 📊 Monitoring & Analytics

### Metriche da Tracciare

- Numero wallet connessi
- OMNY distribuiti totali
- OMNY spesi (redemption rate)
- Transazioni fallite
- Gas fees totali

### Dashboard Analytics

```typescript
// Query Supabase per stats
const { data: stats } = await supabase
  .from('customers')
  .select('wallet_address')
  .not('wallet_address', 'is', null);

console.log(`${stats.length} clienti con wallet connesso`);
```

---

## ⚠️ Sicurezza

### Best Practices

1. **Mai esporre chiavi private** nel frontend
2. **Validare sempre** indirizzi wallet (checksum)
3. **Limitare amount** massimo per transazione
4. **Rate limiting** per prevenire spam
5. **Audit smart contract** prima di produzione

### Gestione Chiavi Organizzazione

```env
# .env.local (MAI committare!)
ORG_PRIVATE_KEY=0x... # Wallet organizzazione per reward
```

**IMPORTANTE:** Usa wallet dedicato con fondi limitati (hot wallet), non il wallet principale.

---

## 🐛 Troubleshooting

### Errore: "MetaMask not installed"
- Verifica `window.ethereum` esista
- Suggerisci installazione MetaMask

### Errore: "Wrong network"
- Auto-switch a Polygon con `wallet_switchEthereumChain`
- Fallback: mostra istruzioni manuali

### Errore: "Insufficient funds"
- Verifica saldo POL per gas fees
- Mostra messaggio chiaro all'utente

### Transazione pending troppo a lungo
- Aumenta gas price
- Implementa retry logic

---

## 📞 Support

**Domande Tecniche:**
- Documentazione Ethers.js: https://docs.ethers.org/v6/
- Polygon Docs: https://docs.polygon.technology/

**Contratto OmnyCoin:**
- Address: `0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4`
- Explorer: https://polygonscan.com/address/0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4

---

**Buon lavoro! 🚀**
