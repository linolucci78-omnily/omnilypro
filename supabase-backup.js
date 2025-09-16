import { createClient } from '@supabase/supabase-js'

  // Configurazione Supabase
  const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZS
  I6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

  export const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Test connessione
  export const testConnection = async () => {
    try {
      console.log('🔌 Testing Supabase connection...')
      
      // Test lettura organizations
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('❌ Connection failed:', error)
        return false
      }
      
      console.log('✅ Connection successful! Data:', data)
      return true
    } catch (err) {
      console.error('❌ Connection error:', err)
      return false
    }
  }
