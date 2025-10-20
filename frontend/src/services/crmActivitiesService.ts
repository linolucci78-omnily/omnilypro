import { supabase } from '../lib/supabase'

// ============================================
// TYPES
// ============================================

export interface CRMActivity {
  id: string
  lead_id: string
  user_id: string | null
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'demo' | 'proposal_sent' | 'contract_signed'
  subject: string
  description: string | null
  activity_date: string
  duration_minutes: number | null
  outcome: 'successful' | 'no_answer' | 'voicemail' | 'rescheduled' | 'cancelled' | null
  next_action: string | null
  created_at: string
  updated_at: string

  // Joined fields
  user_name?: string
}

export interface CRMTask {
  id: string
  lead_id: string
  assigned_to: string | null
  created_by: string | null
  title: string
  description: string | null
  task_type: 'call' | 'email' | 'follow_up' | 'send_proposal' | 'schedule_demo' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
  completed_at: string | null
  reminder_date: string | null
  related_activity_id: string | null
  created_at: string
  updated_at: string

  // Joined fields
  assigned_to_name?: string
  lead_company_name?: string
}

export interface CRMAppointment {
  id: string
  lead_id: string
  assigned_to: string | null
  created_by: string | null
  title: string
  description: string | null
  appointment_type: 'demo' | 'meeting' | 'call' | 'presentation' | 'negotiation' | 'contract_signing'
  location: string | null
  start_time: string
  end_time: string
  timezone: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reminder_sent: boolean
  attendees: any | null
  outcome: string | null
  notes: string | null
  google_calendar_event_id: string | null
  related_activity_id: string | null
  created_at: string
  updated_at: string

  // Joined fields
  assigned_to_name?: string
  lead_company_name?: string
}

export interface CRMNote {
  id: string
  lead_id: string
  user_id: string | null
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string

  // Joined fields
  user_name?: string
}

export interface CRMDocument {
  id: string
  lead_id: string
  uploaded_by: string | null
  file_name: string
  file_type: 'contract' | 'proposal' | 'presentation' | 'invoice' | 'other' | null
  file_size: number | null
  mime_type: string | null
  storage_path: string
  download_url: string | null
  description: string | null
  tags: string[] | null
  created_at: string
  updated_at: string

  // Joined fields
  uploaded_by_name?: string
}

export interface ActivityInput {
  lead_id: string
  activity_type: CRMActivity['activity_type']
  subject: string
  description?: string
  activity_date?: string
  duration_minutes?: number
  outcome?: CRMActivity['outcome']
  next_action?: string
}

export interface TaskInput {
  lead_id: string
  assigned_to?: string
  title: string
  description?: string
  task_type: CRMTask['task_type']
  priority?: CRMTask['priority']
  due_date?: string
  reminder_date?: string
}

export interface AppointmentInput {
  lead_id: string
  assigned_to?: string
  title: string
  description?: string
  appointment_type: CRMAppointment['appointment_type']
  location?: string
  start_time: string
  end_time: string
  timezone?: string
  attendees?: any
}

export interface NoteInput {
  lead_id: string
  content: string
  is_pinned?: boolean
}

// ============================================
// ACTIVITIES SERVICE
// ============================================

export const crmActivitiesService = {
  // Get all activities for a lead
  async getActivitiesByLead(leadId: string): Promise<CRMActivity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select(`
        *,
        user:users(full_name)
      `)
      .eq('lead_id', leadId)
      .order('activity_date', { ascending: false })

    if (error) throw error

    return (data || []).map((activity: any) => ({
      ...activity,
      user_name: activity.user?.full_name
    }))
  },

  // Create activity
  async createActivity(input: ActivityInput, userId: string): Promise<CRMActivity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        ...input,
        user_id: userId,
        activity_date: input.activity_date || new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update activity
  async updateActivity(id: string, updates: Partial<ActivityInput>): Promise<CRMActivity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete activity
  async deleteActivity(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// TASKS SERVICE
// ============================================

export const crmTasksService = {
  // Get all tasks for a lead
  async getTasksByLead(leadId: string): Promise<CRMTask[]> {
    const { data, error } = await supabase
      .from('crm_tasks')
      .select(`
        *,
        assigned_user:users!crm_tasks_assigned_to_fkey(full_name),
        lead:crm_leads(company_name)
      `)
      .eq('lead_id', leadId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) throw error

    return (data || []).map((task: any) => ({
      ...task,
      assigned_to_name: task.assigned_user?.full_name,
      lead_company_name: task.lead?.company_name
    }))
  },

  // Get tasks assigned to user
  async getMyTasks(userId: string, filters?: { status?: string }): Promise<CRMTask[]> {
    let query = supabase
      .from('crm_tasks')
      .select(`
        *,
        assigned_user:users!crm_tasks_assigned_to_fkey(full_name),
        lead:crm_leads(company_name)
      `)
      .eq('assigned_to', userId)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) throw error

    return (data || []).map((task: any) => ({
      ...task,
      assigned_to_name: task.assigned_user?.full_name,
      lead_company_name: task.lead?.company_name
    }))
  },

  // Get overdue tasks
  async getOverdueTasks(userId?: string): Promise<CRMTask[]> {
    let query = supabase
      .from('crm_tasks')
      .select(`
        *,
        assigned_user:users!crm_tasks_assigned_to_fkey(full_name),
        lead:crm_leads(company_name)
      `)
      .lt('due_date', new Date().toISOString())
      .in('status', ['pending', 'in_progress'])

    if (userId) {
      query = query.eq('assigned_to', userId)
    }

    const { data, error } = await query
      .order('due_date', { ascending: true })

    if (error) throw error

    return (data || []).map((task: any) => ({
      ...task,
      assigned_to_name: task.assigned_user?.full_name,
      lead_company_name: task.lead?.company_name
    }))
  },

  // Create task
  async createTask(input: TaskInput, createdBy: string): Promise<CRMTask> {
    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        ...input,
        created_by: createdBy,
        priority: input.priority || 'medium',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update task
  async updateTask(id: string, updates: Partial<TaskInput & { status?: CRMTask['status'] }>): Promise<CRMTask> {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Se il task viene completato, salva completed_at
    if (updates.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('crm_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mark task as completed
  async completeTask(id: string): Promise<CRMTask> {
    return this.updateTask(id, { status: 'completed' })
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// APPOINTMENTS SERVICE
// ============================================

export const crmAppointmentsService = {
  // Get all appointments for a lead
  async getAppointmentsByLead(leadId: string): Promise<CRMAppointment[]> {
    const { data, error } = await supabase
      .from('crm_appointments')
      .select(`
        *,
        assigned_user:users!crm_appointments_assigned_to_fkey(full_name),
        lead:crm_leads(company_name)
      `)
      .eq('lead_id', leadId)
      .order('start_time', { ascending: true })

    if (error) throw error

    return (data || []).map((apt: any) => ({
      ...apt,
      assigned_to_name: apt.assigned_user?.full_name,
      lead_company_name: apt.lead?.company_name
    }))
  },

  // Get upcoming appointments for user
  async getMyUpcomingAppointments(userId: string): Promise<CRMAppointment[]> {
    const { data, error } = await supabase
      .from('crm_appointments')
      .select(`
        *,
        assigned_user:users!crm_appointments_assigned_to_fkey(full_name),
        lead:crm_leads(company_name)
      `)
      .eq('assigned_to', userId)
      .gte('start_time', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true })

    if (error) throw error

    return (data || []).map((apt: any) => ({
      ...apt,
      assigned_to_name: apt.assigned_user?.full_name,
      lead_company_name: apt.lead?.company_name
    }))
  },

  // Get today's appointments
  async getTodayAppointments(userId?: string): Promise<CRMAppointment[]> {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    let query = supabase
      .from('crm_appointments')
      .select(`
        *,
        assigned_user:users!crm_appointments_assigned_to_fkey(full_name),
        lead:crm_leads(company_name)
      `)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .in('status', ['scheduled', 'confirmed'])

    if (userId) {
      query = query.eq('assigned_to', userId)
    }

    const { data, error } = await query
      .order('start_time', { ascending: true })

    if (error) throw error

    return (data || []).map((apt: any) => ({
      ...apt,
      assigned_to_name: apt.assigned_user?.full_name,
      lead_company_name: apt.lead?.company_name
    }))
  },

  // Create appointment
  async createAppointment(input: AppointmentInput, createdBy: string): Promise<CRMAppointment> {
    const { data, error } = await supabase
      .from('crm_appointments')
      .insert({
        ...input,
        created_by: createdBy,
        timezone: input.timezone || 'Europe/Rome',
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update appointment
  async updateAppointment(id: string, updates: Partial<AppointmentInput & { status?: CRMAppointment['status'], outcome?: string, notes?: string }>): Promise<CRMAppointment> {
    const { data, error } = await supabase
      .from('crm_appointments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete appointment
  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_appointments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// NOTES SERVICE
// ============================================

export const crmNotesService = {
  // Get all notes for a lead
  async getNotesByLead(leadId: string): Promise<CRMNote[]> {
    const { data, error } = await supabase
      .from('crm_notes')
      .select(`
        *,
        user:users(full_name)
      `)
      .eq('lead_id', leadId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((note: any) => ({
      ...note,
      user_name: note.user?.full_name
    }))
  },

  // Create note
  async createNote(input: NoteInput, userId: string): Promise<CRMNote> {
    const { data, error } = await supabase
      .from('crm_notes')
      .insert({
        ...input,
        user_id: userId,
        is_pinned: input.is_pinned || false
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update note
  async updateNote(id: string, updates: Partial<NoteInput>): Promise<CRMNote> {
    const { data, error } = await supabase
      .from('crm_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Toggle pin
  async togglePin(id: string, isPinned: boolean): Promise<CRMNote> {
    return this.updateNote(id, { is_pinned: isPinned })
  },

  // Delete note
  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_notes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ============================================
// DOCUMENTS SERVICE
// ============================================

export const crmDocumentsService = {
  // Get all documents for a lead
  async getDocumentsByLead(leadId: string): Promise<CRMDocument[]> {
    const { data, error } = await supabase
      .from('crm_documents')
      .select(`
        *,
        uploader:users!crm_documents_uploaded_by_fkey(full_name)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((doc: any) => ({
      ...doc,
      uploaded_by_name: doc.uploader?.full_name
    }))
  },

  // Upload document (simplified - would need actual file upload logic)
  async createDocument(leadId: string, file: File, userId: string, metadata?: { file_type?: string, description?: string, tags?: string[] }): Promise<CRMDocument> {
    // This is simplified - in real implementation you'd upload to Supabase Storage first
    const storagePath = `crm-documents/${leadId}/${file.name}`

    const { data, error } = await supabase
      .from('crm_documents')
      .insert({
        lead_id: leadId,
        uploaded_by: userId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        ...metadata
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_documents')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
