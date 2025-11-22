-- =====================================================
-- Migration 071: Lottery Remote Control
-- =====================================================
-- Descrizione: Sistema per controllare display estrazione dal POS
-- Usa Supabase Realtime per comunicazione real-time
-- =====================================================

-- =====================================================
-- LOTTERY COMMANDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lottery_extraction_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.lottery_events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Command
  command VARCHAR(50) NOT NULL,
  -- Possible values: 'START_EXTRACTION', 'PAUSE', 'RESUME', 'RESET'

  -- Metadata
  issued_by_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_staff_name VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  -- Possible values: 'pending', 'processing', 'completed', 'failed'

  executed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_command CHECK (command IN ('START_EXTRACTION', 'PAUSE', 'RESUME', 'RESET')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes
CREATE INDEX idx_lottery_commands_event ON public.lottery_extraction_commands(event_id);
CREATE INDEX idx_lottery_commands_org ON public.lottery_extraction_commands(organization_id);
CREATE INDEX idx_lottery_commands_status ON public.lottery_extraction_commands(status);
CREATE INDEX idx_lottery_commands_created ON public.lottery_extraction_commands(created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.lottery_extraction_commands ENABLE ROW LEVEL SECURITY;

-- Users can view commands from their organizations
CREATE POLICY "Users can view commands from their organizations"
  ON public.lottery_extraction_commands FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

-- Staff can create commands
CREATE POLICY "Staff can create commands"
  ON public.lottery_extraction_commands FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid()
      AND org_id = organization_id
    )
  );

-- Staff can update their own commands
CREATE POLICY "Staff can update commands"
  ON public.lottery_extraction_commands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid()
      AND org_id = organization_id
    )
  );

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

-- Enable realtime for this table so changes are broadcast instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.lottery_extraction_commands;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.lottery_extraction_commands IS 'Comandi per controllare display estrazione da remoto';
COMMENT ON COLUMN public.lottery_extraction_commands.command IS 'Tipo di comando: START_EXTRACTION, PAUSE, RESUME, RESET';
COMMENT ON COLUMN public.lottery_extraction_commands.status IS 'Stato comando: pending, processing, completed, failed';
