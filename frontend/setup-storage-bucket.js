/**
 * Script per creare il bucket Supabase Storage per le immagini email
 *
 * Esegui: node setup-storage-bucket.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configurazione Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sjvatdnvewohvswfrdiv.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // Serve la service key per creare bucket

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non trovata nelle variabili d\'ambiente')
  console.log('\nPer ottenere la service key:')
  console.log('1. Vai su https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv/settings/api')
  console.log('2. Copia la "service_role" key')
  console.log('3. Esegui: export SUPABASE_SERVICE_ROLE_KEY="tua-key-qui"')
  console.log('4. Rilancia questo script\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupStorageBucket() {
  console.log('🚀 Setup bucket Supabase Storage...\n')

  try {
    // 1. Verifica se il bucket esiste
    console.log('1️⃣  Verifico se il bucket "email-images" esiste...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Errore lista buckets: ${listError.message}`)
    }

    const bucketExists = buckets.some(b => b.name === 'email-images')

    if (bucketExists) {
      console.log('✅ Bucket "email-images" già esistente\n')
    } else {
      // 2. Crea il bucket
      console.log('2️⃣  Creo bucket "email-images"...')
      const { data, error: createError } = await supabase.storage.createBucket('email-images', {
        public: true, // Bucket pubblico per URL diretti
        fileSizeLimit: 5242880, // 5MB max
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      })

      if (createError) {
        throw new Error(`Errore creazione bucket: ${createError.message}`)
      }

      console.log('✅ Bucket "email-images" creato con successo!\n')
    }

    // 3. Verifica policies (RLS)
    console.log('3️⃣  Configurazione policies...')
    console.log('   Le policies dovrebbero già essere configurate automaticamente.')
    console.log('   Se necessario, vai su Supabase Dashboard → Storage → email-images → Policies\n')

    console.log('🎉 Setup completato con successo!\n')
    console.log('Struttura bucket:')
    console.log('  email-images/')
    console.log('    └── {organization_id}/')
    console.log('          └── {timestamp}_{filename}\n')

  } catch (error) {
    console.error('\n❌ Errore durante il setup:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Esegui setup
setupStorageBucket()
  .then(() => {
    console.log('✅ Script completato')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Errore:', error)
    process.exit(1)
  })
