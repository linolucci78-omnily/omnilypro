-- ============================================================================
-- OMNILY PRO - AUTO POS_ENABLED SYSTEM
-- Versione: 1.0
-- Data: 2024
-- Descrizione: Sistema automatico per calcolare pos_enabled basato sui devices
-- ============================================================================

-- 1. FUNCTION: Calcola e aggiorna pos_enabled per un'organizzazione
-- Logica: pos_enabled = true se almeno 1 device con status 'online' o 'setup'
CREATE OR REPLACE FUNCTION update_organization_pos_enabled(org_id uuid)
RETURNS void AS $$
DECLARE
  active_devices_count integer;
  pos_model_value varchar(50);
BEGIN
  -- Conta devices attivi (online o in setup) per questa organizzazione
  SELECT COUNT(*)
  INTO active_devices_count
  FROM devices
  WHERE organization_id = org_id
    AND status IN ('online', 'setup');

  -- Ottieni il modello del primo device attivo (se esiste)
  SELECT device_model
  INTO pos_model_value
  FROM devices
  WHERE organization_id = org_id
    AND status IN ('online', 'setup')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Aggiorna l'organizzazione
  UPDATE organizations
  SET
    pos_enabled = (active_devices_count > 0),
    pos_model = COALESCE(pos_model_value, pos_model), -- Mantieni il vecchio valore se non ci sono devices
    updated_at = now()
  WHERE id = org_id;

  RAISE NOTICE 'Organization % updated: pos_enabled = %, active devices = %',
    org_id, (active_devices_count > 0), active_devices_count;
END;
$$ LANGUAGE plpgsql;

-- 2. FUNCTION: Trigger function per aggiornare pos_enabled quando cambia un device
CREATE OR REPLACE FUNCTION trigger_update_pos_enabled()
RETURNS trigger AS $$
BEGIN
  -- Determina quale organization_id aggiornare
  IF TG_OP = 'DELETE' THEN
    -- Se eliminiamo un device, aggiorna la vecchia organization
    PERFORM update_organization_pos_enabled(OLD.organization_id);
  ELSE
    -- Per INSERT e UPDATE, aggiorna la nuova organization
    PERFORM update_organization_pos_enabled(NEW.organization_id);

    -- Se UPDATE ha cambiato organization_id, aggiorna anche la vecchia
    IF TG_OP = 'UPDATE' AND OLD.organization_id != NEW.organization_id THEN
      PERFORM update_organization_pos_enabled(OLD.organization_id);
    END IF;
  END IF;

  RETURN NULL; -- trigger AFTER non richiede valore di ritorno
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER: Esegui quando cambia un device
DROP TRIGGER IF EXISTS trigger_devices_pos_enabled ON devices;
CREATE TRIGGER trigger_devices_pos_enabled
  AFTER INSERT OR UPDATE OR DELETE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_pos_enabled();

-- 4. INIZIALIZZAZIONE: Aggiorna pos_enabled per tutte le organizzazioni esistenti
DO $$
DECLARE
  org_record RECORD;
  total_orgs integer := 0;
  updated_orgs integer := 0;
BEGIN
  -- Conta organizzazioni totali
  SELECT COUNT(*) INTO total_orgs FROM organizations;

  RAISE NOTICE 'Starting pos_enabled initialization for % organizations...', total_orgs;

  -- Aggiorna ogni organizzazione
  FOR org_record IN SELECT id FROM organizations LOOP
    PERFORM update_organization_pos_enabled(org_record.id);
    updated_orgs := updated_orgs + 1;
  END LOOP;

  RAISE NOTICE 'Completed: % organizations updated', updated_orgs;
END $$;

-- 5. VERIFICA: Mostra risultati
DO $$
DECLARE
  pos_enabled_count integer;
  pos_disabled_count integer;
  total_devices integer;
BEGIN
  SELECT COUNT(*) INTO pos_enabled_count FROM organizations WHERE pos_enabled = true;
  SELECT COUNT(*) INTO pos_disabled_count FROM organizations WHERE pos_enabled = false;
  SELECT COUNT(*) INTO total_devices FROM devices WHERE status IN ('online', 'setup');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'POS_ENABLED AUTO-UPDATE SYSTEM ACTIVE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organizations with POS enabled: %', pos_enabled_count;
  RAISE NOTICE 'Organizations with POS disabled: %', pos_disabled_count;
  RAISE NOTICE 'Total active devices: %', total_devices;
  RAISE NOTICE '========================================';
END $$;
