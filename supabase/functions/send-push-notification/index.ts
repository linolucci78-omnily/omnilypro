/**
 * Supabase Edge Function: Send Push Notification
 * Invia notifiche push tramite Firebase Cloud Messaging (FCM)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FIREBASE_PROJECT_ID = 'omnilypro'

interface NotificationPayload {
  organizationId: string
  title: string
  body: string
  subtitle?: string
  imageUrl?: string
  icon?: string
  actionUrl?: string
  data?: Record<string, string>
  // Targeting options
  targetAll?: boolean
  targetTier?: string
  targetCustomerIds?: string[]
  targetTokens?: string[]
}

interface FCMMessage {
  message: {
    token: string
    notification: {
      title: string
      body: string
      image?: string
    }
    data?: Record<string, string>
    android?: {
      notification: {
        icon?: string
        image?: string
      }
    }
    apns?: {
      payload: {
        aps: {
          alert?: {
            title?: string
            body?: string
            subtitle?: string
          }
          'mutable-content'?: number
        }
      }
      fcm_options?: {
        image?: string
      }
    }
    webpush?: {
      notification?: {
        icon?: string
        image?: string
      }
      fcm_options?: {
        link?: string
      }
    }
  }
}

/**
 * Ottieni Access Token da Service Account usando googleapis
 */
async function getAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')

  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('Firebase Service Account not configured')
  }

  // Usa l'API di Google OAuth direttamente con il Service Account
  // Importa la private key
  const pemKey = serviceAccount.private_key
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  // Crea JWT
  const now = Math.floor(Date.now() / 1000)
  const jwtHeader = { alg: 'RS256', typ: 'JWT' }
  const jwtPayload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  }

  // Base64URL encode
  const base64url = (input: string) => {
    return btoa(input)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  const headerEncoded = base64url(JSON.stringify(jwtHeader))
  const payloadEncoded = base64url(JSON.stringify(jwtPayload))
  const signatureInput = `${headerEncoded}.${payloadEncoded}`

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  )

  const signatureEncoded = base64url(String.fromCharCode(...new Uint8Array(signature)))
  const jwt = `${signatureInput}.${signatureEncoded}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

/**
 * Invia notifica singola via FCM
 */
async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  subtitle?: string,
  imageUrl?: string,
  icon?: string,
  actionUrl?: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const accessToken = await getAccessToken()

    const message: FCMMessage = {
      message: {
        token,
        notification: {
          title,
          body,
          ...(imageUrl && { image: imageUrl })
        },
        ...(data && { data }),
        // Android-specific configuration
        ...(icon && {
          android: {
            notification: {
              icon,
              ...(imageUrl && { image: imageUrl })
            }
          }
        }),
        // iOS (APNS) specific configuration
        ...(subtitle && {
          apns: {
            payload: {
              aps: {
                alert: {
                  title,
                  body,
                  subtitle
                },
                'mutable-content': 1
              }
            },
            ...(imageUrl && {
              fcm_options: {
                image: imageUrl
              }
            })
          }
        }),
        // Web Push configuration
        webpush: {
          ...(icon && {
            notification: {
              icon,
              ...(imageUrl && { image: imageUrl })
            }
          }),
          ...(actionUrl && {
            fcm_options: {
              link: actionUrl
            }
          })
        }
      }
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('FCM Error:', error)
      return { success: false, error }
    }

    const result = await response.json()
    return { success: true, messageId: result.name }
  } catch (error) {
    console.error('Error sending FCM notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Helper: String to ArrayBuffer
 */
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const payload: NotificationPayload = await req.json()

    // Validate required fields
    if (!payload.organizationId || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: organizationId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get target device tokens
    let tokens: string[] = []

    if (payload.targetTokens && payload.targetTokens.length > 0) {
      // Use provided tokens directly
      tokens = payload.targetTokens
    } else {
      // Query database for tokens
      let query = supabase
        .from('device_tokens')
        .select('token')
        .eq('organization_id', payload.organizationId)
        .eq('is_active', true)

      // Apply targeting filters
      if (payload.targetCustomerIds && payload.targetCustomerIds.length > 0) {
        query = query.in('customer_id', payload.targetCustomerIds)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      tokens = data.map((row: any) => row.token)
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No target devices found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notifications to all tokens
    const results = await Promise.all(
      tokens.map(token =>
        sendFCMNotification(
          token,
          payload.title,
          payload.body,
          payload.subtitle,
          payload.imageUrl,
          payload.icon,
          payload.actionUrl,
          payload.data
        )
      )
    )

    // Count successes and failures
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    // Log to database
    await supabase.from('notification_log').insert(
      results.map((result, index) => ({
        organization_id: payload.organizationId,
        notification_type: 'push',
        title: payload.title,
        body: payload.body,
        image_url: payload.imageUrl,
        status: result.success ? 'sent' : 'failed',
        fcm_message_id: result.messageId,
        error_message: result.error,
        data: payload.data || {}
      }))
    )

    return new Response(
      JSON.stringify({
        success: true,
        total: tokens.length,
        successful,
        failed,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
