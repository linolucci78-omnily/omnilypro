// Test script to verify environment variables
console.log('Testing environment variables...')
console.log('CLOUDFLARE_API_TOKEN:', Deno.env.get('CLOUDFLARE_API_TOKEN') ? '✅ SET' : '❌ MISSING')
console.log('CLOUDFLARE_ZONE_ID:', Deno.env.get('CLOUDFLARE_ZONE_ID') ? '✅ SET' : '❌ MISSING')
console.log('VERCEL_API_TOKEN:', Deno.env.get('VERCEL_API_TOKEN') ? '✅ SET' : '❌ MISSING')
console.log('VERCEL_PROJECT_ID:', Deno.env.get('VERCEL_PROJECT_ID') ? '✅ SET' : '❌ MISSING')
console.log('VERCEL_TEAM_ID:', Deno.env.get('VERCEL_TEAM_ID') ? '✅ SET' : '❌ MISSING')
console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? '✅ SET' : '❌ MISSING')
console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✅ SET' : '❌ MISSING')
