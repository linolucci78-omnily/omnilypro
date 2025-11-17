import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Settings, Check } from 'lucide-react'

interface GDPRBannerProps {
  primaryColor: string
  organizationName: string
  privacyPolicyUrl?: string
  cookiePolicyUrl?: string
  position?: 'bottom' | 'top'
  showPreferences?: boolean
}

export const GDPRBanner: React.FC<GDPRBannerProps> = ({
  primaryColor,
  organizationName,
  privacyPolicyUrl,
  cookiePolicyUrl,
  position = 'bottom',
  showPreferences = true,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Cookie preferences
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    preferences: false,
  })

  useEffect(() => {
    // Check if user has already accepted/rejected cookies
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setIsVisible(true)
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(consent)
        setPreferences(savedPrefs)
      } catch (e) {
        // Invalid data, show banner again
        setIsVisible(true)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    }
    setPreferences(allAccepted)
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted))
    setIsVisible(false)
    setShowSettings(false)
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    }
    setPreferences(onlyNecessary)
    localStorage.setItem('cookie-consent', JSON.stringify(onlyNecessary))
    setIsVisible(false)
    setShowSettings(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences))
    setIsVisible(false)
    setShowSettings(false)
  }

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessary') return // Can't disable necessary cookies
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${
            position === 'bottom' ? 'bottom-0' : 'top-0'
          } left-0 right-0 z-50 px-4 py-4 md:px-6 md:py-6`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Main Banner */}
              {!showSettings ? (
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Icon and text */}
                    <div className="flex-1 flex gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <Cookie className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Questo sito utilizza i cookie
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Utilizziamo i cookie per personalizzare contenuti e annunci, per fornire funzionalità dei social media e per analizzare il nostro traffico. Condividiamo inoltre informazioni sul modo in cui utilizza il nostro sito con i nostri partner che si occupano di analisi dei dati web, pubblicità e social media.{' '}
                          {privacyPolicyUrl && (
                            <>
                              Consulta la nostra{' '}
                              <a
                                href={privacyPolicyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:no-underline"
                                style={{ color: primaryColor }}
                              >
                                Privacy Policy
                              </a>
                            </>
                          )}
                          {cookiePolicyUrl && (
                            <>
                              {' '}e la{' '}
                              <a
                                href={cookiePolicyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:no-underline"
                                style={{ color: primaryColor }}
                              >
                                Cookie Policy
                              </a>
                            </>
                          )}
                          .
                        </p>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      {showPreferences && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowSettings(true)}
                          className="px-6 py-3 rounded-xl border-2 font-semibold transition-all duration-300 hover:shadow-lg whitespace-nowrap"
                          style={{
                            borderColor: primaryColor,
                            color: primaryColor,
                          }}
                        >
                          <Settings className="w-4 h-4 inline mr-2" />
                          Preferenze
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRejectAll}
                        className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:shadow-lg hover:border-gray-400 whitespace-nowrap"
                      >
                        Rifiuta
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAcceptAll}
                        className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg whitespace-nowrap"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Accetta Tutto
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Settings Panel */
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Preferenze Cookie</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-8">
                    Personalizza le tue preferenze sui cookie. I cookie necessari sono sempre attivi.
                  </p>

                  <div className="space-y-4 mb-8">
                    {/* Necessary cookies */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">Cookie Necessari</h4>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                            Sempre Attivi
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Questi cookie sono essenziali per il funzionamento del sito web e non possono essere disabilitati.
                        </p>
                      </div>
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center ml-4"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <Check className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                    </div>

                    {/* Analytics cookies */}
                    <CookieToggle
                      title="Cookie Analitici"
                      description="Questi cookie ci aiutano a capire come i visitatori interagiscono con il sito raccogliendo e segnalando informazioni in forma anonima."
                      enabled={preferences.analytics}
                      onToggle={() => togglePreference('analytics')}
                      primaryColor={primaryColor}
                    />

                    {/* Marketing cookies */}
                    <CookieToggle
                      title="Cookie di Marketing"
                      description="Questi cookie vengono utilizzati per tracciare i visitatori attraverso i siti web per mostrare annunci pertinenti e coinvolgenti."
                      enabled={preferences.marketing}
                      onToggle={() => togglePreference('marketing')}
                      primaryColor={primaryColor}
                    />

                    {/* Preference cookies */}
                    <CookieToggle
                      title="Cookie di Preferenze"
                      description="Questi cookie permettono al sito di ricordare le scelte che fai per offrirti funzionalità più personalizzate."
                      enabled={preferences.preferences}
                      onToggle={() => togglePreference('preferences')}
                      primaryColor={primaryColor}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRejectAll}
                      className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:shadow-lg hover:border-gray-400"
                    >
                      Rifiuta Tutto
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSavePreferences}
                      className="flex-1 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Salva Preferenze
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAcceptAll}
                      className="flex-1 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Accetta Tutto
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Cookie toggle component
interface CookieToggleProps {
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  primaryColor: string
}

const CookieToggle: React.FC<CookieToggleProps> = ({
  title,
  description,
  enabled,
  onToggle,
  primaryColor,
}) => {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className="ml-4 relative w-14 h-8 rounded-full transition-all duration-300"
        style={{
          backgroundColor: enabled ? primaryColor : '#d1d5db',
        }}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
        />
      </button>
    </div>
  )
}
