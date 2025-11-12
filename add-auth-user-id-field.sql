-- Aggiungi campo auth_user_id alla tabella customers se non esiste
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Crea un indice per performance
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
