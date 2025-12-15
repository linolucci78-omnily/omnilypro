-- Migration: Create TV Devices Table for Pairing System
-- Description: Allows TV displays to be paired with organizations using a PIN code
-- Similar to XOGO device pairing system

-- Create tv_devices table
CREATE TABLE IF NOT EXISTS tv_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code VARCHAR(10) UNIQUE NOT NULL,  -- Pairing code (e.g., "ABC-123")
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    device_name VARCHAR(255),  -- Optional friendly name (e.g., "Display Ingresso")
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'inactive'
    last_seen TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),  -- Store device IP for monitoring
    user_agent TEXT,  -- Browser/device info
    paired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_tv_devices_device_code ON tv_devices(device_code);
CREATE INDEX idx_tv_devices_organization_id ON tv_devices(organization_id);
CREATE INDEX idx_tv_devices_status ON tv_devices(status);

-- RLS Policies for tv_devices
ALTER TABLE tv_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view devices from their organization
CREATE POLICY "Users can view their organization's TV devices"
    ON tv_devices
    FOR SELECT
    USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Admins can insert new devices (generate pairing codes)
CREATE POLICY "Admins can create TV devices"
    ON tv_devices
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );

-- Policy: Admins can update their organization's devices
CREATE POLICY "Admins can update their organization's TV devices"
    ON tv_devices
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );

-- Policy: Admins can delete their organization's devices
CREATE POLICY "Admins can delete their organization's TV devices"
    ON tv_devices
    FOR DELETE
    USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );

-- Policy: Allow anonymous access to pair devices (read-only for pairing screen)
CREATE POLICY "Anonymous can read pending devices for pairing"
    ON tv_devices
    FOR SELECT
    USING (status = 'pending');

-- Policy: Allow anonymous update for pairing (heartbeat/last_seen)
CREATE POLICY "Anonymous can update device heartbeat"
    ON tv_devices
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Function to generate unique device code
CREATE OR REPLACE FUNCTION generate_device_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Exclude similar chars (I, O, 1, 0)
    result VARCHAR(10) := '';
    i INTEGER;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        -- Generate format: ABC-123 (3 letters + dash + 3 numbers)
        FOR i IN 1..3 LOOP
            result := result || substr(chars, floor(random() * 24 + 1)::int, 1);
        END LOOP;
        result := result || '-';
        FOR i IN 1..3 LOOP
            result := result || substr('23456789', floor(random() * 8 + 1)::int, 1);
        END LOOP;

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM tv_devices WHERE device_code = result) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new unpaired device
CREATE OR REPLACE FUNCTION create_unpaired_device()
RETURNS TABLE(device_id UUID, device_code VARCHAR(10)) AS $$
DECLARE
    new_code VARCHAR(10);
    new_id UUID;
BEGIN
    new_code := generate_device_code();

    INSERT INTO tv_devices (device_code, status)
    VALUES (new_code, 'pending')
    RETURNING id INTO new_id;

    RETURN QUERY SELECT new_id, new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to pair a device with an organization
CREATE OR REPLACE FUNCTION pair_device(
    p_device_code VARCHAR(10),
    p_organization_id UUID,
    p_device_name VARCHAR(255) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    device_exists BOOLEAN;
BEGIN
    -- Check if device exists and is pending
    SELECT EXISTS(
        SELECT 1 FROM tv_devices
        WHERE device_code = p_device_code
        AND status = 'pending'
    ) INTO device_exists;

    IF NOT device_exists THEN
        RETURN FALSE;
    END IF;

    -- Update device with organization
    UPDATE tv_devices
    SET
        organization_id = p_organization_id,
        device_name = COALESCE(p_device_name, 'TV Display'),
        status = 'active',
        paired_at = NOW(),
        updated_at = NOW()
    WHERE device_code = p_device_code;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update device heartbeat (last seen)
CREATE OR REPLACE FUNCTION update_device_heartbeat(
    p_device_code VARCHAR(10),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tv_devices
    SET
        last_seen = NOW(),
        ip_address = COALESCE(p_ip_address, ip_address),
        user_agent = COALESCE(p_user_agent, user_agent),
        updated_at = NOW()
    WHERE device_code = p_device_code;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tv_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tv_devices_updated_at
    BEFORE UPDATE ON tv_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_tv_devices_updated_at();

-- Comments
COMMENT ON TABLE tv_devices IS 'TV display devices for digital signage, paired with organizations using PIN codes';
COMMENT ON COLUMN tv_devices.device_code IS 'Unique pairing code shown on unpaired devices (e.g., ABC-123)';
COMMENT ON COLUMN tv_devices.status IS 'Device status: pending (unpaired), active (paired and working), inactive (disabled)';
COMMENT ON COLUMN tv_devices.last_seen IS 'Last heartbeat timestamp from the device';
COMMENT ON FUNCTION generate_device_code() IS 'Generates a unique 6-character pairing code (ABC-123 format)';
COMMENT ON FUNCTION pair_device(VARCHAR, UUID, VARCHAR) IS 'Pairs a pending device with an organization using the pairing code';
COMMENT ON FUNCTION update_device_heartbeat(VARCHAR, VARCHAR, TEXT) IS 'Updates device last seen timestamp and optional metadata';
