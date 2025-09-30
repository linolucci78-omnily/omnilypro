-- ============================================================================
-- OMNILY PRO - SCHEMA DATABASE MDM (Mobile Device Management)
-- Versione: 1.0
-- Data: 29 Settembre 2024
-- Descrizione: Tabelle per controllo remoto dispositivi POS Android
-- ============================================================================

-- 1. TABELLA DISPOSITIVI POS
-- Memorizza tutti i dispositivi Android gestiti dal sistema
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificazione dispositivo
  name varchar(100) NOT NULL, -- "POS-Milano-01"
  android_id varchar(100) UNIQUE, -- ID univoco Android
  device_model varchar(50), -- "Z108", "Samsung Tab A"
  serial_number varchar(100),

  -- Associazione negozio/organizzazione
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  store_location varchar(100), -- "Milano Centro", "Roma Termini"
  store_address text,

  -- Status e connettività
  status varchar(20) DEFAULT 'offline', -- 'online', 'offline', 'setup', 'maintenance'
  last_seen timestamp DEFAULT now(),
  last_ip_address inet,
  wifi_ssid varchar(100),
  wifi_signal_strength integer, -- 0-100

  -- Hardware info
  battery_level integer, -- 0-100
  storage_free_gb decimal(5,2),
  ram_free_gb decimal(5,2),
  cpu_usage_percent integer,

  -- App e modalità
  current_app_package varchar(100), -- "com.tuaazienda.bridge"
  kiosk_mode_active boolean DEFAULT false,
  kiosk_allowed_apps text[], -- Array di package names

  -- Posizione GPS
  latitude decimal(10,8),
  longitude decimal(11,8),
  location_accuracy_meters integer,
  location_updated_at timestamp,

  -- Configurazione
  language varchar(10) DEFAULT 'it_IT',
  timezone varchar(50) DEFAULT 'Europe/Rome',
  auto_updates_enabled boolean DEFAULT true,
  heartbeat_interval_seconds integer DEFAULT 30,

  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  -- Indici per performance
  CONSTRAINT devices_name_org_unique UNIQUE (name, organization_id)
);

-- 2. TABELLA COMANDI REMOTI
-- Memorizza tutti i comandi inviati ai dispositivi
CREATE TABLE IF NOT EXISTS device_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Riferimenti
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES auth.users(id), -- Chi ha inviato il comando

  -- Comando
  command_type varchar(50) NOT NULL, -- 'reboot', 'kiosk_on', 'kiosk_off', 'install_app', 'wipe', 'locate'
  command_title varchar(100), -- "Riavvio dispositivo"
  payload jsonb, -- Parametri specifici del comando

  -- Esecuzione
  status varchar(20) DEFAULT 'pending', -- 'pending', 'executing', 'completed', 'failed', 'timeout'
  scheduled_for timestamp, -- Per comandi programmati
  started_at timestamp,
  completed_at timestamp,

  -- Risultato
  result_data jsonb, -- Risultato del comando
  error_message text,
  execution_duration_ms integer,

  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 3. TABELLA CONFIGURAZIONI NEGOZI
-- Memorizza configurazioni WiFi e impostazioni per ogni negozio
CREATE TABLE IF NOT EXISTS store_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificazione negozio
  store_name varchar(100) NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  store_code varchar(20), -- Codice breve per identificazione

  -- Configurazione WiFi
  wifi_ssid varchar(100),
  wifi_password varchar(100), -- Crittografato
  wifi_security_type varchar(20), -- 'WPA2', 'WPA3', 'OPEN'
  backup_wifi_ssid varchar(100),
  backup_wifi_password varchar(100),

  -- Impostazioni dispositivo
  default_language varchar(10) DEFAULT 'it_IT',
  default_timezone varchar(50) DEFAULT 'Europe/Rome',
  default_volume_level integer DEFAULT 70,
  screen_brightness integer DEFAULT 80,
  screen_timeout_minutes integer DEFAULT 15,

  -- Configurazione POS specifica
  pos_settings jsonb DEFAULT '{}', -- Impostazioni specifiche business
  kiosk_default_app varchar(100), -- App da avviare in kiosk mode
  allowed_apps text[], -- App consentite

  -- Orari operativi
  opening_hours jsonb, -- {"monday": "09:00-19:00", ...}
  auto_shutdown_enabled boolean DEFAULT false,
  shutdown_time time,
  startup_time time,

  -- Stamps
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  CONSTRAINT store_configs_name_org_unique UNIQUE (store_name, organization_id)
);

-- 4. TABELLA TOKEN SETUP
-- Token temporanei per setup automatico dispositivi via QR Code
CREATE TABLE IF NOT EXISTS setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Token e sicurezza
  token varchar(255) UNIQUE NOT NULL, -- Token univoco per setup
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  store_config_id uuid REFERENCES store_configs(id),

  -- Validità
  expires_at timestamp NOT NULL,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  used boolean DEFAULT false,

  -- Dati setup
  setup_data jsonb, -- Configurazioni complete per il dispositivo
  qr_code_generated boolean DEFAULT false,
  qr_code_url text,

  -- Tracking
  generated_by uuid REFERENCES auth.users(id),
  used_by_device_info jsonb, -- Info del dispositivo che ha usato il token
  used_at timestamp,

  created_at timestamp DEFAULT now()
);

-- 5. TABELLA REPOSITORY APK
-- Memorizza informazioni sulle app disponibili per installazione
CREATE TABLE IF NOT EXISTS app_repository (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Info app
  app_name varchar(100) NOT NULL,
  package_name varchar(100) NOT NULL, -- "com.tuaazienda.bridge"
  version_name varchar(20) NOT NULL, -- "2.1.0"
  version_code integer NOT NULL,

  -- File APK
  apk_url text NOT NULL, -- URL Supabase Storage
  apk_size_mb decimal(6,2),
  apk_hash_sha256 varchar(64), -- Per validazione integrità

  -- Metadati
  description text,
  changelog text,
  min_android_version integer, -- API level minimo
  required_permissions text[], -- Permessi richiesti

  -- Deployment
  is_active boolean DEFAULT true,
  is_mandatory boolean DEFAULT false, -- Update obbligatorio
  rollout_percentage integer DEFAULT 100, -- % dispositivi per gradual rollout
  target_device_models text[], -- Modelli compatibili

  -- Tracking
  upload_date timestamp DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  install_count integer DEFAULT 0,
  success_rate_percent decimal(5,2),

  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  CONSTRAINT app_repo_package_version_unique UNIQUE (package_name, version_code)
);

-- 6. TABELLA TEMPLATE STAMPA
-- Template configurazione stampa per stampanti termiche 58mm
CREATE TABLE IF NOT EXISTS print_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificazione template
  name varchar(100) NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,

  -- Configurazione negozio
  store_name varchar(100) NOT NULL,
  store_address text,
  store_phone varchar(50),
  store_tax varchar(20), -- P.IVA/Codice Fiscale
  logo_base64 text, -- Logo in base64 per stampa

  -- Configurazione carta
  paper_width integer DEFAULT 384, -- 58mm = 384 dots
  font_size_normal integer DEFAULT 24,
  font_size_large integer DEFAULT 32,
  print_density integer DEFAULT 3, -- 1-5 densità di stampa

  -- Template settings
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  CONSTRAINT print_templates_name_org_unique UNIQUE (name, organization_id)
);

-- 7. TABELLA LOG ATTIVITÀ MDM
-- Log completo di tutte le attività del sistema MDM
CREATE TABLE IF NOT EXISTS mdm_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Riferimenti
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id), -- Chi ha fatto l'azione
  organization_id uuid REFERENCES organizations(id),

  -- Attività
  activity_type varchar(50) NOT NULL, -- 'command_sent', 'device_registered', 'app_installed'
  activity_title varchar(200),
  activity_description text,

  -- Dati specifici
  activity_data jsonb, -- Dati completi dell'attività

  -- Risultato
  success boolean,
  error_details text,

  -- Context
  ip_address inet,
  user_agent text,

  created_at timestamp DEFAULT now()
);

-- ============================================================================
-- INDICI PER PERFORMANCE
-- ============================================================================

-- Indici principali per query frequenti
CREATE INDEX IF NOT EXISTS idx_devices_organization_status ON devices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_devices_location ON devices(latitude, longitude) WHERE latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commands_device_status ON device_commands(device_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commands_pending ON device_commands(status, scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_store_configs_org ON store_configs(organization_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_setup_tokens_valid ON setup_tokens(token, expires_at) WHERE used = false;

CREATE INDEX IF NOT EXISTS idx_print_templates_org ON print_templates(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_print_templates_default ON print_templates(organization_id, is_default) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_app_repo_active ON app_repository(package_name, version_code DESC) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_activity_logs_device_time ON mdm_activity_logs(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_time ON mdm_activity_logs(organization_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_repository ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy per admin - accesso completo a tutto
CREATE POLICY "Admin full access devices" ON devices FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy per organization users - solo dispositivi della loro org
CREATE POLICY "Organization users access devices" ON devices FOR ALL USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager', 'cashier')
  )
);

-- Policy comandi per admin
CREATE POLICY "Admin full access commands" ON device_commands FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy comandi per org users
CREATE POLICY "Organization users access commands" ON device_commands FOR ALL USING (
  device_id IN (
    SELECT d.id FROM devices d
    JOIN organization_users ou ON d.organization_id = ou.org_id
    WHERE ou.user_id = auth.uid()
  )
);

-- Policy store configs per admin
CREATE POLICY "Admin full access store_configs" ON store_configs FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy store configs per org users
CREATE POLICY "Organization users access store_configs" ON store_configs FOR ALL USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager')
  )
);

-- Policy setup tokens per admin
CREATE POLICY "Admin full access setup_tokens" ON setup_tokens FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy print templates per admin
CREATE POLICY "Admin full access print_templates" ON print_templates FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy print templates per org users
CREATE POLICY "Organization users access print_templates" ON print_templates FOR ALL USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager')
  )
);
-- Policy app repository - tutti possono leggere, solo admin può scrivere
CREATE POLICY "All users read app_repository" ON app_repository FOR SELECT USING (true);

CREATE POLICY "Admin insert app_repository" ON app_repository FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

CREATE POLICY "Admin update app_repository" ON app_repository FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

CREATE POLICY "Admin delete app_repository" ON app_repository FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy activity logs per admin
CREATE POLICY "Admin full access activity_logs" ON mdm_activity_logs FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy activity logs per org users - solo loro org
CREATE POLICY "Organization users access activity_logs" ON mdm_activity_logs FOR SELECT USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- TRIGGER PER AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Funzione per auto-update di updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per auto-update
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_commands_updated_at BEFORE UPDATE ON device_commands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_configs_updated_at BEFORE UPDATE ON store_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_templates_updated_at BEFORE UPDATE ON print_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_repository_updated_at BEFORE UPDATE ON app_repository
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATI DI TEST (OPZIONALI)
-- ============================================================================

-- Store config di esempio
INSERT INTO store_configs (store_name, organization_id, wifi_ssid, wifi_password, store_code)
SELECT
  'Negozio Demo',
  id,
  'WiFi-Demo-Store',
  'demo123!',
  'DEMO'
FROM organizations
WHERE name LIKE '%Demo%'
LIMIT 1
ON CONFLICT (store_name, organization_id) DO NOTHING;

-- App bridge di base nel repository
INSERT INTO app_repository (
  app_name,
  package_name,
  version_name,
  version_code,
  apk_url,
  description,
  uploaded_by
) VALUES (
  'OMNILY Bridge POS',
  'com.omnily.bridge',
  '1.0.0',
  100,
  'https://your-supabase-storage.com/apks/omnily-bridge-v1.0.0.apk',
  'App bridge principale per controllo POS e fidelity program',
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (package_name, version_code) DO NOTHING;

-- ============================================================================
-- FINE SCHEMA MDM
-- ============================================================================