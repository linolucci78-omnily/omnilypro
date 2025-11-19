import OneSignal from 'react-onesignal'

// =====================================================
// OneSignal Configuration
// =====================================================
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID'

let isInitialized = false

// =====================================================
// Initialize OneSignal
// =====================================================
export async function initializeOneSignal() {
  if (isInitialized) {
    console.log('OneSignal already initialized')
    return
  }

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // For development

      // Prompt settings
      notifyButton: {
        enable: false // We'll use custom UI
      },

      // Service Worker settings
      serviceWorkerParam: {
        scope: '/push/onesignal/'
      },
      serviceWorkerPath: 'OneSignalSDKWorker.js'
    })

    isInitialized = true
    console.log('OneSignal initialized successfully')

    // Setup notification handlers
    setupNotificationHandlers()
  } catch (error) {
    console.error('Error initializing OneSignal:', error)
  }
}

// =====================================================
// Setup Notification Event Handlers
// =====================================================
function setupNotificationHandlers() {
  // Handle notification received (foreground)
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
    console.log('Notification will display (foreground):', event)

    // You can prevent the notification and show custom UI
    // event.preventDefault()
    // showCustomNotification(event.notification)
  })

  // Handle notification clicked
  OneSignal.Notifications.addEventListener('click', (event) => {
    console.log('Notification clicked:', event)

    const data = event.notification.additionalData

    if (data) {
      handleNotificationAction(data)
    }
  })
}

// =====================================================
// Handle Notification Actions
// =====================================================
function handleNotificationAction(data: any) {
  const { type, animation_type, animation_data, url } = data

  // Trigger animations
  if (animation_type) {
    triggerAnimation(animation_type, animation_data)
  }

  // Navigate to URL if provided
  if (url) {
    window.location.href = url
  }

  // Dispatch custom event for app to handle
  window.dispatchEvent(new CustomEvent('onesignal-notification-action', {
    detail: data
  }))
}

// =====================================================
// Trigger Animations
// =====================================================
function triggerAnimation(type: string, data: any = {}) {
  console.log('Triggering animation:', type, data)

  window.dispatchEvent(new CustomEvent('onesignal-animation', {
    detail: { type, data }
  }))
}

// =====================================================
// User Management
// =====================================================

/**
 * Set user as logged in with custom tags
 */
export async function setUserLoggedIn(userId: string, organizationId: string, tier?: string) {
  try {
    // Set external user ID (your database customer ID)
    await OneSignal.login(userId)

    // Add tags for segmentation
    await OneSignal.User.addTags({
      organization_id: organizationId,
      customer_id: userId,
      tier: tier || 'bronze',
      app_version: '1.0.0',
      platform: 'web'
    })

    console.log('OneSignal user logged in:', userId)
  } catch (error) {
    console.error('Error setting OneSignal user:', error)
  }
}

/**
 * Update user tier when it changes
 */
export async function updateUserTier(tier: string) {
  try {
    await OneSignal.User.addTag('tier', tier)
    console.log('OneSignal user tier updated:', tier)
  } catch (error) {
    console.error('Error updating user tier:', error)
  }
}

/**
 * Log out user
 */
export async function logoutUser() {
  try {
    await OneSignal.logout()
    console.log('OneSignal user logged out')
  } catch (error) {
    console.error('Error logging out OneSignal user:', error)
  }
}

// =====================================================
// Permission Management
// =====================================================

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await OneSignal.Notifications.requestPermission()
    console.log('Notification permission:', permission)
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const permission = await OneSignal.Notifications.permission
    return permission
  } catch (error) {
    console.error('Error checking notification permission:', error)
    return false
  }
}

/**
 * Get push subscription state
 */
export async function getPushSubscriptionState() {
  try {
    const isPushSupported = await OneSignal.Notifications.isPushSupported()
    const permission = await OneSignal.Notifications.permission
    const optedIn = OneSignal.User.PushSubscription.optedIn

    return {
      isPushSupported,
      permission,
      optedIn
    }
  } catch (error) {
    console.error('Error getting push subscription state:', error)
    return {
      isPushSupported: false,
      permission: false,
      optedIn: false
    }
  }
}

// =====================================================
// Test Functions (for development)
// =====================================================

/**
 * Send test notification (simulates server-side call)
 * NOTE: This is just for local testing - actual notifications should be sent from backend
 */
export function simulateNotification(type: string) {
  const testNotifications: Record<string, any> = {
    points: {
      type: 'points_earned',
      animation_type: 'points',
      animation_data: { points: 50 }
    },
    tier_upgrade: {
      type: 'tier_upgrade',
      animation_type: 'trophy',
      animation_data: { tier: 'gold' }
    },
    confetti: {
      type: 'celebration',
      animation_type: 'confetti',
      animation_data: {}
    }
  }

  const data = testNotifications[type]
  if (data) {
    handleNotificationAction(data)
  }
}

// Export default service
export default {
  initialize: initializeOneSignal,
  setUserLoggedIn,
  updateUserTier,
  logoutUser,
  requestNotificationPermission,
  areNotificationsEnabled,
  getPushSubscriptionState,
  simulateNotification
}
