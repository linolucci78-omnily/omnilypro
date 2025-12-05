/**
 * Test Script per inviare una notifica push tramite Firebase Cloud Messaging
 *
 * Usage:
 *   node test-push-notification.js <FCM_TOKEN> <SERVER_KEY>
 *
 * Example:
 *   node test-push-notification.js "cLtzt__OyQHFQ3Dg93GR3L:APA91b..." "AAAAxxxxxxx..."
 */

const TOKEN = process.argv[2]
const SERVER_KEY = process.argv[3]

if (!TOKEN || !SERVER_KEY) {
  console.error('❌ Usage: node test-push-notification.js <FCM_TOKEN> <SERVER_KEY>')
  process.exit(1)
}

const message = {
  to: TOKEN,
  notification: {
    title: '🎉 Test OmnilyPro',
    body: 'La tua prima notifica push funziona!',
    icon: '/logo.png',
    badge: '/badge.png',
    click_action: 'http://localhost:5174/demo'
  },
  data: {
    notificationId: 'test-' + Date.now(),
    deepLink: '/demo/rewards',
    customData: 'Test notification from OmnilyPro'
  }
}

console.log('📤 Invio notifica push...')
console.log('Token:', TOKEN.substring(0, 30) + '...')

fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `key=${SERVER_KEY}`
  },
  body: JSON.stringify(message)
})
  .then(res => res.json())
  .then(data => {
    console.log('\n✅ Risposta FCM:')
    console.log(JSON.stringify(data, null, 2))

    if (data.success === 1) {
      console.log('\n🎉 Notifica inviata con successo!')
      console.log('Message ID:', data.results[0].message_id)
    } else {
      console.log('\n❌ Errore invio notifica')
      console.log('Error:', data.results[0].error)
    }
  })
  .catch(error => {
    console.error('\n❌ Errore:', error.message)
  })
