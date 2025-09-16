#!/usr/bin/env node
/**
 * Migration runner for OMNILY PRO Multi-tenant setup
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // Need service key for migrations

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_KEY environment variable required for migrations')
    console.log('💡 Get it from: Supabase Dashboard > Settings > API > service_role key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
    try {
        console.log('🚀 Running OMNILY PRO Multi-tenant Migration...')
        
        // Read migration file
        const migrationPath = path.join(process.cwd(), 'database/migrations/001_create_multitenant_schema.sql')
        const migrationSQL = readFileSync(migrationPath, 'utf8')
        
        // Execute migration
        console.log('📊 Creating multi-tenant tables...')
        const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
        
        if (error) {
            throw error
        }
        
        console.log('✅ Migration completed successfully!')
        console.log('📋 Created tables:')
        console.log('   - organizations')
        console.log('   - organization_users') 
        console.log('   - organization_invites')
        console.log('   - usage_tracking')
        console.log('🔒 Row Level Security enabled')
        console.log('📈 Indexes created for performance')
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message)
        process.exit(1)
    }
}

// Alternative: Direct SQL execution if rpc not available
async function runMigrationDirect() {
    try {
        console.log('🚀 Running OMNILY PRO Migration (Direct SQL)...')
        
        // Run all migrations in order
        const migrations = [
            '001_create_multitenant_schema.sql',
            '006_create_customers_table.sql'
        ]
        
        for (const migrationFile of migrations) {
            console.log(`📊 Running migration: ${migrationFile}`)
            
            const migrationPath = path.join(process.cwd(), 'database/migrations', migrationFile)
            const migrationSQL = readFileSync(migrationPath, 'utf8')
            
            // Split SQL into individual statements
            const statements = migrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt && !stmt.startsWith('--'))
            
            console.log(`   Executing ${statements.length} statements...`)
            
            for (const [index, statement] of statements.entries()) {
                if (statement) {
                    const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
                    if (error && !error.message.includes('already exists')) {
                        throw error
                    }
                }
            }
            
            console.log(`   ✅ ${migrationFile} completed!`)
        }
        
        console.log('\n🎉 All migrations completed successfully!')
        console.log('📋 Created tables:')
        console.log('   - organizations')
        console.log('   - organization_users') 
        console.log('   - organization_invites')
        console.log('   - usage_tracking')
        console.log('   - customers')
        console.log('🔒 Row Level Security enabled')
        
    } catch (error) {
        console.error('❌ Direct migration failed:', error.message)
        
        // Fallback: Manual instructions
        console.log('\n📝 MANUAL MIGRATION INSTRUCTIONS:')
        console.log('1. Open Supabase Dashboard > SQL Editor')
        console.log('2. Copy and paste the content of each migration file:')
        console.log('   - database/migrations/001_create_multitenant_schema.sql')
        console.log('   - database/migrations/006_create_customers_table.sql')
        console.log('3. Click "RUN" to execute each one')
        
        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrationDirect()
}