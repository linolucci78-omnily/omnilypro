const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://sjvatdnvewohvswfrdiv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc0MzQ4NSwiZXhwIjoyMDcyMzE5NDg1fQ.eanhNpi6BDEoimdB4c2IO51wIpPay6GNPkYKwynru40';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadAPK() {
  const apkPath = path.join(__dirname, 'android-bridge', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

  console.log('📦 Reading APK file...');
  const fileBuffer = fs.readFileSync(apkPath);

  console.log('☁️  Uploading to Supabase storage...');
  const { data, error } = await supabase.storage
    .from('apks')
    .upload('omnilybridgepos-production.apk', fileBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true  // Overwrite if exists
    });

  if (error) {
    console.error('❌ Error uploading APK:', error);
    process.exit(1);
  }

  console.log('✅ APK uploaded successfully!');
  console.log('📍 URL: https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/omnilybridgepos-production.apk');

  // Get file info
  const stats = fs.statSync(apkPath);
  console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('🎉 Done!');
}

uploadAPK().catch(console.error);
