import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Clock,
  Sparkles,
} from 'lucide-react'

interface ContactSectionPremiumProps {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  primaryColor: string
  showContactForm?: boolean
  showMap?: boolean
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  openingHours?: any
  onSubmitContact?: (data: any) => Promise<void>
  bgType?: string
  bgColor?: string
  bgGradientStart?: string
  bgGradientEnd?: string
  bgImage?: string
  enableParallax?: boolean
  enableOverlay?: boolean
  overlayColor?: string
  overlayOpacity?: number
  textColor?: string
}

export const ContactSectionPremium: React.FC<ContactSectionPremiumProps> = ({
  name,
  email,
  phone,
  address,
  city,
  postalCode,
  primaryColor,
  showContactForm = true,
  showMap = true,
  facebookUrl,
  instagramUrl,
  twitterUrl,
  linkedinUrl,
  youtubeUrl,
  openingHours,
  onSubmitContact,
  bgType = 'color',
  bgColor = '#ffffff',
  bgGradientStart = '#ffffff',
  bgGradientEnd = '#f8fafc',
  bgImage,
  enableParallax = false,
  enableOverlay = false,
  overlayColor = '#000000',
  overlayOpacity = 0.5,
  textColor = '#1f2937',
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Parallax effect
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log('📧 ContactForm: Submitting...', formData)

    try {
      if (onSubmitContact) {
        console.log('📧 ContactForm: Calling onSubmitContact...')
        await onSubmitContact(formData)
        console.log('✅ ContactForm: onSubmitContact completed successfully')
      } else {
        console.warn('⚠️ ContactForm: No onSubmitContact handler provided')
      }
      setIsSubmitted(true)
      setShowSuccessToast(true)
      console.log('✅ ContactForm: Form submitted, showing success message')
      setFormData({ name: '', email: '', phone: '', message: '' })
      setTimeout(() => {
        setIsSubmitted(false)
        setShowSuccessToast(false)
      }, 5000)
    } catch (error) {
      console.error('❌ ContactForm: Error submitting contact form:', error)
      alert('Errore durante l\'invio del messaggio. Riprova più tardi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  // Calculate background
  const getBackground = () => {
    if (bgType === 'color') {
      return bgColor
    } else if (bgType === 'gradient') {
      return `linear-gradient(180deg, ${bgGradientStart} 0%, ${bgGradientEnd} 100%)`
    } else if (bgType === 'image' && bgImage) {
      return `url(${bgImage})`
    }
    return bgColor
  }

  const fullAddress = [address, city, postalCode].filter(Boolean).join(', ')

  const socialLinks = [
    { icon: Facebook, url: facebookUrl, label: 'Facebook' },
    { icon: Instagram, url: instagramUrl, label: 'Instagram' },
    { icon: Twitter, url: twitterUrl, label: 'Twitter' },
    { icon: Linkedin, url: linkedinUrl, label: 'LinkedIn' },
    { icon: Youtube, url: youtubeUrl, label: 'YouTube' },
  ].filter((social) => social.url)

  const daysMap: { [key: string]: string } = {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica',
  }

  return (
    <section
      id="contact"
      className="relative py-32 overflow-hidden"
      style={{
        background: bgType === 'image' ? 'transparent' : getBackground(),
      }}
    >
      {/* Background image with overlay and parallax */}
      {bgType === 'image' && bgImage && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute inset-0 w-full h-[120%]"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              y: enableParallax ? y : 0,
            }}
          />
          {enableOverlay && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: overlayColor,
                opacity: overlayOpacity,
              }}
            />
          )}
        </div>
      )}

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 right-0 w-1/2 h-1/2"
          style={{
            background: `radial-gradient(circle, ${primaryColor}, transparent)`,
          }}
        />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-20"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 mb-6"
          >
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold text-gray-700">Contatti</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-black mb-6" style={{ color: textColor }}>
            Mettiti in{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
            >
              Contatto
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl max-w-3xl mx-auto" style={{ color: textColor, opacity: 0.8 }}>
            Siamo qui per aiutarti. Contattaci per qualsiasi domanda o informazione
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Contact Info Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="lg:col-span-1 space-y-6"
          >
            {/* Email */}
            {email && (
              <motion.a
                variants={itemVariants}
                href={`mailto:${email}`}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                >
                  <Mail className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 font-medium">Email</div>
                  <div className="text-gray-900 font-semibold group-hover:text-gray-700">{email}</div>
                </div>
              </motion.a>
            )}

            {/* Phone */}
            {phone && (
              <motion.a
                variants={itemVariants}
                href={`tel:${phone}`}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                >
                  <Phone className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 font-medium">Telefono</div>
                  <div className="text-gray-900 font-semibold group-hover:text-gray-700">{phone}</div>
                </div>
              </motion.a>
            )}

            {/* Address */}
            {fullAddress && (
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white shadow-lg border border-gray-100"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                >
                  <MapPin className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 font-medium mb-1">Indirizzo</div>
                  <div className="text-gray-900 font-semibold">{fullAddress}</div>
                </div>
              </motion.div>
            )}

            {/* Opening Hours */}
            {openingHours && Object.keys(openingHours).length > 0 && (
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02, x: 5 }}
                className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                  >
                    <Clock className="w-7 h-7" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">Orari di Apertura</div>
                </div>
                <div className="space-y-2">
                  {Object.entries(openingHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">{daysMap[day]}</span>
                      <span className="text-gray-900 font-semibold">
                        {hours.closed ? 'Chiuso' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <motion.div variants={itemVariants} className="flex gap-3 justify-center lg:justify-start">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-white hover:shadow-xl transition-all"
                    style={{
                      ['--hover-bg' as any]: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white'
                    }}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Contact Form */}
          {showContactForm && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="lg:col-span-2"
            >
              <div className="relative p-8 md:p-12 rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                {/* Decorative gradient */}
                <div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
                  style={{ background: primaryColor }}
                />

                <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nome *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-transparent focus:ring-2 transition-all"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Il tuo nome"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-transparent focus:ring-2 transition-all"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="tua@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-transparent focus:ring-2 transition-all"
                      style={{ ['--tw-ring-color' as any]: primaryColor }}
                      placeholder="Il tuo numero"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Messaggio *</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-transparent focus:ring-2 transition-all resize-none"
                      style={{ ['--tw-ring-color' as any]: primaryColor }}
                      placeholder="Come possiamo aiutarti?"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting || isSubmitted}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-8 py-4 rounded-xl font-bold text-lg text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                  >
                    {isSubmitted ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        Messaggio Inviato!
                      </>
                    ) : isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        Invia Messaggio
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </div>

        {/* Map */}
        {showMap && fullAddress && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200"
          >
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(fullAddress)}`}
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />
          </motion.div>
        )}
      </div>

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed bottom-8 right-8 z-50"
          style={{ maxWidth: '400px' }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 border-l-4"
            style={{
              borderLeftColor: primaryColor,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: `${primaryColor}15` }}
              >
                <CheckCircle className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1" style={{ color: primaryColor }}>
                  Messaggio Inviato!
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Grazie per averci contattato. Riceverai una email di conferma e ti risponderemo il prima possibile.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Chiudi notifica"
              >
                <span className="text-gray-400 text-xl leading-none">&times;</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  )
}
