import { X } from 'lucide-react'

interface Notification {
  id: string
  type: 'points' | 'offer' | 'coupon'
  title: string
  message: string
  time: string
  read: boolean
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'points',
      title: 'Punti in arrivo!',
      message: 'Hai guadagnato 50 punti con il tuo ultimo acquisto.',
      time: '2 min fa',
      read: false
    },
    {
      id: '2',
      type: 'offer',
      title: 'Offerta Flash',
      message: 'Solo per oggi: doppio punteggio su tutti i caffè.',
      time: '1 ora fa',
      read: false
    },
    {
      id: '3',
      type: 'coupon',
      title: 'Coupon in scadenza',
      message: 'Il tuo coupon Colazione scade tra 2 giorni.',
      time: '1 giorno fa',
      read: true
    }
  ]

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read')
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      <div className="fixed inset-x-0 top-0 bottom-0 bg-white z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Notifiche</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={notification.read ? 'bg-white border-gray-200 rounded-2xl p-4 border' : 'bg-red-50 border-red-100 rounded-2xl p-4 border'}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={notification.read ? 'font-bold text-gray-900' : 'font-bold text-red-600'}>
                  {notification.title}
                </h3>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {notification.time}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {notification.message}
              </p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleMarkAllAsRead}
            className="w-full text-center py-3 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors"
          >
            Segna tutte come lette
          </button>
        </div>
      </div>
    </>
  )
}
