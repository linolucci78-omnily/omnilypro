import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Supabase configuration
const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyMigration() {
  try {
    console.log('🚀 Applying migration: 007_fix_customer_registration_rls.sql')

    // Read the migration file
    const migrationSQL = readFileSync('./database/migrations/007_fix_customer_registration_rls.sql', 'utf8')

    // Apply the migration
    const { data, error } = await supabase.rpc('apply_migration', {
      sql_content: migrationSQL
    })

    if (error) {
      console.error('❌ Migration failed:', error)

      // Try alternative approach - execute each statement separately
      console.log('🔄 Trying alternative approach...')

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`)
          const { error: stmtError } = await supabase.rpc('execute_sql', {
            sql: statement + ';'
          })

          if (stmtError) {
            console.error(`❌ Statement failed: ${stmtError.message}`)
          } else {
            console.log(`✅ Statement executed successfully`)
          }
        }
      }
    } else {
      console.log('✅ Migration applied successfully!')
    }

  } catch (err) {
    console.error('❌ Error applying migration:', err)
    console.log('📝 Manual application required. Please execute the following SQL in Supabase SQL Editor:')
    console.log('=====================================')
    const migrationSQL = readFileSync('./database/migrations/007_fix_customer_registration_rls.sql', 'utf8')
    console.log(migrationSQL)
    console.log('=====================================')
  }
}

applyMigration()