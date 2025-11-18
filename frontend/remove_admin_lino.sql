-- Rimuovi permessi admin da lino.lucci@mail.com

-- OPZIONE 1: Rimuovi completamente l'utente da organization_users
-- Questo rimuove tutti i permessi a qualsiasi organizzazione
DELETE FROM organization_users
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'lino.lucci@mail.com'
);

-- OPZIONE 2 (commenta la query sopra e usa questa invece):
-- Cambia solo il ruolo da super_admin a member
-- UPDATE organization_users
-- SET role = 'member'
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'lino.lucci@mail.com'
-- ) AND role = 'super_admin';

-- Verifica il risultato
SELECT
  u.email,
  ou.role,
  ou.organization_id
FROM auth.users u
LEFT JOIN organization_users ou ON ou.user_id = u.id
WHERE u.email = 'lino.lucci@mail.com';
