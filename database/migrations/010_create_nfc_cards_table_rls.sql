-- Migration: Create NFC Cards Table with RLS
-- Date: 2025-09-23
-- Description: Create nfc_cards table with proper RLS policies for fidelity system

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS nfc_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- NFC card data
    uid VARCHAR(255) NOT NULL, -- NFC card UID
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

    -- Assignment tracking
    assigned_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Unique constraint: UID must be unique per organization
    UNIQUE(organization_id, uid)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nfc_cards_organization_id ON nfc_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_uid ON nfc_cards(uid);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_customer_id ON nfc_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_active ON nfc_cards(is_active);

-- Enable Row Level Security
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view cards from their organizations" ON nfc_cards;
DROP POLICY IF EXISTS "Users can insert cards to their organizations" ON nfc_cards;
DROP POLICY IF EXISTS "Users can update cards from their organizations" ON nfc_cards;
DROP POLICY IF EXISTS "Users can delete cards from their organizations" ON nfc_cards;

-- Create RLS policies for fidelity system

-- Allow reading NFC cards for active organizations
CREATE POLICY "Fidelity system read nfc_cards" ON nfc_cards
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations
            WHERE is_active = true
        )
    );

-- Allow creating NFC cards for active organizations
CREATE POLICY "Fidelity system create nfc_cards" ON nfc_cards
    FOR INSERT WITH CHECK (
        organization_id IS NOT NULL
        AND
        organization_id IN (
            SELECT id FROM organizations
            WHERE is_active = true
        )
    );

-- Allow updating NFC cards (for assignment/unassignment)
CREATE POLICY "Fidelity system update nfc_cards" ON nfc_cards
    FOR UPDATE USING (
        organization_id IN (
            SELECT id FROM organizations
            WHERE is_active = true
        )
    );

-- Allow deleting NFC cards (for deactivation)
CREATE POLICY "Fidelity system delete nfc_cards" ON nfc_cards
    FOR DELETE USING (
        organization_id IN (
            SELECT id FROM organizations
            WHERE is_active = true
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_nfc_cards_updated_at ON nfc_cards;
CREATE TRIGGER update_nfc_cards_updated_at BEFORE UPDATE
    ON nfc_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE nfc_cards IS 'NFC Cards table for fidelity system with RLS policies 2025-09-23';