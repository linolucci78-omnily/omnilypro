import { supabase } from '../lib/supabase'

/**
 * Users Service - Gestione utenti e ruoli del sistema
 */

export type UserRole = 'super_admin' | 'sales_agent' | 'account_manager' | 'organization_owner' | 'organization_staff'

export interface SystemUser {
  id: string
  email: string
  role: UserRole
  status: 'pending' | 'active' | 'suspended' // Stato account
  is_active: boolean // Campo per compatibilità
  temp_password?: string // Password temporanea per attivazione
  created_at: string
  updated_at: string
  last_sign_in_at?: string
}

export interface CreateUserInput {
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserInput {
  role?: UserRole
  is_active?: boolean
}

export class UsersService {

  /**
   * Get all system users
   */
  async getUsers(filters?: {
    role?: UserRole
    is_active?: boolean
    search?: string
  }): Promise<SystemUser[]> {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters?.search) {
        query = query.ilike('email', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getUsers:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<SystemUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error in getUser:', error)
      throw error
    }
  }

  /**
   * Create new user (INACTIVE - pending activation)
   * L'admin dovrà poi cliccare "Attiva Account" per creare l'auth e attivarlo
   */
  async createUser(userData: CreateUserInput): Promise<SystemUser> {
    try {
      // Genera un UUID temporaneo (verrà sostituito durante attivazione)
      const tempId = crypto.randomUUID()

      // Salva temporaneamente la password (verrà usata durante attivazione)
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: tempId, // ID temporaneo
          email: userData.email,
          role: userData.role,
          is_active: false, // INATTIVO finché non viene attivato
          temp_password: userData.password // Password temporanea per attivazione
        })
        .select()

      if (error) {
        console.error('Error creating user:', error)
        throw error
      }

      // Se data è un array, prendi il primo elemento
      const user = Array.isArray(data) ? data[0] : data

      if (!user) {
        throw new Error('User created but not returned (RLS policy issue)')
      }

      console.log('✅ User created (INACTIVE) with temp ID:', userData.email)
      console.log('⏳ Waiting for admin activation...')
      return user
    } catch (error) {
      console.error('Error in createUser:', error)
      throw error
    }
  }

  /**
   * Activate user account - Creates Supabase Auth user and activates record
   */
  async activateUser(userId: string, email: string, tempPassword: string): Promise<SystemUser> {
    try {
      console.log('🚀 Activating user:', email)

      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('Auth user creation failed')
      }

      console.log('✅ Auth user created:', authData.user.id)

      // 2. Update users record - activate and link auth ID
      const { data, error } = await supabase
        .from('users')
        .update({
          id: authData.user.id, // Link auth user ID
          is_active: true,
          temp_password: null // Remove temp password
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error activating user record:', error)
        throw error
      }

      console.log('✅ User activated successfully:', email)
      return data
    } catch (error) {
      console.error('Error in activateUser:', error)
      throw error
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: UpdateUserInput): Promise<SystemUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        throw error
      }

      console.log('✅ User updated:', userId)
      return data
    } catch (error) {
      console.error('Error in updateUser:', error)
      throw error
    }
  }

  /**
   * Suspend user (sospendi account)
   */
  async suspendUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'suspended' })
        .eq('id', userId)

      if (error) {
        console.error('Error suspending user:', error)
        throw error
      }

      console.log('✅ User suspended:', userId)
    } catch (error) {
      console.error('Error in suspendUser:', error)
      throw error
    }
  }

  /**
   * Deactivate user (legacy - usa suspendUser)
   * @deprecated Use suspendUser instead
   */
  async deactivateUser(userId: string): Promise<void> {
    await this.suspendUser(userId)
  }

  /**
   * Delete user (soft delete - just suspend)
   */
  async deleteUser(userId: string): Promise<void> {
    await this.suspendUser(userId)
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number
    active: number
    by_role: { [key: string]: number }
  }> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('role, is_active')

      if (error) {
        console.error('Error fetching user stats:', error)
        throw error
      }

      const stats = {
        total: users?.length || 0,
        active: users?.filter(u => u.is_active).length || 0,
        by_role: users?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {} as { [key: string]: number }) || {}
      }

      return stats
    } catch (error) {
      console.error('Error in getUserStats:', error)
      throw error
    }
  }
}

export const usersService = new UsersService()
