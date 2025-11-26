-- Update existing users with default names
-- Questo script popola i campi first_name e last_name per gli utenti esistenti

-- Esempio: Aggiorna i tuoi utenti esistenti
-- Sostituisci gli ID e i nomi con quelli reali

-- Utente 1: pako.lucci@gmail.com
UPDATE public.users
SET
  first_name = 'Pasquale',
  last_name = 'Lucci'
WHERE email = 'pako.lucci@gmail.com';

-- Utente 2: lino.lucci@mail.com
UPDATE public.users
SET
  first_name = 'Lino',
  last_name = 'Lucci'
WHERE email = 'lino.lucci@mail.com';

-- Verifica risultati
SELECT
  id,
  email,
  first_name,
  last_name,
  avatar_url,
  role,
  status
FROM public.users
ORDER BY created_at DESC;
