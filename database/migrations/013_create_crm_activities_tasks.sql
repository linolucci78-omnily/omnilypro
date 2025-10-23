-- CRM Activities, Tasks, and Appointments System
-- Professional CRM features like Salesforce/HubSpot

-- ============================================
-- 1. CRM ACTIVITIES (Log di tutte le interazioni)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'note', 'demo', 'proposal_sent', 'contract_signed'
  subject VARCHAR(255) NOT NULL,
  description TEXT,

  -- Timing
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER, -- Durata attività (es. chiamata di 15 min)

  -- Outcome (per chiamate/meeting)
  outcome VARCHAR(50), -- 'successful', 'no_answer', 'voicemail', 'rescheduled', 'cancelled'
  next_action TEXT, -- Cosa fare dopo

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_activities_lead ON crm_activities(lead_id);
CREATE INDEX idx_crm_activities_user ON crm_activities(user_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_date ON crm_activities(activity_date DESC);

-- ============================================
-- 2. CRM TASKS (Compiti da completare)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Task details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'follow_up', 'send_proposal', 'schedule_demo', 'other'
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'

  -- Timing
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reminder_date TIMESTAMPTZ, -- Per notifiche

  -- Relations
  related_activity_id UUID REFERENCES crm_activities(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_tasks_lead ON crm_tasks(lead_id);
CREATE INDEX idx_crm_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_priority ON crm_tasks(priority);

-- ============================================
-- 3. CRM APPOINTMENTS (Appuntamenti/Demo)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Appointment details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_type VARCHAR(50) NOT NULL, -- 'demo', 'meeting', 'call', 'presentation', 'negotiation', 'contract_signing'
  location VARCHAR(255), -- Indirizzo fisico o link Zoom/Meet

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Europe/Rome',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  reminder_sent BOOLEAN DEFAULT FALSE,

  -- Attendees (JSON array di email/nomi)
  attendees JSONB,

  -- Outcome (dopo l'appuntamento)
  outcome TEXT,
  notes TEXT,

  -- Integrations
  google_calendar_event_id VARCHAR(255),

  -- Related
  related_activity_id UUID REFERENCES crm_activities(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_appointments_lead ON crm_appointments(lead_id);
CREATE INDEX idx_crm_appointments_assigned ON crm_appointments(assigned_to);
CREATE INDEX idx_crm_appointments_start ON crm_appointments(start_time);
CREATE INDEX idx_crm_appointments_status ON crm_appointments(status);

-- ============================================
-- 4. CRM NOTES (Note interne)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Note content
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE, -- Note importanti fissate in alto

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_notes_lead ON crm_notes(lead_id);
CREATE INDEX idx_crm_notes_pinned ON crm_notes(is_pinned);

-- ============================================
-- 5. CRM DOCUMENTS (Documenti e file)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Document details
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100), -- 'contract', 'proposal', 'presentation', 'invoice', 'other'
  file_size INTEGER, -- bytes
  mime_type VARCHAR(100),

  -- Storage
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  download_url TEXT,

  -- Metadata
  description TEXT,
  tags TEXT[], -- Array di tag per ricerca

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_documents_lead ON crm_documents(lead_id);
CREATE INDEX idx_crm_documents_type ON crm_documents(file_type);

-- ============================================
-- 6. CRM EMAIL TEMPLATES (Template email)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template details
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  template_type VARCHAR(50), -- 'follow_up', 'proposal', 'demo_invite', 'thank_you', 'custom'

  -- Variables disponibili: {{company_name}}, {{contact_name}}, {{agent_name}}, etc.

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. VIEWS per Analytics
-- ============================================

-- View: Agent Performance
CREATE OR REPLACE VIEW crm_agent_performance AS
SELECT
  u.id as agent_id,
  u.full_name as agent_name,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.stage = 'won' THEN l.id END) as won_deals,
  SUM(CASE WHEN l.stage = 'won' THEN l.estimated_value ELSE 0 END) as total_revenue,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT a.id) as total_activities,
  COUNT(DISTINCT ap.id) as total_appointments
FROM users u
LEFT JOIN crm_leads l ON l.assigned_to = u.id
LEFT JOIN crm_tasks t ON t.assigned_to = u.id
LEFT JOIN crm_activities a ON a.user_id = u.id
LEFT JOIN crm_appointments ap ON ap.assigned_to = u.id
WHERE u.role IN ('sales_agent', 'admin')
GROUP BY u.id, u.full_name;

-- View: Upcoming Tasks (prossimi task)
CREATE OR REPLACE VIEW crm_upcoming_tasks AS
SELECT
  t.*,
  l.company_name,
  l.contact_name,
  u.full_name as assigned_to_name
FROM crm_tasks t
JOIN crm_leads l ON l.id = t.lead_id
LEFT JOIN users u ON u.id = t.assigned_to
WHERE t.status IN ('pending', 'in_progress')
  AND t.due_date IS NOT NULL
ORDER BY t.due_date ASC;

-- View: Today's Appointments
CREATE OR REPLACE VIEW crm_today_appointments AS
SELECT
  a.*,
  l.company_name,
  l.contact_name,
  u.full_name as assigned_to_name
FROM crm_appointments a
JOIN crm_leads l ON l.id = a.lead_id
LEFT JOIN users u ON u.id = a.assigned_to
WHERE DATE(a.start_time) = CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.start_time ASC;

-- ============================================
-- 8. TRIGGERS per automazioni
-- ============================================

-- Trigger: Crea task automatico quando lead cambia stage
CREATE OR REPLACE FUNCTION create_automatic_tasks_on_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando lead passa a "contacted" → crea task "Fissa demo"
  IF NEW.stage = 'contacted' AND OLD.stage != 'contacted' THEN
    INSERT INTO crm_tasks (lead_id, assigned_to, title, description, task_type, priority, due_date)
    VALUES (
      NEW.id,
      NEW.assigned_to,
      'Fissa appuntamento demo',
      'Contattare il cliente per fissare un appuntamento di dimostrazione del prodotto',
      'schedule_demo',
      'high',
      NOW() + INTERVAL '2 days'
    );
  END IF;

  -- Quando lead passa a "demo_scheduled" → crea task "Prepara demo"
  IF NEW.stage = 'demo_scheduled' AND OLD.stage != 'demo_scheduled' THEN
    INSERT INTO crm_tasks (lead_id, assigned_to, title, description, task_type, priority, due_date)
    VALUES (
      NEW.id,
      NEW.assigned_to,
      'Prepara materiale demo',
      'Preparare presentazione e materiale per la demo del cliente',
      'other',
      'high',
      NOW() + INTERVAL '1 day'
    );
  END IF;

  -- Quando lead passa a "demo_completed" → crea task "Invia proposta"
  IF NEW.stage = 'demo_completed' AND OLD.stage != 'demo_completed' THEN
    INSERT INTO crm_tasks (lead_id, assigned_to, title, description, task_type, priority, due_date)
    VALUES (
      NEW.id,
      NEW.assigned_to,
      'Invia proposta commerciale',
      'Preparare e inviare proposta commerciale personalizzata',
      'send_proposal',
      'high',
      NOW() + INTERVAL '1 day'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_automatic_tasks
  AFTER UPDATE ON crm_leads
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION create_automatic_tasks_on_stage_change();

-- Trigger: Log activity quando lead cambia stage
CREATE OR REPLACE FUNCTION log_stage_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO crm_activities (lead_id, user_id, activity_type, subject, description, activity_date)
  VALUES (
    NEW.id,
    NEW.assigned_to,
    'note',
    'Stage cambiato',
    format('Lead spostato da "%s" a "%s"', OLD.stage, NEW.stage),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_stage_change
  AFTER UPDATE ON crm_leads
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION log_stage_change_activity();

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Activities
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their organization's leads"
  ON crm_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_leads l
      JOIN organizations o ON o.id = l.organization_id
      JOIN users u ON u.organization_id = o.id
      WHERE l.id = crm_activities.lead_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities"
  ON crm_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tasks
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their organization's leads"
  ON crm_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_leads l
      JOIN organizations o ON o.id = l.organization_id
      JOIN users u ON u.organization_id = o.id
      WHERE l.id = crm_tasks.lead_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks"
  ON crm_tasks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their assigned tasks"
  ON crm_tasks FOR UPDATE
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- Appointments
ALTER TABLE crm_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointments for their organization's leads"
  ON crm_appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_leads l
      JOIN organizations o ON o.id = l.organization_id
      JOIN users u ON u.organization_id = o.id
      WHERE l.id = crm_appointments.lead_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can create appointments"
  ON crm_appointments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update appointments"
  ON crm_appointments FOR UPDATE
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- Notes
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for their organization's leads"
  ON crm_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_leads l
      JOIN organizations o ON o.id = l.organization_id
      JOIN users u ON u.organization_id = o.id
      WHERE l.id = crm_notes.lead_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes"
  ON crm_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Documents
ALTER TABLE crm_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their organization's leads"
  ON crm_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_leads l
      JOIN organizations o ON o.id = l.organization_id
      JOIN users u ON u.organization_id = o.id
      WHERE l.id = crm_documents.lead_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents"
  ON crm_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Email Templates
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's templates"
  ON crm_email_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = crm_email_templates.organization_id
    )
  );

-- ============================================
-- 10. SAMPLE DATA (per testing)
-- ============================================

-- Aggiungerò dati di esempio dopo che crei il primo lead
