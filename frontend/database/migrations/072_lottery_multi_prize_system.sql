-- =====================================================
-- LOTTERY MULTI-PRIZE SYSTEM
-- Migration 072: Add support for multiple prizes per lottery event
-- =====================================================

-- =====================================================
-- 1. CREATE lottery_prizes TABLE
-- =====================================================
-- This table stores multiple prizes for each lottery event
-- Each prize has a rank (1st, 2nd, 3rd place, etc.)

CREATE TABLE IF NOT EXISTS lottery_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES lottery_events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Prize Details
  rank INTEGER NOT NULL CHECK (rank > 0),
  prize_name VARCHAR(255) NOT NULL,
  prize_value DECIMAL(10, 2),
  prize_description TEXT,

  -- Extraction Status
  is_extracted BOOLEAN DEFAULT false,
  extracted_at TIMESTAMPTZ,
  winning_ticket_id UUID REFERENCES lottery_tickets(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_prize_rank_per_event UNIQUE (event_id, rank)
);

-- Index for faster queries
CREATE INDEX idx_lottery_prizes_event_id ON lottery_prizes(event_id);
CREATE INDEX idx_lottery_prizes_organization_id ON lottery_prizes(organization_id);
CREATE INDEX idx_lottery_prizes_rank ON lottery_prizes(event_id, rank);

-- Comments
COMMENT ON TABLE lottery_prizes IS 'Multiple prizes for lottery events (1st, 2nd, 3rd place, etc.)';
COMMENT ON COLUMN lottery_prizes.rank IS 'Prize ranking: 1 = first prize, 2 = second prize, etc.';
COMMENT ON COLUMN lottery_prizes.is_extracted IS 'Whether this prize has been drawn';
COMMENT ON COLUMN lottery_prizes.winning_ticket_id IS 'The ticket that won this prize';

-- =====================================================
-- 2. ALTER lottery_tickets TABLE
-- =====================================================
-- Add columns to track which prize a ticket won

ALTER TABLE lottery_tickets
ADD COLUMN IF NOT EXISTS prize_id UUID REFERENCES lottery_prizes(id) ON DELETE SET NULL;

ALTER TABLE lottery_tickets
ADD COLUMN IF NOT EXISTS prize_rank INTEGER;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_lottery_tickets_prize_id ON lottery_tickets(prize_id);

-- Comments
COMMENT ON COLUMN lottery_tickets.prize_id IS 'Reference to the prize this ticket won (if winner)';
COMMENT ON COLUMN lottery_tickets.prize_rank IS 'Rank of the prize won (1 = first, 2 = second, etc.)';

-- =====================================================
-- 3. ALTER lottery_events TABLE
-- =====================================================
-- Add columns to track multiple prizes

ALTER TABLE lottery_events
ADD COLUMN IF NOT EXISTS total_prizes INTEGER DEFAULT 1 CHECK (total_prizes > 0);

ALTER TABLE lottery_events
ADD COLUMN IF NOT EXISTS prizes_extracted INTEGER DEFAULT 0 CHECK (prizes_extracted >= 0);

-- Comments
COMMENT ON COLUMN lottery_events.total_prizes IS 'Total number of prizes for this event';
COMMENT ON COLUMN lottery_events.prizes_extracted IS 'Number of prizes already extracted';

-- =====================================================
-- 4. ALTER lottery_extractions TABLE
-- =====================================================
-- Add columns to track which prize was extracted

ALTER TABLE lottery_extractions
ADD COLUMN IF NOT EXISTS prize_id UUID REFERENCES lottery_prizes(id) ON DELETE SET NULL;

ALTER TABLE lottery_extractions
ADD COLUMN IF NOT EXISTS prize_rank INTEGER;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_lottery_extractions_prize_id ON lottery_extractions(prize_id);

-- Comments
COMMENT ON COLUMN lottery_extractions.prize_id IS 'The prize that was extracted';
COMMENT ON COLUMN lottery_extractions.prize_rank IS 'Rank of the prize extracted';

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE lottery_prizes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view prizes for their organization" ON lottery_prizes;
DROP POLICY IF EXISTS "Staff can insert prizes" ON lottery_prizes;
DROP POLICY IF EXISTS "Staff can update prizes" ON lottery_prizes;
DROP POLICY IF EXISTS "Staff can delete prizes" ON lottery_prizes;

-- View Policy: Users can view prizes for their organization
CREATE POLICY "Users can view prizes for their organization"
ON lottery_prizes FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_users
    WHERE user_id = auth.uid()
  )
);

-- Insert Policy: Staff can insert prizes
CREATE POLICY "Staff can insert prizes"
ON lottery_prizes FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
  )
);

-- Update Policy: Staff can update prizes
CREATE POLICY "Staff can update prizes"
ON lottery_prizes FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
  )
);

-- Delete Policy: Staff can delete prizes
CREATE POLICY "Staff can delete prizes"
ON lottery_prizes FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
  )
);

-- =====================================================
-- 6. TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_lottery_prizes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lottery_prizes_updated_at ON lottery_prizes;

CREATE TRIGGER lottery_prizes_updated_at
BEFORE UPDATE ON lottery_prizes
FOR EACH ROW
EXECUTE FUNCTION update_lottery_prizes_updated_at();

-- =====================================================
-- 7. FUNCTION TO MIGRATE EXISTING EVENTS
-- =====================================================
-- This function migrates existing single-prize events to the new multi-prize system

CREATE OR REPLACE FUNCTION migrate_existing_lottery_events_to_multi_prize()
RETURNS void AS $$
DECLARE
  event_record RECORD;
BEGIN
  -- For each event with a prize_name, create a corresponding prize entry
  FOR event_record IN
    SELECT id, organization_id, prize_name, prize_value, prize_description, extracted_at
    FROM lottery_events
    WHERE prize_name IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM lottery_prizes WHERE event_id = lottery_events.id
    )
  LOOP
    -- Insert prize record
    INSERT INTO lottery_prizes (
      event_id,
      organization_id,
      rank,
      prize_name,
      prize_value,
      prize_description,
      is_extracted,
      extracted_at
    ) VALUES (
      event_record.id,
      event_record.organization_id,
      1, -- First prize
      event_record.prize_name,
      event_record.prize_value,
      event_record.prize_description,
      event_record.extracted_at IS NOT NULL,
      event_record.extracted_at
    );

    -- Update event to reflect 1 total prize
    UPDATE lottery_events
    SET
      total_prizes = 1,
      prizes_extracted = CASE WHEN event_record.extracted_at IS NOT NULL THEN 1 ELSE 0 END
    WHERE id = event_record.id;

    -- If there's a winner ticket, link it to the prize
    UPDATE lottery_tickets
    SET
      prize_id = (SELECT id FROM lottery_prizes WHERE event_id = event_record.id AND rank = 1),
      prize_rank = 1
    WHERE event_id = event_record.id AND is_winner = true;

  END LOOP;

  RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_existing_lottery_events_to_multi_prize();

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to get available prizes (not yet extracted) for an event
CREATE OR REPLACE FUNCTION get_available_prizes_for_event(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  rank INTEGER,
  prize_name VARCHAR(255),
  prize_value DECIMAL(10, 2),
  prize_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.rank,
    p.prize_name,
    p.prize_value,
    p.prize_description
  FROM lottery_prizes p
  WHERE p.event_id = p_event_id
  AND p.is_extracted = false
  ORDER BY p.rank ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all winners for an event with their prizes
CREATE OR REPLACE FUNCTION get_event_winners_with_prizes(p_event_id UUID)
RETURNS TABLE (
  ticket_number VARCHAR(20),
  customer_name VARCHAR(255),
  prize_rank INTEGER,
  prize_name VARCHAR(255),
  prize_value DECIMAL(10, 2),
  won_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.ticket_number,
    t.customer_name,
    p.rank,
    p.prize_name,
    p.prize_value,
    t.won_at
  FROM lottery_tickets t
  JOIN lottery_prizes p ON t.prize_id = p.id
  WHERE t.event_id = p_event_id
  AND t.is_winner = true
  ORDER BY p.rank ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_prizes_for_event IS 'Get all prizes that have not been extracted yet for an event';
COMMENT ON FUNCTION get_event_winners_with_prizes IS 'Get all winning tickets with their prize information for an event';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The lottery system now supports multiple prizes per event!
-- Each event can have multiple prizes (1st, 2nd, 3rd place, etc.)
-- Each extraction draws one prize at a time
-- Tickets track which prize they won via prize_id and prize_rank
