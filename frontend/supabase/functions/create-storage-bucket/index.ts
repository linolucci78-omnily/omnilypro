import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organizationId } = await req.json()

    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    // Create Supabase client with service role (has admin permissions)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const bucketName = 'email-images'
    const bucketExists = buckets?.some(b => b.name === bucketName)

    if (!bucketExists) {
      // Create the bucket
      const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      })

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }

      console.log(`✅ Created bucket '${bucketName}' for organization ${organizationId}`)
    } else {
      console.log(`ℹ️  Bucket '${bucketName}' already exists`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: bucketExists ? 'Bucket already exists' : 'Bucket created successfully',
        bucketName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
