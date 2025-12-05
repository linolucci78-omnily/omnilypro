/**
 * Firebase Configuration for OmnilyPro
 * Cloud Messaging (FCM) for Push Notifications
 */

import { initializeApp, FirebaseApp } from 'firebase/app'
import { getMessaging, Messaging } from 'firebase/messaging'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

/**
 * Initializza Firebase App
 */
export const initializeFirebase = () => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig)
      console.log('✅ Firebase initialized')
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error)
    }
  }
  return app
}

/**
 * Ottieni Messaging instance
 * Solo per browser che supportano Service Worker
 */
export const getFirebaseMessaging = (): Messaging | null => {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported in this browser')
    return null
  }

  if (!messaging) {
    try {
      const firebaseApp = initializeFirebase()
      if (firebaseApp) {
        messaging = getMessaging(firebaseApp)
        console.log('✅ Firebase Messaging initialized')

        // Registra Service Worker per notifiche in background
        registerServiceWorker()
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase Messaging:', error)
    }
  }

  return messaging
}

/**
 * Registra Service Worker per Firebase Cloud Messaging
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('✅ Service Worker registered:', registration)
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  }
}

// Auto-initialize on import
initializeFirebase()
