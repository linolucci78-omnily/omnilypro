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
- **Logo:** `https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/moneyomily.png`
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

## 🔥 Step 8: Implementazioni Avanzate (CRITICHE)

### 8.1 Meta-Transactions (Gasless per Clienti)

**Problema:** Clienti non hanno MATIC per pagare gas fees.

**Soluzione:** Organization paga il gas per i propri clienti.

```typescript
// src/services/gasRelayer.ts
import { ethers } from 'ethers';

interface MetaTransaction {
  from: string;
  to: string;
  amount: string;
  nonce: number;
  signature: string;
}

export class GasRelayer {
  private provider: ethers.JsonRpcProvider;
  private relayerWallet: ethers.Wallet;
  
  constructor(orgPrivateKey: string) {
    this.provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
    this.relayerWallet = new ethers.Wallet(orgPrivateKey, this.provider);
  }
  
  // Cliente firma transazione (gratis)
  async signTransfer(
    customerWallet: ethers.Wallet,
    to: string,
    amount: string
  ): Promise<MetaTransaction> {
    const nonce = await this.getNonce(customerWallet.address);
    
    const message = ethers.solidityPackedKeccak256(
      ['address', 'address', 'uint256', 'uint256'],
      [customerWallet.address, to, ethers.parseUnits(amount, 18), nonce]
    );
    
    const signature = await customerWallet.signMessage(ethers.getBytes(message));
    
    return {
      from: customerWallet.address,
      to,
      amount,
      nonce,
      signature
    };
  }
  
  // Organization esegue transazione (paga gas)
  async executeMetaTransaction(metaTx: MetaTransaction): Promise<string> {
    const contract = new ethers.Contract(
      process.env.OMNYCOIN_CONTRACT!,
      [
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function executeMetaTransaction(address from, address to, uint256 amount, bytes signature) returns (bool)"
      ],
      this.relayerWallet
    );
    
    // Verifica firma
    const isValid = await this.verifySignature(metaTx);
    if (!isValid) throw new Error('Invalid signature');
    
    // Esegui transazione (organization paga gas ~€0.001)
    const tx = await contract.executeMetaTransaction(
      metaTx.from,
      metaTx.to,
      ethers.parseUnits(metaTx.amount, 18),
      metaTx.signature
    );
    
    await tx.wait();
    return tx.hash;
  }
  
  private async verifySignature(metaTx: MetaTransaction): Promise<boolean> {
    const message = ethers.solidityPackedKeccak256(
      ['address', 'address', 'uint256', 'uint256'],
      [metaTx.from, metaTx.to, ethers.parseUnits(metaTx.amount, 18), metaTx.nonce]
    );
    
    const recoveredAddress = ethers.verifyMessage(
      ethers.getBytes(message),
      metaTx.signature
    );
    
    return recoveredAddress.toLowerCase() === metaTx.from.toLowerCase();
  }
  
  private async getNonce(address: string): Promise<number> {
    // Get nonce from database to prevent replay attacks
    const { data } = await supabase
      .from('wallet_nonces')
      .select('nonce')
      .eq('address', address)
      .single();
    
    return data?.nonce || 0;
  }
}
```

**Costo per Organization:**
- 10,000 transazioni/mese × €0.001 = **€10/mese**
- Completamente sostenibile

---

### 8.2 Wallet Custodial per Clienti

**Problema:** Clienti non sanno gestire chiavi private.

**Soluzione:** OMNILY custodisce wallet per i clienti (con recovery).

```typescript
// src/services/custodialWallet.ts
import { ethers } from 'ethers';
import crypto from 'crypto';

export class CustodialWalletService {
  // Crea wallet per nuovo cliente
  async createCustomerWallet(customerId: string): Promise<string> {
    // Genera wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Encrypt seed phrase
    const encryptedSeed = this.encrypt(wallet.mnemonic!.phrase);
    
    // Salva in Supabase
    await supabase
      .from('customers')
      .update({
        wallet_address: wallet.address,
        wallet_seed_encrypted: encryptedSeed,
        wallet_created_at: new Date().toISOString()
      })
      .eq('id', customerId);
    
    return wallet.address;
  }
  
  // Recovery wallet con email
  async recoverWallet(customerId: string, email: string): Promise<string> {
    // 1. Verifica email
    const verificationCode = Math.random().toString(36).substring(7);
    await this.sendRecoveryEmail(email, verificationCode);
    
    // 2. User inserisce code
    // ... (implementa verifica code)
    
    // 3. Decrypt seed
    const { data: customer } = await supabase
      .from('customers')
      .select('wallet_seed_encrypted')
      .eq('id', customerId)
      .single();
    
    const seed = this.decrypt(customer.wallet_seed_encrypted);
    
    // 4. Restore wallet
    const wallet = ethers.Wallet.fromPhrase(seed);
    
    return wallet.address;
  }
  
  // Encrypt/Decrypt con AES-256
  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    });
  }
  
  private decrypt(encryptedData: string): string {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  private async sendRecoveryEmail(email: string, code: string) {
    // Implementa con Resend o SendGrid
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'recovery@omnilypro.app',
        to: email,
        subject: 'Recupero Wallet OMNILY PRO',
        html: `Il tuo codice di recupero è: <strong>${code}</strong>`
      })
    });
  }
}
```

**Database Schema:**
```sql
ALTER TABLE customers
ADD COLUMN wallet_seed_encrypted TEXT,
ADD COLUMN wallet_created_at TIMESTAMP,
ADD COLUMN wallet_recovery_email VARCHAR(255);

CREATE TABLE wallet_nonces (
  address VARCHAR(42) PRIMARY KEY,
  nonce INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 8.3 Dashboard "Compra OMNY" (Fiat-to-Crypto)

**Problema:** Organization deve comprare OMNY facilmente.

**Soluzione:** Integrazione Stripe per acquisto diretto.

```typescript
// src/components/Organization/BuyOMNYDashboard.tsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY!);

export const BuyOMNYDashboard = () => {
  const [amount, setAmount] = useState(10000);
  const [loading, setLoading] = useState(false);
  
  const pricePerOMNY = 0.10; // €0.10 per OMNY
  const totalPrice = amount * pricePerOMNY;
  
  const handleBuyOMNY = async () => {
    setLoading(true);
    
    try {
      // 1. Create Stripe Checkout Session
      const response = await fetch('/api/create-omny-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, orgId: currentOrg.id })
      });
      
      const { sessionId } = await response.json();
      
      // 2. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      await stripe!.redirectToCheckout({ sessionId });
      
    } catch (error) {
      console.error('Errore acquisto OMNY:', error);
      alert('Errore durante l\'acquisto. Riprova.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="buy-omny-dashboard">
      <h2>Compra OmnyCoin</h2>
      
      <div className="price-calculator">
        <label>Quantità OMNY</label>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(Number(e.target.value))}
          min="1000"
          step="1000"
        />
        
        <div className="price-breakdown">
          <p>Prezzo unitario: €{pricePerOMNY}</p>
          <p className="total">Totale: €{totalPrice.toLocaleString()}</p>
        </div>
        
        <button 
          onClick={handleBuyOMNY}
          disabled={loading}
          className="buy-button"
        >
          {loading ? 'Elaborazione...' : `Compra ${amount.toLocaleString()} OMNY`}
        </button>
      </div>
      
      <div className="info-box">
        <h3>Come funziona?</h3>
        <ol>
          <li>Scegli quanti OMNY comprare</li>
          <li>Paga con carta (Stripe sicuro)</li>
          <li>OMNY arrivano nel tuo wallet in 1-2 minuti</li>
          <li>Inizia a regalare OMNY ai tuoi clienti!</li>
        </ol>
      </div>
    </div>
  );
};
```

**Backend (Supabase Edge Function):**
```typescript
// supabase/functions/create-omny-checkout/index.ts
import Stripe from 'stripe';
import { ethers } from 'ethers';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { amount, orgId } = await req.json();
  
  const pricePerOMNY = 0.10;
  const totalPrice = amount * pricePerOMNY;
  
  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${amount.toLocaleString()} OmnyCoin (OMNY)`,
          description: 'Loyalty token per OMNILY PRO'
        },
        unit_amount: Math.round(totalPrice * 100) // cents
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${Deno.env.get('APP_URL')}/dashboard?omny_purchase=success`,
    cancel_url: `${Deno.env.get('APP_URL')}/dashboard?omny_purchase=cancelled`,
    metadata: {
      orgId,
      omnyAmount: amount.toString()
    }
  });
  
  return new Response(JSON.stringify({ sessionId: session.id }));
});
```

**Webhook Handler (dopo pagamento):**
```typescript
// supabase/functions/stripe-webhook/index.ts
Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { orgId, omnyAmount } = session.metadata;
    
    // 1. Get organization wallet
    const { data: org } = await supabase
      .from('organizations')
      .select('wallet_address')
      .eq('id', orgId)
      .single();
    
    // 2. Transfer OMNY from Super Admin wallet
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
    const superAdminWallet = new ethers.Wallet(
      Deno.env.get('SUPER_ADMIN_PRIVATE_KEY')!,
      provider
    );
    
    const contract = new ethers.Contract(
      Deno.env.get('OMNYCOIN_CONTRACT')!,
      ["function transfer(address to, uint256 amount) returns (bool)"],
      superAdminWallet
    );
    
    const tx = await contract.transfer(
      org.wallet_address,
      ethers.parseUnits(omnyAmount, 18)
    );
    
    await tx.wait();
    
    // 3. Update organization balance
    await supabase
      .from('organizations')
      .update({
        omny_balance: supabase.raw(`omny_balance + ${omnyAmount}`),
        omny_purchased: supabase.raw(`omny_purchased + ${omnyAmount}`)
      })
      .eq('id', orgId);
    
    // 4. Log transaction
    await supabase.from('omny_transactions').insert({
      org_id: orgId,
      type: 'purchase',
      amount: omnyAmount,
      tx_hash: tx.hash,
      from_wallet: superAdminWallet.address,
      to_wallet: org.wallet_address,
      payment_id: session.id
    });
  }
  
  return new Response(JSON.stringify({ received: true }));
});
```

**Margine di Profitto:**
- Costo OMNY: €0 (li crei tu)
- Prezzo vendita: €0.10
- **Margine: 100%**

Per 100,000 OMNY venduti = **€10,000 profitto**

---

### 8.4 QR Code Payments (In-Store)

**Problema:** Cliente deve mostrare wallet per ricevere OMNY.

**Soluzione:** Cliente mostra QR code, POS scansiona.

```typescript
// src/components/Customer/OMNYQRCode.tsx
import QRCode from 'qrcode.react';
import { useWallet } from '../contexts/WalletContext';

export const OMNYQRCode = () => {
  const { account } = useWallet();
  
  // QR code contiene wallet address
  const qrData = JSON.stringify({
    type: 'omnycoin_wallet',
    address: account,
    version: '1.0'
  });
  
  return (
    <div className="qr-code-container">
      <h3>Mostra al Negoziante</h3>
      <QRCode 
        value={qrData}
        size={300}
        level="H"
        includeMargin
      />
      <p className="wallet-address">{account}</p>
    </div>
  );
};
```

**POS Scanner:**
```typescript
// src/components/POS/QRScanner.tsx
import { Html5QrcodeScanner } from 'html5-qrcode';

export const QRScanner = ({ onScan }: { onScan: (address: string) => void }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );
    
    scanner.render((decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        if (data.type === 'omnycoin_wallet') {
          onScan(data.address);
          scanner.clear();
        }
      } catch (error) {
        console.error('QR code non valido');
      }
    }, (error) => {
      // Ignore scan errors
    });
    
    return () => scanner.clear();
  }, []);
  
  return <div id="qr-reader"></div>;
};
```

---

### 8.5 Analytics Blockchain

**Dashboard con metriche on-chain:**

```typescript
// src/services/blockchainAnalytics.ts
export class BlockchainAnalytics {
  async getOrganizationStats(orgWalletAddress: string) {
    const contract = new ethers.Contract(
      OMNYCOIN_CONTRACT,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );
    
    // 1. Current balance
    const balance = await contract.balanceOf(orgWalletAddress);
    
    // 2. Total distributed (from database)
    const { data: distributed } = await supabase
      .from('omny_transactions')
      .select('amount')
      .eq('type', 'reward')
      .eq('from_wallet', orgWalletAddress);
    
    const totalDistributed = distributed.reduce((sum, tx) => sum + tx.amount, 0);
    
    // 3. Total received back (redemptions)
    const { data: received } = await supabase
      .from('omny_transactions')
      .select('amount')
      .eq('type', 'redemption')
      .eq('to_wallet', orgWalletAddress);
    
    const totalReceived = received.reduce((sum, tx) => sum + tx.amount, 0);
    
    // 4. Velocity (average time between earn and spend)
    const velocity = await this.calculateVelocity(orgWalletAddress);
    
    // 5. Top customers
    const topCustomers = await this.getTopCustomers(orgWalletAddress);
    
    return {
      currentBalance: ethers.formatUnits(balance, 18),
      totalDistributed,
      totalReceived,
      netDistribution: totalDistributed - totalReceived,
      velocity,
      topCustomers,
      redemptionRate: (totalReceived / totalDistributed) * 100
    };
  }
  
  private async calculateVelocity(orgAddress: string): Promise<number> {
    // Average days between earning and spending OMNY
    const { data } = await supabase.rpc('calculate_omny_velocity', {
      org_address: orgAddress
    });
    
    return data || 0;
  }
  
  private async getTopCustomers(orgAddress: string) {
    const { data } = await supabase
      .from('omny_transactions')
      .select('customer_id, amount')
      .eq('from_wallet', orgAddress)
      .eq('type', 'reward')
      .order('amount', { ascending: false })
      .limit(10);
    
    return data;
  }
}
```

---

## ⚖️ Step 9: Compliance & Legal

### 9.1 Status Legale OmnyCoin

**Classificazione secondo MiCA (Markets in Crypto-Assets Regulation):**

OmnyCoin è un **Utility Token** con le seguenti caratteristiche:

✅ **NON è E-Money Token perché:**
- Non è rimborsabile in euro
- Non ha valore nominale fisso
- Non è mezzo di pagamento generale

✅ **NON è Asset-Referenced Token perché:**
- Non è ancorato a valuta fiat
- Non mantiene valore stabile

✅ **È Utility Token perché:**
- Fornisce accesso a servizi (sconti)
- Ha utilità specifica nell'ecosistema OMNILY PRO
- Non è investment product

**Implicazioni:**
- ✅ Non serve licenza e-money
- ✅ Non serve licenza payment service
- ⚠️ Serve white paper (se offerta pubblica > €1M)
- ⚠️ Serve KYC per organization (non per clienti)

### 9.2 Checklist Compliance

**GDPR (Privacy):**
- [ ] Privacy Policy aggiornata
- [ ] Cookie consent
- [ ] Data retention policy
- [ ] Right to erasure (wallet recovery)

**MiCA (Crypto):**
- [ ] White paper OmnyCoin (se necessario)
- [ ] Risk disclosure
- [ ] Terms & Conditions
- [ ] Complaint handling procedure

**AML/KYC:**
- [ ] KYC per organization (business verification)
- [ ] Transaction monitoring (>€10k)
- [ ] Suspicious activity reporting

**Consumer Protection:**
- [ ] Refund policy
- [ ] Dispute resolution
- [ ] Customer support SLA

### 9.3 Legali Crypto da Contattare

**Studi Legali Specializzati Italia:**

1. **Lexia Avvocati** (Milano)
   - Specializzati blockchain/crypto
   - Costo: €3-5k consulenza iniziale
   - Email: info@lexia.it

2. **Portolano Cavallo** (Milano/Roma)
   - Fintech & crypto
   - Costo: €5-8k
   - Email: info@portolano.it

3. **Gianni & Origoni** (Milano)
   - Regulatory compliance
   - Costo: €4-6k
   - Email: go@gianni-origoni.com

**Budget Totale Compliance:** €10-15k

---

## 📊 Step 10: Costi Operativi Dettagliati

### Gas Fees (Polygon)

**Per Transazione:**
- Transfer OMNY: ~€0.0008
- Meta-transaction: ~€0.0012
- Batch transfer (10x): ~€0.003

**Scenario 10,000 Transazioni/Mese:**
- Costo gas: €12/mese
- **Completamente sostenibile**

**Confronto con Alternative:**
- Stripe: 1.5% + €0.25 = €1,000+ per €50k transato
- OmnyCoin: €12 fisso
- **Risparmio: 98%**

### Infrastruttura

**Costi Mensili:**
- Supabase Pro: €25
- Vercel Pro: €20
- Polygon RPC (Alchemy): €0 (tier gratuito fino a 300M requests)
- OneSignal: €0 (tier gratuito fino a 10k subscribers)
- Stripe: 1.4% + €0.25 per transazione fiat
- **Totale: ~€50/mese**

### Team (con €150k seed)

**Anno 1:**
- 1 Full-time Developer: €50k
- 1 Sales/BizDev: €40k
- Freelance (design, legal): €20k
- Marketing: €30k
- Operativo: €10k
- **Totale: €150k**

---

## 🧪 Step 11: Strategia di Testing Sicura (Feature Flags)

Per lavorare su OmnyCoin senza disturbare gli utenti attuali, useremo i **Feature Flags** e la **Testnet**.

### 11.1 Configurazione Feature Flag

Nel file `.env` (non committato su git):

```env
# In Produzione (Clienti)
VITE_OMNYCOIN_ENABLED=false

# In Sviluppo (Tuoi Developer)
VITE_OMNYCOIN_ENABLED=true
```

Nel codice (`src/config/features.ts`):

```typescript
export const FEATURES = {
  omnycoin: import.meta.env.VITE_OMNYCOIN_ENABLED === 'true'
};
```

Uso nella UI:

```typescript
import { FEATURES } from '../config/features';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Visibile a tutti */}
      <LoyaltyPointsCard />
      
      {/* Visibile SOLO se attivato */}
      {FEATURES.omnycoin && (
        <OmnyCoinWalletCard />
      )}
    </div>
  );
};
```

### 11.2 Ambiente di Test (Polygon Amoy)

Non usare soldi veri per i test! Usa la **Polygon Amoy Testnet**.

1. **Ottieni MATIC di prova:** Vai su [Polygon Faucet](https://faucet.polygon.technology/)
2. **Deploy Contratto di Test:**
   - I developer deployano `OmnyCoin.sol` su Amoy
   - Ottengono un indirizzo di contratto "finto" (es. `0xTest...`)

Configurazione `.env.development`:
```env
VITE_CHAIN_ID=80002 (Amoy Testnet)
VITE_RPC_URL=https://rpc-amoy.polygon.technology/
VITE_OMNYCOIN_CONTRACT=0x... (Indirizzo Testnet)
```

Configurazione `.env.production`:
```env
VITE_CHAIN_ID=137 (Polygon Mainnet)
VITE_RPC_URL=https://polygon-rpc.com/
VITE_OMNYCOIN_CONTRACT=0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4
```

### 11.3 Workflow di Rilascio

1. **Sviluppo:** Developer lavorano con `ENABLED=true` su Testnet.
2. **Validazione:** Tu provi la versione di test sul tuo PC.
3. **Deploy:** Il codice va online con `ENABLED=false`. Nessuno vede nulla.
4. **Beta:** Attivi `ENABLED=true` solo per 5 negozi amici (tramite whitelist nel DB).
5. **Lancio:** Attivi `ENABLED=true` per tutti.

---

**Buon lavoro! 🚀**

