-- Customer Wallet System (SIMPLIFIED - senza riferimenti a staff)

-- Tabella wallet cliente
CREATE TABLE IF NOT EXISTS customer_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, customer_id),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_customer_wallets_customer ON customer_wallets(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_wallets_org ON customer_wallets(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_wallets_status ON customer_wallets(status);

-- Tabella transazioni wallet
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES customer_wallets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  metadata JSONB,
  processed_by_staff_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT non_zero_amount CHECK (amount != 0)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer ON wallet_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_org ON wallet_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_timestamp ON customer_wallets;
CREATE TRIGGER trigger_update_wallet_timestamp
BEFORE UPDATE ON customer_wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallet_timestamp();

-- Auto-crea wallet per nuovi clienti
CREATE OR REPLACE FUNCTION create_customer_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_wallets (organization_id, customer_id, balance)
  VALUES (NEW.organization_id, NEW.id, 0.00)
  ON CONFLICT (organization_id, customer_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_customer_wallet ON customers;
CREATE TRIGGER trigger_create_customer_wallet
AFTER INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION create_customer_wallet();

-- Funzione transazione atomica
CREATE OR REPLACE FUNCTION process_wallet_transaction(
  p_wallet_id UUID,
  p_type VARCHAR(50),
  p_amount DECIMAL(10, 2),
  p_description TEXT DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_wallet_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_transaction_id UUID;
  v_customer_id UUID;
  v_org_id UUID;
BEGIN
  SELECT balance, customer_id, organization_id
  INTO v_wallet_balance, v_customer_id, v_org_id
  FROM customer_wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet non trovato';
  END IF;

  IF p_type IN ('credit', 'gift_certificate_redeem', 'refund', 'top_up') THEN
    v_new_balance := v_wallet_balance + p_amount;
  ELSIF p_type IN ('debit', 'payment') THEN
    v_new_balance := v_wallet_balance - p_amount;
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Saldo insufficiente';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tipo transazione non valido: %', p_type;
  END IF;

  INSERT INTO wallet_transactions (
    wallet_id, organization_id, customer_id, type, amount,
    description, reference_type, reference_id,
    balance_before, balance_after, metadata, processed_by_staff_id
  ) VALUES (
    p_wallet_id, v_org_id, v_customer_id, p_type, p_amount,
    p_description, p_reference_type, p_reference_id,
    v_wallet_balance, v_new_balance, p_metadata, p_staff_id
  ) RETURNING id INTO v_transaction_id;

  UPDATE customer_wallets SET balance = v_new_balance WHERE id = p_wallet_id;
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS customer_wallets_select_policy ON customer_wallets;
DROP POLICY IF EXISTS customer_wallets_staff_policy ON customer_wallets;
DROP POLICY IF EXISTS customer_wallets_anon_policy ON customer_wallets;
DROP POLICY IF EXISTS wallet_transactions_select_policy ON wallet_transactions;
DROP POLICY IF EXISTS wallet_transactions_staff_policy ON wallet_transactions;
DROP POLICY IF EXISTS wallet_transactions_anon_policy ON wallet_transactions;

-- Policies per customer_wallets - permettere accesso ai clienti autenticati
CREATE POLICY customer_wallets_select_policy ON customer_wallets
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM customers WHERE id = customer_id)
  );

-- Policy permissiva per staff/admin (tutti gli utenti autenticati possono gestire wallet)
CREATE POLICY customer_wallets_staff_policy ON customer_wallets
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies per wallet_transactions
CREATE POLICY wallet_transactions_select_policy ON wallet_transactions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM customers WHERE id = customer_id)
  );

-- Policy permissiva per staff/admin
CREATE POLICY wallet_transactions_staff_policy ON wallet_transactions
  FOR ALL USING (auth.uid() IS NOT NULL);
