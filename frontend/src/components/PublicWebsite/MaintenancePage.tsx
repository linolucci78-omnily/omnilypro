import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Clock, Mail, Phone, MapPin } from 'lucide-react'

interface MaintenancePageProps {
  organizationName: string
  message?: string
  estimatedReturn?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  email?: string
  phone?: string
  address?: string
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  organizationName,
  message,
  estimatedReturn,
  logoUrl,
  primaryColor = '#dc2626',
  secondaryColor = '#ef4444',
  email,
  phone,
  address,
}) => {
  const [dots, setDots] = useState('')

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const defaultMessage = message || 'Stiamo lavorando per migliorare la tua esperienza. Torneremo presto online!'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}05 100%)`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Logo */}
          {logoUrl && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8"
            >
              <img
                src={logoUrl}
                alt={organizationName}
                className="max-w-xs mx-auto h-20 object-contain"
              />
            </motion.div>
          )}

          {/* Icon */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-6"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
              }}
            >
              <Settings
                className="w-12 h-12"
                style={{ color: primaryColor }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: primaryColor }}
          >
            Sito in Manutenzione{dots}
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 mb-8 leading-relaxed"
          >
            {defaultMessage}
          </motion.p>

          {/* Estimated Return */}
          {estimatedReturn && estimatedReturn.trim() !== '' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-full mb-8"
            >
              <Clock className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="text-gray-700 font-medium">
                Ritorno previsto: <strong>{new Date(estimatedReturn).toLocaleString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong>
              </span>
            </motion.div>
          )}

          {/* Contact Info */}
          {(email || phone || address) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="border-t border-gray-200 pt-8 mt-8"
            >
              <p className="text-gray-500 text-sm mb-4 font-semibold uppercase tracking-wider">
                Hai bisogno di aiuto?
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-4 text-sm">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                    {email}
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                    {phone}
                  </a>
                )}
                {address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                    {address}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-gray-400 text-sm"
          >
            © {new Date().getFullYear()} {organizationName}. Tutti i diritti riservati.
          </motion.p>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full opacity-10"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
