/**
 * Notification Service for OmnilyPro
 * Gestisce registrazione device tokens e preferenze notifiche
 */

import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '../lib/firebase'
import { supabase } from './supabase'

export interface NotificationPreferences {
  loyalty_updates: boolean
  promotions: boolean
  order_updates: boolean
  wallet_transactions: boolean
  rewards_unlocked: boolean
  birthday_wishes: boolean
  events: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
}

class NotificationService {
  private messaging = getFirebaseMessaging()

  /**
   * Verifica se il browser supporta le notifiche
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      this.messaging !== null
    )
  }

  /**
   * Richiede il permesso per le notifiche
   */
  async requestPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!this.isSupported()) {
      console.warn('⚠️ Notifications not supported')
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      console.log(`🔔 Notification permission: ${permission}`)
      return permission
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
      return 'denied'
    }
  }

  /**
   * Ottiene il token FCM e lo registra nel database
   */
  async registerDevice(customerId: string, organizationId: string): Promise<{ success: boolean; token?: string; error?: any }> {
    if (!this.messaging) {
      return { success: false, error: 'Messaging not initialized' }
    }

    try {
      // 1. Richiedi permesso
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        return { success: false, error: 'Permission not granted' }
      }

      // 2. Ottieni token FCM
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
      if (!vapidKey) {
        console.error('❌ VAPID key not configured')
        return { success: false, error: 'VAPID key missing' }
      }

      const token = await getToken(this.messaging, {
        vapidKey
      })

      if (!token) {
        return { success: false, error: 'Failed to get FCM token' }
      }

      console.log('🔑 FCM Token obtained:', token.substring(0, 20) + '...')

      // 3. Salva token nel database
      const { error: dbError } = await supabase
        .from('device_tokens')
        .upsert(
          {
            customer_id: customerId,
            organization_id: organizationId,
            token,
            platform: this.getPlatform(),
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
              screenWidth: window.screen.width,
              screenHeight: window.screen.height
            },
            app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
            os_version: this.getOSVersion(),
            is_active: true,
            last_used_at: new Date().toISOString()
          },
          {
            onConflict: 'token'
          }
        )

      if (dbError) {
        console.error('❌ Error saving token to database:', dbError)
        return { success: false, error: dbError }
      }

      console.log('✅ Device token registered successfully')

      // 4. Inizializza listener per messaggi in foreground
      this.setupForegroundMessageListener()

      return { success: true, token }
    } catch (error) {
      console.error('❌ Error registering device:', error)
      return { success: false, error }
    }
  }

  /**
   * Deregistra il device corrente
   */
  async unregisterDevice(customerId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!this.messaging) {
        return { success: false, error: 'Messaging not initialized' }
      }

      // Ottieni token corrente
      const token = await getToken(this.messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      })

      if (token) {
        // Disattiva token nel database
        const { error } = await supabase
          .from('device_tokens')
          .update({ is_active: false })
          .eq('customer_id', customerId)
          .eq('token', token)

        if (error) {
          console.error('❌ Error unregistering device:', error)
          return { success: false, error }
        }
      }

      console.log('✅ Device unregistered successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ Error unregistering device:', error)
      return { success: false, error }
    }
  }

  /**
   * Aggiorna preferenze notifiche
   */
  async updatePreferences(
    customerId: string,
    organizationId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            customer_id: customerId,
            organization_id: organizationId,
            ...preferences,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'customer_id,organization_id'
          }
        )

      if (error) {
        console.error('❌ Error updating notification preferences:', error)
        return { success: false, error }
      }

      console.log('✅ Notification preferences updated')
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating preferences:', error)
      return { success: false, error }
    }
  }

  /**
   * Ottieni preferenze notifiche
   */
  async getPreferences(customerId: string, organizationId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (error) {
        console.error('❌ Error fetching notification preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error fetching preferences:', error)
      return null
    }
  }

  /**
   * Ascolta messaggi in foreground (app aperta)
   */
  private setupForegroundMessageListener() {
    if (!this.messaging) {
      console.warn('⚠️ Messaging not initialized, cannot setup listener')
      return
    }

    console.log('✅ Setting up foreground message listener')

    onMessage(this.messaging, (payload) => {
      console.log('📩 Foreground message received:', payload)

      const { notification, data } = payload

      console.log('🔍 Notification object:', notification)
      console.log('🔍 Data object:', data)

      if (notification) {
        console.log('✅ Notification exists, calling showNotification...')
        // Mostra notifica personalizzata
        this.showNotification(
          notification.title || 'OmnilyPro',
          notification.body || '',
          notification.image,
          data
        )
      } else {
        console.warn('⚠️ No notification object in payload')
      }
    })
  }

  /**
   * Mostra notifica browser
   */
  private showNotification(title: string, body: string, image?: string, data?: any) {
    console.log('🔔 showNotification called:', { title, body, image, data })
    console.log('📊 Notification support:', this.isSupported())
    console.log('🔐 Notification permission:', Notification.permission)

    if (!this.isSupported()) {
      console.warn('⚠️ Notifications not supported')
      return
    }

    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted:', Notification.permission)
      return
    }

    try {
      const options: NotificationOptions = {
        body,
        icon: image || '/logo.png',
        badge: '/badge.png',
        data,
        requireInteraction: true, // FORZA la notifica a rimanere finché non viene chiusa
        tag: 'omnilypro-notification-' + Date.now(), // Tag unico per evitare che venga sostituita
        silent: false // Abilita il suono
      }

      console.log('✅ Creating notification with options:', options)
      const notification = new Notification(title, options)

      console.log('✅ Notification created successfully!')

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault()
        console.log('🖱️ Notification clicked')

        // Se c'è un deepLink, naviga
        if (data?.deepLink) {
          window.location.href = data.deepLink
        }

        notification.close()
      }

      // Log when notification is shown
      notification.onshow = () => {
        console.log('👁️ Notification shown on screen')
      }

      // Log errors
      notification.onerror = (error) => {
        console.error('❌ Notification error:', error)
      }
    } catch (error) {
      console.error('❌ Error creating notification:', error)
    }
  }

  /**
   * Ottieni piattaforma
   */
  private getPlatform(): 'ios' | 'android' | 'web' {
    const userAgent = navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios'
    } else if (/android/.test(userAgent)) {
      return 'android'
    }

    return 'web'
  }

  /**
   * Ottieni versione OS
   */
  private getOSVersion(): string {
    const userAgent = navigator.userAgent

    // iOS
    const iosMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/)
    if (iosMatch) {
      return `iOS ${iosMatch[1]}.${iosMatch[2]}.${iosMatch[3] || '0'}`
    }

    // Android
    const androidMatch = userAgent.match(/Android (\d+\.?\d*\.?\d*)/)
    if (androidMatch) {
      return `Android ${androidMatch[1]}`
    }

    // Desktop
    if (userAgent.includes('Mac OS X')) {
      const macMatch = userAgent.match(/Mac OS X (\d+)_(\d+)_?(\d+)?/)
      if (macMatch) {
        return `macOS ${macMatch[1]}.${macMatch[2]}.${macMatch[3] || '0'}`
      }
    }

    if (userAgent.includes('Windows NT')) {
      const winMatch = userAgent.match(/Windows NT (\d+\.\d+)/)
      if (winMatch) {
        return `Windows ${winMatch[1]}`
      }
    }

    return 'Unknown'
  }
}

export const notificationService = new NotificationService()
