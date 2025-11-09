-- =====================================================
-- Migration 018: Support Tickets System
-- Crea tabella support_tickets per gestire richieste assistenza
-- =====================================================

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.support_tickets;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
DROP TRIGGER IF EXISTS update_ticket_messages_updated_at ON public.ticket_messages;
DROP FUNCTION IF EXISTS generate_ticket_number();
DROP FUNCTION IF EXISTS set_ticket_number();
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

  -- Ticket info
  ticket_number TEXT NOT NULL UNIQUE, -- ES: TKT-2024-001234
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- general, technical, billing, feature_request
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, waiting_reply, resolved, closed

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tracking
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[], -- array di tag per categorizzazione
  attachments JSONB DEFAULT '[]'::jsonb, -- array di file allegati
  metadata JSONB DEFAULT '{}'::jsonb, -- info extra

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ticket_messages table for conversations
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_type TEXT NOT NULL, -- 'customer', 'staff', 'system'

  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT FALSE, -- note interne non visibili al cliente

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_support_tickets_org_id ON public.support_tickets(organization_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX idx_support_tickets_customer_id ON public.support_tickets(customer_id);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);

CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created_at ON public.ticket_messages(created_at DESC);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INTEGER;
  ticket_num TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(ticket_number FROM 'TKT-' || year_prefix || '-(\d+)')
      AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM public.support_tickets
  WHERE ticket_number LIKE 'TKT-' || year_prefix || '-%';

  -- Format: TKT-2024-001234
  ticket_num := 'TKT-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');

  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger to update updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_messages_updated_at
  BEFORE UPDATE ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Support Tickets Policies

-- Super admin can see all tickets
CREATE POLICY "Super admin can view all support tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Organization managers/staff can see their org tickets
CREATE POLICY "Managers can view org support tickets"
  ON public.support_tickets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'staff')
    )
  );

-- Users who created tickets can view them
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (
    created_by = auth.uid()
  );

-- Managers and staff can create tickets for their org
CREATE POLICY "Managers can create support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'staff')
    )
  );

-- Authenticated users can create tickets
CREATE POLICY "Users can create support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
  );

-- Managers can update tickets in their org
CREATE POLICY "Managers can update support tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'staff')
    )
  );

-- Super admin can update any ticket
CREATE POLICY "Super admin can update support tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Ticket Messages Policies

-- Users can view messages for tickets they can see
CREATE POLICY "Users can view ticket messages"
  ON public.ticket_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE (
        -- Same RLS rules as support_tickets
        created_by = auth.uid()
        OR organization_id IN (
          SELECT organization_id FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('manager', 'staff')
        )
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = 'super_admin'
        )
      )
    )
    -- Hide internal messages from customers
    AND (
      is_internal = FALSE
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('manager', 'staff', 'super_admin')
      )
    )
  );

-- Users can create messages for tickets they can access
CREATE POLICY "Users can create ticket messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE (
        created_by = auth.uid()
        OR organization_id IN (
          SELECT organization_id FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('manager', 'staff')
        )
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = 'super_admin'
        )
      )
    )
  );

-- Staff can update their own messages
CREATE POLICY "Staff can update ticket messages"
  ON public.ticket_messages FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'staff', 'super_admin')
    )
  );

-- Grant permissions
GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.ticket_messages TO authenticated;

-- Add comments
COMMENT ON TABLE public.support_tickets IS 'Sistema di ticketing per supporto clienti';
COMMENT ON TABLE public.ticket_messages IS 'Messaggi e conversazioni dei ticket';
COMMENT ON COLUMN public.support_tickets.ticket_number IS 'Numero ticket univoco formato TKT-YYYY-NNNNNN';
COMMENT ON COLUMN public.support_tickets.status IS 'Stati: open, in_progress, waiting_reply, resolved, closed';
COMMENT ON COLUMN public.support_tickets.priority IS 'Priorità: low, medium, high, urgent';
COMMENT ON COLUMN public.support_tickets.category IS 'Categoria: general, technical, billing, feature_request';
