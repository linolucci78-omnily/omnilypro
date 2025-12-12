-- Migration: Add recipients system to staff notes
-- Created: 2024-12-12
-- Purpose: Allow notes to be sent to multiple staff members and/or customers

-- Create recipients table
CREATE TABLE IF NOT EXISTS staff_note_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES staff_notes(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('staff', 'customer', 'all_staff')),
  recipient_staff_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  recipient_customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  has_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: must have either staff_id or customer_id or be all_staff
  CONSTRAINT recipient_must_have_target CHECK (
    (recipient_type = 'all_staff') OR
    (recipient_type = 'staff' AND recipient_staff_id IS NOT NULL) OR
    (recipient_type = 'customer' AND recipient_customer_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_staff_note_recipients_note_id ON staff_note_recipients(note_id);
CREATE INDEX idx_staff_note_recipients_staff_id ON staff_note_recipients(recipient_staff_id);
CREATE INDEX idx_staff_note_recipients_customer_id ON staff_note_recipients(recipient_customer_id);
CREATE INDEX idx_staff_note_recipients_has_read ON staff_note_recipients(has_read);

-- RLS Policies
ALTER TABLE staff_note_recipients ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view recipients
CREATE POLICY "Authenticated users can view note recipients"
ON staff_note_recipients FOR SELECT TO authenticated USING (true);

-- Authenticated users can create recipients
CREATE POLICY "Authenticated users can create note recipients"
ON staff_note_recipients FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update recipients (for marking as read)
CREATE POLICY "Authenticated users can update note recipients"
ON staff_note_recipients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users can delete recipients
CREATE POLICY "Authenticated users can delete note recipients"
ON staff_note_recipients FOR DELETE TO authenticated USING (true);

-- Add column to staff_notes to track if note is broadcast
ALTER TABLE staff_notes ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT false;

-- Comment
COMMENT ON TABLE staff_note_recipients IS 'Recipients for staff notes - supports multiple staff members, customers, or broadcast to all staff';
