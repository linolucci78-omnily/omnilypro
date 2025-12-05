/**
 * Firebase Cloud Messaging Service Worker
 * Gestisce le notifiche push in background
 */

// Importa Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Configurazione Firebase (stesse credenziali del .env)
const firebaseConfig = {
  apiKey: 'AIzaSyCYj8kSe6RMOo7joVFp-l-LOvCkI_6gyJ8',
  authDomain: 'omnilypro.firebaseapp.com',
  projectId: 'omnilypro',
  storageBucket: 'omnilypro.firebasestorage.app',
  messagingSenderId: '499753977496',
  appId: '1:499753977496:web:b2a19b0efa166dda56b2ed'
}

// Inizializza Firebase
firebase.initializeApp(firebaseConfig)

// Recupera messaging instance
const messaging = firebase.messaging()

// Gestisce notifiche in background (app chiusa o in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'OmnilyPro'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo.png',
    badge: '/badge.png',
    image: payload.notification?.image,
    data: payload.data,
    vibrate: [200, 100, 200],
    tag: payload.data?.notificationId || 'default',
    requireInteraction: false
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Gestisce click sulla notifica
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification)

  event.notification.close()

  // Se c'è un deepLink, apri quella pagina
  const clickAction = event.notification.data?.deepLink || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta, portala in primo piano
      for (const client of clientList) {
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus()
        }
      }

      // Altrimenti apri una nuova finestra
      if (clients.openWindow) {
        return clients.openWindow(clickAction)
      }
    })
  )
})
