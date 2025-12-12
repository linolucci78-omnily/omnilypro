#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const crypto = require('crypto')

// Supabase credentials
const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseKey)

const APK_PATH = '/Users/pasqualelucci/omnilypro-clean/android-bridge/app/build/outputs/apk/release/app-release.apk'
const APK_VERSION_CODE = 42
const APK_VERSION_NAME = '3.3'
const PACKAGE_NAME = 'com.omnilypro.pos'
const APP_NAME = 'OmnilyPOS'

async function uploadAPK() {
  try {
    console.log('📦 Starting APK upload...')

    // Read APK file
    console.log('📖 Reading APK file:', APK_PATH)
    const apkBuffer = fs.readFileSync(APK_PATH)
    const apkSizeMB = (apkBuffer.length / (1024 * 1024)).toFixed(2)
    console.log(`📊 APK size: ${apkSizeMB} MB`)

    // Calculate checksum
    console.log('🔐 Calculating checksum...')
    const hash = crypto.createHash('sha256')
    hash.update(apkBuffer)
    const checksum = hash.digest('hex')
    console.log(`✅ Checksum: ${checksum}`)

    // Upload to Supabase Storage (bucket: apks)
    const fileName = `omnilypro-pos-v${APK_VERSION_NAME}-${APK_VERSION_CODE}.apk`
    console.log(`⬆️  Uploading to storage bucket 'apks' as: ${fileName}`)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('apks')
      .upload(fileName, apkBuffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true // Overwrite if exists
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      throw uploadError
    }

    console.log('✅ Upload successful:', uploadData)

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('apks')
      .getPublicUrl(fileName)

    const apkUrl = publicUrlData.publicUrl
    console.log('🔗 Public URL:', apkUrl)

    // Insert into app_repository table
    console.log('💾 Creating database record...')

    const { data: appData, error: dbError } = await supabase
      .from('app_repository')
      .insert({
        package_name: PACKAGE_NAME,
        app_name: APP_NAME,
        version_name: APK_VERSION_NAME,
        version_code: APK_VERSION_CODE,
        apk_url: apkUrl,
        apk_size_mb: parseFloat(apkSizeMB),
        apk_checksum: checksum,
        is_mandatory: false,
        rollout_percentage: 100,
        is_active: true,
        install_count: 0,
        release_notes: '🖨️ Fix stampa scontrino:\n- Testo centrato con comandi ESC/POS nativi\n- Header cambiato da "SCONTRINO FISCALE" a "SCONTRINO DI CORTESIA"\n- Nome operatore mostra nome completo invece di UUID',
        upload_date: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      throw dbError
    }

    console.log('✅ Database record created:', appData)
    console.log('\n🎉 APK uploaded successfully!')
    console.log('\n📋 Summary:')
    console.log(`   App: ${APP_NAME} v${APK_VERSION_NAME} (${APK_VERSION_CODE})`)
    console.log(`   Size: ${apkSizeMB} MB`)
    console.log(`   URL: ${apkUrl}`)
    console.log(`   Checksum: ${checksum}`)
    console.log('\n✨ L\'app è ora disponibile nella sezione MDM di OmnilyPro!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

uploadAPK()
