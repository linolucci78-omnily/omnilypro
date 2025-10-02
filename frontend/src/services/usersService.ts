import { supabase } from '../lib/supabase'

/**
 * Users Service - Gestione utenti e ruoli del sistema
 */

export type UserRole = 'super_admin' | 'sales_agent' | 'account_manager' | 'organization_owner' | 'organization_staff'

export interface SystemUser {
  id: string
  email: string
  role: UserRole
  is_active: boolean
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
   * Create new user
   * Note: Questo crea solo il record nella tabella users.
   * L'account auth deve essere creato separatamente o tramite trigger.
   */
  async createUser(userData: CreateUserInput): Promise<SystemUser> {
    try {
      // Per ora inseriamo solo nella tabella users
      // TODO: Implementare creazione account auth tramite Supabase Admin API o Edge Function

      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          role: userData.role,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        throw error
      }

      console.log('✅ User created in database:', userData.email)
      console.log('⚠️ Note: Account auth deve essere creato manualmente o tramite trigger')
      return data
    } catch (error) {
      console.error('Error in createUser:', error)
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
   * Deactivate user
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)

      if (error) {
        console.error('Error deactivating user:', error)
        throw error
      }

      console.log('✅ User deactivated:', userId)
    } catch (error) {
      console.error('Error in deactivateUser:', error)
      throw error
    }
  }

  /**
   * Delete user (soft delete - just deactivate)
   */
  async deleteUser(userId: string): Promise<void> {
    await this.deactivateUser(userId)
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
