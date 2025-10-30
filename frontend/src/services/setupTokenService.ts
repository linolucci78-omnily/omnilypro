import { supabase } from '../lib/supabase'

export interface TokenValidationResult {
  valid: boolean
  expired?: boolean
  maxUsesReached?: boolean
  setupData?: any
  error?: string
}

/**
 * Validates a setup token from QR code
 * Checks if token exists, is not expired, and hasn't exceeded max uses
 */
export async function validateSetupToken(token: string): Promise<TokenValidationResult> {
  try {
    // 1. Fetch token from database
    const { data: tokenData, error: fetchError } = await supabase
      .from('setup_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (fetchError || !tokenData) {
      return {
        valid: false,
        error: 'Token non trovato o già utilizzato'
      }
    }

    // 2. Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    if (now > expiresAt) {
      return {
        valid: false,
        expired: true,
        error: 'Token scaduto. Richiedi un nuovo QR Code all\'amministratore.'
      }
    }

    // 3. Check max uses
    if (tokenData.current_uses >= tokenData.max_uses) {
      return {
        valid: false,
        maxUsesReached: true,
        error: 'Token ha raggiunto il numero massimo di utilizzi.'
      }
    }

    // 4. Token is valid
    return {
      valid: true,
      setupData: tokenData.setup_data
    }
  } catch (error) {
    console.error('Error validating setup token:', error)
    return {
      valid: false,
      error: 'Errore durante la validazione del token'
    }
  }
}

/**
 * Marks a token as used and increments usage counter
 */
export async function markTokenAsUsed(token: string, deviceInfo: any): Promise<boolean> {
  try {
    // 1. Get current token data
    const { data: tokenData, error: fetchError } = await supabase
      .from('setup_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !tokenData) {
      console.error('Token not found:', fetchError)
      return false
    }

    // 2. Increment current_uses
    const newUses = tokenData.current_uses + 1
    const shouldMarkUsed = newUses >= tokenData.max_uses

    // 3. Update token
    const { error: updateError } = await supabase
      .from('setup_tokens')
      .update({
        current_uses: newUses,
        used: shouldMarkUsed,
        used_at: shouldMarkUsed ? new Date().toISOString() : tokenData.used_at,
        used_by_device_info: deviceInfo
      })
      .eq('token', token)

    if (updateError) {
      console.error('Error updating token:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking token as used:', error)
    return false
  }
}

/**
 * Gets the setup data from a validated token
 */
export async function getSetupDataFromToken(token: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('setup_tokens')
      .select('setup_data')
      .eq('token', token)
      .single()

    if (error || !data) {
      console.error('Error fetching setup data:', error)
      return null
    }

    return data.setup_data
  } catch (error) {
    console.error('Error getting setup data:', error)
    return null
  }
}

/**
 * Cleans up expired tokens (for admin use)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('setup_tokens')
      .delete()
      .lt('expires_at', now)
      .select()

    if (error) {
      console.error('Error cleaning up expired tokens:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error in cleanup:', error)
    return 0
  }
}
