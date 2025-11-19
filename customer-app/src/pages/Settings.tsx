import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bell, MapPin, Trash2 } from 'lucide-react'
import BottomNav from '../components/Layout/BottomNav'
import ChatButton from '../components/ChatButton'

export default function Settings() {
  const { customer } = useAuth()
  const navigate = useNavigate()
  const { slug } = useParams()

  const [pushEnabled, setPushEnabled] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    setShowDeleteModal(false)
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => navigate(`/${slug}/profile`)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">
          Impostazioni
        </h1>
      </div>

      {/* Settings List */}
      <div className="p-6 space-y-1">
        {/* Notifiche Push */}
        <div className="flex items-center justify-between py-4 px-1">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-gray-400" strokeWidth={2} />
            <span className="text-gray-900 font-semibold text-base">Notifiche Push</span>
          </div>
          <button
            onClick={() => setPushEnabled(!pushEnabled)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              pushEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                pushEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            ></div>
          </button>
        </div>

        {/* Localizzazione */}
        <div className="flex items-center justify-between py-4 px-1">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-gray-400" strokeWidth={2} />
            <span className="text-gray-900 font-semibold text-base">Localizzazione</span>
          </div>
          <button
            onClick={() => setLocationEnabled(!locationEnabled)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              locationEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                locationEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            ></div>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 my-6"></div>

        {/* Elimina Account */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3 py-4 px-1 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-6 h-6 text-red-600" strokeWidth={2} />
          <span className="text-red-600 font-bold text-base">Elimina Account</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-6"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Elimina Account
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e perderai tutti i tuoi punti e premi.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-base hover:bg-red-700 transition-colors"
              >
                Elimina Definitivamente
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-xl font-bold text-base hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat button */}
      <ChatButton />

      <BottomNav />
    </div>
  )
}
