-- ============================================================================
-- Setup Super Admin - Pasquale Lucci
-- ============================================================================
-- Questo script inserisce o aggiorna il tuo account come super_admin
-- nella tabella users per garantire l'accesso al frontend web.

-- Inserisce o aggiorna il record super_admin
INSERT INTO users (id, email, role, is_active)
VALUES (
  '4462e3f1-d08c-4dac-98ae-ba14f28f57fe',
  'pako.lucci@gmail.com',
  'super_admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  updated_at = now();

-- Verifica che il record sia stato creato correttamente
SELECT
  id,
  email,
  role,
  is_active,
  created_at,
  updated_at
FROM users
WHERE id = '4462e3f1-d08c-4dac-98ae-ba14f28f57fe';

-- ============================================================================
-- FINE SCRIPT
-- ============================================================================
