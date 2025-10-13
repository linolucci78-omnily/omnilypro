#!/usr/bin/env node

/**
 * Script one-time per creare il bucket email-images per organizzazioni esistenti
 *
 * Esecuzione:
 * 1. Vai su: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv/settings/api
 * 2. Copia la "service_role" key (Secret)
 * 3. Esegui: SUPABASE_SERVICE_ROLE_KEY="tua-key-qui" node create-bucket-now.js
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🪣 Creazione Bucket Storage per Immagini Email\n')

if (!SERVICE_KEY) {
  console.error('❌ Service key non trovata!\n')
  console.log('Come ottenere la service key:')
  console.log('1. Apri: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv/settings/api')
  console.log('2. Copia la "service_role" secret key')
  console.log('3. Esegui questo comando:\n')
  console.log('   SUPABASE_SERVICE_ROLE_KEY="la-tua-key" node create-bucket-now.js\n')
  process.exit(1)
}

async function createBucket() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    console.log('🔍 Verifico se il bucket esiste già...')

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Errore lista buckets: ${listError.message}`)
    }

    const bucketExists = buckets?.some(b => b.name === 'email-images')

    if (bucketExists) {
      console.log('✅ Il bucket "email-images" esiste già!')
      console.log('\n📁 Struttura bucket:')
      console.log('   email-images/')
      console.log('     └── {organization_id}/')
      console.log('           └── {timestamp}_{filename}\n')
      return
    }

    console.log('📦 Creo il bucket "email-images"...')

    const { error: createError } = await supabase.storage.createBucket('email-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    })

    if (createError) {
      throw new Error(`Errore creazione: ${createError.message}`)
    }

    console.log('✅ Bucket creato con successo!\n')
    console.log('📁 Struttura bucket:')
    console.log('   email-images/')
    console.log('     └── {organization_id}/')
    console.log('           └── {timestamp}_{filename}\n')
    console.log('🎉 Ora puoi caricare immagini nelle email!\n')

  } catch (error) {
    console.error('\n❌ Errore:', error.message)
    process.exit(1)
  }
}

createBucket().then(() => process.exit(0))
