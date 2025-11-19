import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Calendar } from 'lucide-react'
import BottomNav from '../components/Layout/BottomNav'
import ChatButton from '../components/ChatButton'

export default function AccountDetails() {
  const { customer } = useAuth()
  const navigate = useNavigate()
  const { slug } = useParams()

  const [name, setName] = useState(customer?.name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving:', { name, email, phone })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => navigate(`/${slug}/profile`)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">
          Dettagli Account
        </h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Avatar Section */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 p-1 shadow-xl mb-4">
            <div className="w-full h-full rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <button className="text-red-600 font-bold text-sm hover:text-red-700">
            Cambia Foto
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">
              Nome Completo
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent"
              />
            </div>
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">
              Telefono
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+39 123 456 7890"
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent"
              />
            </div>
          </div>

          {/* Data Creazione (Read Only) */}
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">
              Membro da
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={new Date(customer.created_at).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                disabled
                className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 text-base cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
        >
          Salva Modifiche
        </button>
      </div>

      {/* Chat button */}
      <ChatButton />

      <BottomNav />
    </div>
  )
}
