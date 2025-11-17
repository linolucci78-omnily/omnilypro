import React, { useState } from 'react'

interface ContactSectionProps {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  primaryColor: string
  showContactForm: boolean
  showMap: boolean
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  openingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean }
  }
  onSubmitContact?: (data: any) => Promise<void>
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  name,
  email,
  phone,
  address,
  city,
  postalCode,
  primaryColor,
  showContactForm,
  showMap,
  facebookUrl,
  instagramUrl,
  twitterUrl,
  linkedinUrl,
  youtubeUrl,
  tiktokUrl,
  openingHours,
  onSubmitContact,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (onSubmitContact) {
        await onSubmitContact(formData)
      }
      setSubmitSuccess(true)
      setFormData({ name: '', email: '', phone: '', message: '' })
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fullAddress = [address, city, postalCode].filter(Boolean).join(', ')
  const mapUrl = fullAddress
    ? `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(fullAddress)}`
    : null

  const socialLinks = [
    { url: facebookUrl, icon: 'facebook', name: 'Facebook' },
    { url: instagramUrl, icon: 'instagram', name: 'Instagram' },
    { url: twitterUrl, icon: 'twitter', name: 'Twitter' },
    { url: linkedinUrl, icon: 'linkedin', name: 'LinkedIn' },
    { url: youtubeUrl, icon: 'youtube', name: 'YouTube' },
    { url: tiktokUrl, icon: 'tiktok', name: 'TikTok' },
  ].filter((link) => link.url)

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayNames: { [key: string]: string } = {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica',
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-6"
            style={{ color: primaryColor }}
          >
            Contattaci
          </h2>

          <div className="w-24 h-1 mx-auto mb-16" style={{ backgroundColor: primaryColor }}></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Informazioni di Contatto</h3>

              <div className="space-y-6">
                {email && (
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-4 mt-1 flex-shrink-0" style={{ color: primaryColor }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700">Email</p>
                      <a href={`mailto:${email}`} className="text-gray-600 hover:underline">
                        {email}
                      </a>
                    </div>
                  </div>
                )}

                {phone && (
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-4 mt-1 flex-shrink-0" style={{ color: primaryColor }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700">Telefono</p>
                      <a href={`tel:${phone}`} className="text-gray-600 hover:underline">
                        {phone}
                      </a>
                    </div>
                  </div>
                )}

                {fullAddress && (
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-4 mt-1 flex-shrink-0" style={{ color: primaryColor }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-700">Indirizzo</p>
                      <p className="text-gray-600">{fullAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Opening Hours */}
              {openingHours && Object.keys(openingHours).length > 0 && (
                <div className="mt-8">
                  <h4 className="text-xl font-bold mb-4 text-gray-800">Orari di Apertura</h4>
                  <div className="space-y-2">
                    {daysOrder.map((day) => {
                      const hours = openingHours[day]
                      if (!hours) return null
                      return (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{dayNames[day]}</span>
                          <span className="text-gray-600">
                            {hours.closed ? 'Chiuso' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-xl font-bold mb-4 text-gray-800">Seguici</h4>
                  <div className="flex gap-4">
                    {socialLinks.map((social) => (
                      <a
                        key={social.icon}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white transform hover:scale-110 transition-transform"
                        style={{ backgroundColor: primaryColor }}
                        aria-label={social.name}
                      >
                        <span className="text-xl">
                          {social.icon === 'facebook' && 'f'}
                          {social.icon === 'instagram' && '📷'}
                          {social.icon === 'twitter' && '🐦'}
                          {social.icon === 'linkedin' && 'in'}
                          {social.icon === 'youtube' && '▶'}
                          {social.icon === 'tiktok' && '♪'}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Inviaci un Messaggio</h3>

                {submitSuccess && (
                  <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                    Messaggio inviato con successo! Ti contatteremo presto.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
                      style={{ focusRingColor: primaryColor }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isSubmitting ? 'Invio in corso...' : 'Invia Messaggio'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Map */}
          {showMap && mapUrl && (
            <div className="mt-16">
              <iframe
                src={mapUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-2xl shadow-lg"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
