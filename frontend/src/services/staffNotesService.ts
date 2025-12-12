/**
 * Staff Notes Service
 * Gestione note interne tra operatori e note per clienti
 */

import { supabase } from '../lib/supabase';

export interface StaffNoteRecipient {
  id: string;
  note_id: string;
  recipient_type: 'staff' | 'customer' | 'all_staff';
  recipient_staff_id?: string;
  recipient_customer_id?: string;
  has_read: boolean;
  read_at?: string;
  created_at: string;
  // Relations
  staff?: any;
  customer?: any;
}

export interface StaffNote {
  id: string;
  organization_id: string;
  note_type: 'general' | 'customer' | 'reminder' | 'alert';
  customer_id?: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'read' | 'archived' | 'completed';
  show_popup: boolean;
  popup_shown: boolean;
  popup_shown_at?: string;
  is_broadcast: boolean;
  created_by_staff_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: any;
  created_by?: any;
  recipients?: StaffNoteRecipient[];
}

export interface CreateStaffNoteInput {
  organization_id: string;
  note_type: 'general' | 'customer' | 'reminder' | 'alert';
  customer_id?: string;
  title: string;
  content: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  show_popup?: boolean;
  is_broadcast?: boolean;
  created_by_staff_id?: string;
  // Recipients
  recipients?: {
    staff_ids?: string[];
    customer_ids?: string[];
    all_staff?: boolean;
  };
}

class StaffNotesService {
  /**
   * Get all notes for organization
   */
  async getAllNotes(organizationId: string): Promise<StaffNote[]> {
    const { data, error } = await supabase
      .from('staff_notes')
      .select(`
        *,
        customer:customers(id, name, email),
        created_by:staff_members(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get general notes (not tied to specific customer)
   */
  async getGeneralNotes(organizationId: string): Promise<StaffNote[]> {
    const { data, error } = await supabase
      .from('staff_notes')
      .select(`
        *,
        created_by:staff_members(id, name)
      `)
      .eq('organization_id', organizationId)
      .eq('note_type', 'general')
      .in('status', ['active', 'read'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get notes for specific customer (include tutte le note: active, read, completed, archived)
   */
  async getCustomerNotes(customerId: string): Promise<StaffNote[]> {
    const { data, error } = await supabase
      .from('staff_notes')
      .select(`
        *,
        created_by:staff_members(id, name)
      `)
      .eq('customer_id', customerId)
      .in('status', ['active', 'read', 'completed', 'archived'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get unshown popup notes for customer
   */
  async getUnshownPopupNotes(customerId: string): Promise<StaffNote[]> {
    const { data, error } = await supabase
      .from('staff_notes')
      .select(`
        *,
        created_by:staff_members(id, name)
      `)
      .eq('customer_id', customerId)
      .eq('show_popup', true)
      .eq('popup_shown', false)
      .eq('status', 'active')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create new note with recipients
   */
  async createNote(input: CreateStaffNoteInput): Promise<StaffNote> {
    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('staff_notes')
      .insert({
        organization_id: input.organization_id,
        note_type: input.note_type,
        customer_id: input.customer_id,
        title: input.title,
        content: input.content,
        priority: input.priority || 'normal',
        status: 'active',
        show_popup: input.show_popup || false,
        popup_shown: false,
        is_broadcast: input.is_broadcast || false,
        created_by_staff_id: input.created_by_staff_id,
      })
      .select()
      .single();

    if (noteError) throw noteError;

    // Create recipients if specified
    if (input.recipients && note) {
      const recipientRecords: any[] = [];

      // Add all_staff recipient
      if (input.recipients.all_staff) {
        recipientRecords.push({
          note_id: note.id,
          recipient_type: 'all_staff',
        });
      }

      // Add staff recipients
      if (input.recipients.staff_ids && input.recipients.staff_ids.length > 0) {
        input.recipients.staff_ids.forEach(staffId => {
          recipientRecords.push({
            note_id: note.id,
            recipient_type: 'staff',
            recipient_staff_id: staffId,
          });
        });
      }

      // Add customer recipients
      if (input.recipients.customer_ids && input.recipients.customer_ids.length > 0) {
        input.recipients.customer_ids.forEach(customerId => {
          recipientRecords.push({
            note_id: note.id,
            recipient_type: 'customer',
            recipient_customer_id: customerId,
          });
        });
      }

      // Insert recipients
      if (recipientRecords.length > 0) {
        const { error: recipientsError } = await supabase
          .from('staff_note_recipients')
          .insert(recipientRecords);

        if (recipientsError) {
          console.error('Error creating recipients:', recipientsError);
          // Don't throw - note was created successfully
        }
      }
    }

    return note;
  }

  /**
   * Update note
   */
  async updateNote(noteId: string, updates: Partial<StaffNote>): Promise<StaffNote> {
    const { data, error } = await supabase
      .from('staff_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark popup as shown
   */
  async markPopupShown(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_notes')
      .update({
        popup_shown: true,
        popup_shown_at: new Date().toISOString(),
      })
      .eq('id', noteId);

    if (error) throw error;
  }

  /**
   * Mark note as read
   */
  async markAsRead(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_notes')
      .update({ status: 'read' })
      .eq('id', noteId);

    if (error) throw error;
  }

  /**
   * Mark note as completed
   */
  async markAsCompleted(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_notes')
      .update({ status: 'completed' })
      .eq('id', noteId);

    if (error) throw error;
  }

  /**
   * Archive note
   */
  async archiveNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_notes')
      .update({ status: 'archived' })
      .eq('id', noteId);

    if (error) throw error;
  }

  /**
   * Delete note
   */
  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  }

  /**
   * Get active notes count
   */
  async getActiveNotesCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('staff_notes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get customer notes count
   */
  async getCustomerNotesCount(customerId: string): Promise<number> {
    const { count, error } = await supabase
      .from('staff_notes')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .in('status', ['active', 'read']);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get notes sent to a specific staff member
   */
  async getNotesForStaff(staffId: string, organizationId: string): Promise<StaffNote[]> {
    // Get note IDs for this staff member (direct + all_staff)
    const { data: recipients, error: recipientsError } = await supabase
      .from('staff_note_recipients')
      .select('note_id')
      .or(`recipient_staff_id.eq.${staffId},recipient_type.eq.all_staff`);

    if (recipientsError) throw recipientsError;

    if (!recipients || recipients.length === 0) return [];

    const noteIds = recipients.map(r => r.note_id);

    // Get the actual notes
    const { data, error } = await supabase
      .from('staff_notes')
      .select(`
        *,
        created_by:staff_members(id, name),
        recipients:staff_note_recipients(
          id,
          recipient_type,
          has_read,
          read_at,
          staff:staff_members(id, name),
          customer:customers(id, name)
        )
      `)
      .in('id', noteIds)
      .eq('organization_id', organizationId)
      .in('status', ['active', 'read', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get notes sent to a specific customer
   */
  async getNotesForCustomer(customerId: string): Promise<StaffNote[]> {
    // Get note IDs for this customer
    const { data: recipients, error: recipientsError } = await supabase
      .from('staff_note_recipients')
      .select('note_id')
      .eq('recipient_customer_id', customerId);

    if (recipientsError) throw recipientsError;

    if (!recipients || recipients.length === 0) return [];

    const noteIds = recipients.map(r => r.note_id);

    // Get the actual notes
    const { data, error } = await supabase
      .from('staff_notes')
      .select(`
        *,
        created_by:staff_members(id, name)
      `)
      .in('id', noteIds)
      .in('status', ['active', 'read'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark recipient as read
   */
  async markRecipientAsRead(noteId: string, staffId?: string, customerId?: string): Promise<void> {
    let query = supabase
      .from('staff_note_recipients')
      .update({
        has_read: true,
        read_at: new Date().toISOString()
      })
      .eq('note_id', noteId);

    if (staffId) {
      query = query.eq('recipient_staff_id', staffId);
    } else if (customerId) {
      query = query.eq('recipient_customer_id', customerId);
    }

    const { error } = await query;
    if (error) throw error;
  }
}

export const staffNotesService = new StaffNotesService();
export default staffNotesService;
