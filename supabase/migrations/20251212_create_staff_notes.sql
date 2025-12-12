-- Create staff_notes table for internal communication
-- Note tra operatori e note per clienti specifici

CREATE TABLE IF NOT EXISTS staff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tipo nota
  note_type TEXT NOT NULL CHECK (note_type IN ('general', 'customer', 'reminder', 'alert')),

  -- Cliente (opzionale - solo se note_type = 'customer')
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Contenuto
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Priorità e stato
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'read', 'archived', 'completed')),

  -- Popup automatico
  show_popup BOOLEAN DEFAULT false,
  popup_shown BOOLEAN DEFAULT false,
  popup_shown_at TIMESTAMPTZ,

  -- Staff member che ha creato la nota
  created_by_staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_staff_notes_organization ON staff_notes(organization_id);
CREATE INDEX idx_staff_notes_customer ON staff_notes(customer_id);
CREATE INDEX idx_staff_notes_status ON staff_notes(status);
CREATE INDEX idx_staff_notes_priority ON staff_notes(priority);
CREATE INDEX idx_staff_notes_created_at ON staff_notes(created_at DESC);

-- RLS Policies
ALTER TABLE staff_notes ENABLE ROW LEVEL SECURITY;

-- Staff può vedere note della propria organizzazione
CREATE POLICY "Staff can view their organization notes"
ON staff_notes
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM staff_members
    WHERE user_id = auth.uid()
  )
);

-- Staff può creare note per la propria organizzazione
CREATE POLICY "Staff can create notes for their organization"
ON staff_notes
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM staff_members
    WHERE user_id = auth.uid()
  )
);

-- Staff può aggiornare note della propria organizzazione
CREATE POLICY "Staff can update their organization notes"
ON staff_notes
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM staff_members
    WHERE user_id = auth.uid()
  )
);

-- Staff può eliminare note della propria organizzazione
CREATE POLICY "Staff can delete their organization notes"
ON staff_notes
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM staff_members
    WHERE user_id = auth.uid()
  )
);

-- Service role ha accesso completo
CREATE POLICY "Service role has full access to staff_notes"
ON staff_notes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_staff_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_staff_notes_updated_at
BEFORE UPDATE ON staff_notes
FOR EACH ROW
EXECUTE FUNCTION update_staff_notes_updated_at();

-- Commenti
COMMENT ON TABLE staff_notes IS 'Note interne dello staff - comunicazioni tra operatori e promemoria per clienti';
COMMENT ON COLUMN staff_notes.note_type IS 'Tipo di nota: general (per tutti), customer (specifico cliente), reminder (promemoria), alert (urgente)';
COMMENT ON COLUMN staff_notes.show_popup IS 'Se true, mostra un popup automatico quando si apre il cliente';
COMMENT ON COLUMN staff_notes.popup_shown IS 'Indica se il popup è già stato mostrato';
COMMENT ON COLUMN staff_notes.priority IS 'Priorità: low, normal, high, urgent';
COMMENT ON COLUMN staff_notes.status IS 'Stato: active (attiva), read (letta), archived (archiviata), completed (completata)';
