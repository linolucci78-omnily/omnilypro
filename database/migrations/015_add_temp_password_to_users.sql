-- Aggiunge campo temp_password per memorizzare password temporanea
-- prima dell'attivazione dell'account

ALTER TABLE users
ADD COLUMN IF NOT EXISTS temp_password TEXT;

-- Questo campo contiene la password temporanea che verrà usata
-- per creare l'account Supabase Auth quando l'admin clicca "Attiva Account"
