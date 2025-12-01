/**
 * Script to run the plans visibility migration
 * Run with: npx ts-node src/scripts/runPlansMigration.ts
 */

import { supabase } from '../lib/supabase'

async function runMigration() {
  console.log('🚀 Running plans visibility migration...')

  try {
    // Add show_in_wizard column
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE omnilypro_plans ADD COLUMN IF NOT EXISTS show_in_wizard BOOLEAN DEFAULT true;'
    })

    if (error1 && !error1.message.includes('already exists')) {
      console.error('❌ Error adding show_in_wizard:', error1)
    } else {
      console.log('✅ show_in_wizard column added')
    }

    // Add show_in_landing column
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE omnilypro_plans ADD COLUMN IF NOT EXISTS show_in_landing BOOLEAN DEFAULT true;'
    })

    if (error2 && !error2.message.includes('already exists')) {
      console.error('❌ Error adding show_in_landing:', error2)
    } else {
      console.log('✅ show_in_landing column added')
    }

    // Update existing plans
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `UPDATE omnilypro_plans SET show_in_landing = (visibility = 'public') WHERE show_in_landing IS NULL;`
    })

    if (error3) {
      console.error('❌ Error updating existing plans:', error3)
    } else {
      console.log('✅ Existing plans updated')
    }

    console.log('🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runMigration()
