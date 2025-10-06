-- ============================================================================
-- MIGRATION 019: Verifica e Creazione Tabelle MDM
-- Descrizione: Verifica esistenza tabelle MDM e le crea se mancano
-- ============================================================================

-- Verifica e crea tabella devices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices') THEN
        RAISE NOTICE 'Creating table: devices';

        CREATE TABLE devices (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name varchar(100) NOT NULL,
          android_id varchar(100) UNIQUE,
          device_model varchar(50),
          serial_number varchar(100),
          organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
          store_location varchar(100),
          store_address text,
          status varchar(20) DEFAULT 'offline',
          last_seen timestamp DEFAULT now(),
          last_ip_address inet,
          wifi_ssid varchar(100),
          wifi_signal_strength integer,
          battery_level integer,
          storage_free_gb decimal(5,2),
          ram_free_gb decimal(5,2),
          cpu_usage_percent integer,
          current_app_package varchar(100),
          kiosk_mode_active boolean DEFAULT false,
          kiosk_allowed_apps text[],
          latitude decimal(10,8),
          longitude decimal(11,8),
          location_accuracy_meters integer,
          location_updated_at timestamp,
          language varchar(10) DEFAULT 'it_IT',
          timezone varchar(50) DEFAULT 'Europe/Rome',
          auto_updates_enabled boolean DEFAULT true,
          heartbeat_interval_seconds integer DEFAULT 30,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now(),
          CONSTRAINT devices_name_org_unique UNIQUE (name, organization_id)
        );

        CREATE INDEX idx_devices_organization_status ON devices(organization_id, status);
        CREATE INDEX idx_devices_last_seen ON devices(last_seen DESC);
    ELSE
        RAISE NOTICE 'Table devices already exists';
    END IF;
END $$;

-- Verifica e crea tabella device_commands
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_commands') THEN
        RAISE NOTICE 'Creating table: device_commands';

        CREATE TABLE device_commands (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
          issued_by uuid REFERENCES auth.users(id),
          command_type varchar(50) NOT NULL,
          command_title varchar(100),
          payload jsonb,
          status varchar(20) DEFAULT 'pending',
          scheduled_for timestamp,
          started_at timestamp,
          completed_at timestamp,
          result_data jsonb,
          error_message text,
          execution_duration_ms integer,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );

        CREATE INDEX idx_commands_device_status ON device_commands(device_id, status, created_at DESC);
        CREATE INDEX idx_commands_pending ON device_commands(status, scheduled_for) WHERE status = 'pending';
    ELSE
        RAISE NOTICE 'Table device_commands already exists';
    END IF;
END $$;

-- Verifica e crea tabella store_configs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_configs') THEN
        RAISE NOTICE 'Creating table: store_configs';

        CREATE TABLE store_configs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          store_name varchar(100) NOT NULL,
          organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
          store_code varchar(20),
          wifi_ssid varchar(100),
          wifi_password varchar(100),
          wifi_security_type varchar(20),
          backup_wifi_ssid varchar(100),
          backup_wifi_password varchar(100),
          default_language varchar(10) DEFAULT 'it_IT',
          default_timezone varchar(50) DEFAULT 'Europe/Rome',
          default_volume_level integer DEFAULT 70,
          screen_brightness integer DEFAULT 80,
          screen_timeout_minutes integer DEFAULT 15,
          pos_settings jsonb DEFAULT '{}',
          kiosk_default_app varchar(100),
          kiosk_auto_start boolean DEFAULT true,
          main_app_package varchar(100) DEFAULT 'com.omnily.bridge',
          allowed_apps text[],
          opening_hours jsonb,
          auto_shutdown_enabled boolean DEFAULT false,
          shutdown_time time,
          startup_time time,
          is_active boolean DEFAULT true,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now(),
          CONSTRAINT store_configs_name_org_unique UNIQUE (store_name, organization_id)
        );

        CREATE INDEX idx_store_configs_org ON store_configs(organization_id) WHERE is_active = true;
    ELSE
        RAISE NOTICE 'Table store_configs already exists';
    END IF;
END $$;

-- Verifica e crea tabella setup_tokens
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'setup_tokens') THEN
        RAISE NOTICE 'Creating table: setup_tokens';

        CREATE TABLE setup_tokens (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          token varchar(255) UNIQUE NOT NULL,
          device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
          store_config_id uuid REFERENCES store_configs(id),
          expires_at timestamp NOT NULL,
          max_uses integer DEFAULT 1,
          current_uses integer DEFAULT 0,
          used boolean DEFAULT false,
          setup_data jsonb,
          qr_code_generated boolean DEFAULT false,
          qr_code_url text,
          generated_by uuid REFERENCES auth.users(id),
          used_by_device_info jsonb,
          used_at timestamp,
          created_at timestamp DEFAULT now()
        );

        CREATE INDEX idx_setup_tokens_valid ON setup_tokens(token, expires_at) WHERE used = false;
    ELSE
        RAISE NOTICE 'Table setup_tokens already exists';
    END IF;
END $$;

-- Verifica e crea tabella app_repository
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_repository') THEN
        RAISE NOTICE 'Creating table: app_repository';

        CREATE TABLE app_repository (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          app_name varchar(100) NOT NULL,
          package_name varchar(100) NOT NULL,
          version_name varchar(20) NOT NULL,
          version_code integer NOT NULL,
          apk_url text NOT NULL,
          apk_size_mb decimal(6,2),
          apk_hash_sha256 varchar(64),
          description text,
          changelog text,
          min_android_version integer,
          required_permissions text[],
          is_active boolean DEFAULT true,
          is_mandatory boolean DEFAULT false,
          rollout_percentage integer DEFAULT 100,
          target_device_models text[],
          upload_date timestamp DEFAULT now(),
          uploaded_by uuid REFERENCES auth.users(id),
          install_count integer DEFAULT 0,
          success_rate_percent decimal(5,2),
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now(),
          CONSTRAINT app_repo_package_version_unique UNIQUE (package_name, version_code)
        );

        CREATE INDEX idx_app_repo_active ON app_repository(package_name, version_code DESC) WHERE is_active = true;
    ELSE
        RAISE NOTICE 'Table app_repository already exists';
    END IF;
END $$;

-- Verifica e crea tabella print_templates (se non esiste già)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'print_templates') THEN
        RAISE NOTICE 'Creating table: print_templates';

        CREATE TABLE print_templates (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name varchar(100) NOT NULL,
          organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
          store_name varchar(100) NOT NULL,
          store_address text,
          store_phone varchar(50),
          store_tax varchar(20),
          logo_base64 text,
          paper_width integer DEFAULT 384,
          font_size_normal integer DEFAULT 24,
          font_size_large integer DEFAULT 32,
          print_density integer DEFAULT 3,
          is_default boolean DEFAULT false,
          is_active boolean DEFAULT true,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now(),
          CONSTRAINT print_templates_name_org_unique UNIQUE (name, organization_id)
        );

        CREATE INDEX idx_print_templates_org ON print_templates(organization_id) WHERE is_active = true;
        CREATE INDEX idx_print_templates_default ON print_templates(organization_id, is_default) WHERE is_active = true;
    ELSE
        RAISE NOTICE 'Table print_templates already exists';
    END IF;
END $$;

-- Verifica e crea tabella mdm_activity_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mdm_activity_logs') THEN
        RAISE NOTICE 'Creating table: mdm_activity_logs';

        CREATE TABLE mdm_activity_logs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
          user_id uuid REFERENCES auth.users(id),
          organization_id uuid REFERENCES organizations(id),
          activity_type varchar(50) NOT NULL,
          activity_title varchar(200),
          activity_description text,
          activity_data jsonb,
          success boolean,
          error_details text,
          ip_address inet,
          user_agent text,
          created_at timestamp DEFAULT now()
        );

        CREATE INDEX idx_activity_logs_device_time ON mdm_activity_logs(device_id, created_at DESC);
        CREATE INDEX idx_activity_logs_org_time ON mdm_activity_logs(organization_id, created_at DESC);
    ELSE
        RAISE NOTICE 'Table mdm_activity_logs already exists';
    END IF;
END $$;

-- Abilita RLS sulle tabelle MDM
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_repository ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy devices per super admin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'devices'
        AND policyname = 'Super admin full access devices'
    ) THEN
        CREATE POLICY "Super admin full access devices" ON devices FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM organization_users WHERE role = 'super_admin'
          )
        );
    END IF;
END $$;

-- Policy devices per organization users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'devices'
        AND policyname = 'Organization users access devices'
    ) THEN
        CREATE POLICY "Organization users access devices" ON devices FOR ALL USING (
          organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
          )
        );
    END IF;
END $$;

-- Policy app_repository - tutti possono leggere
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'app_repository'
        AND policyname = 'All users read app_repository'
    ) THEN
        CREATE POLICY "All users read app_repository" ON app_repository FOR SELECT USING (true);
    END IF;
END $$;

-- Policy app_repository - solo admin può scrivere
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'app_repository'
        AND policyname = 'Super admin write app_repository'
    ) THEN
        CREATE POLICY "Super admin write app_repository" ON app_repository FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM organization_users WHERE role = 'super_admin'
          )
        );
    END IF;
END $$;

-- Policy activity logs per super admin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'mdm_activity_logs'
        AND policyname = 'Super admin full access activity_logs'
    ) THEN
        CREATE POLICY "Super admin full access activity_logs" ON mdm_activity_logs FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM organization_users WHERE role = 'super_admin'
          )
        );
    END IF;
END $$;

-- Trigger per auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger alle tabelle se non esistono già
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_devices_updated_at') THEN
        CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_device_commands_updated_at') THEN
        CREATE TRIGGER update_device_commands_updated_at BEFORE UPDATE ON device_commands
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_store_configs_updated_at') THEN
        CREATE TRIGGER update_store_configs_updated_at BEFORE UPDATE ON store_configs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_app_repository_updated_at') THEN
        CREATE TRIGGER update_app_repository_updated_at BEFORE UPDATE ON app_repository
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_print_templates_updated_at') THEN
        CREATE TRIGGER update_print_templates_updated_at BEFORE UPDATE ON print_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Fine migration
