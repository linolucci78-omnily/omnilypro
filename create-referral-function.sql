-- Funzione per generare codici referral univoci
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    -- Genera un codice di 8 caratteri
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Verifica se il codice esiste già
    SELECT EXISTS(SELECT 1 FROM customers WHERE referral_code = result) INTO code_exists;

    -- Se non esiste, esci dal loop
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN result;
END;
$$;

-- Test della funzione
SELECT generate_referral_code();
