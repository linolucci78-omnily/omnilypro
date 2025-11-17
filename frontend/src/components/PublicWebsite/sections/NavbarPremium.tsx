import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, Phone, Mail, MapPin } from 'lucide-react'

interface CustomSection {
  id: string
  title: string
  content: string
  visible: boolean
  menuLabel: string
  order: number
}

interface NavbarPremiumProps {
  name: string
  logo?: string
  primaryColor: string
  email?: string
  phone?: string
  showAbout?: boolean
  showServices?: boolean
  showGallery?: boolean
  showLoyalty?: boolean
  showTestimonials?: boolean
  showPricing?: boolean
  showTeam?: boolean
  showVideo?: boolean
  customSections?: CustomSection[]
  showPoweredBy?: boolean
}

export const NavbarPremium: React.FC<NavbarPremiumProps> = ({
  name,
  logo,
  primaryColor,
  email,
  phone,
  showAbout,
  showServices,
  showGallery,
  showLoyalty,
  showTestimonials,
  showPricing,
  showTeam,
  showVideo,
  customSections = [],
  showPoweredBy = true,
}) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Build navigation items dynamically
  const baseNavItems = [
    { label: 'Home', href: '#hero', show: true, order: 0 },
    { label: 'Chi Siamo', href: '#about', show: showAbout, order: 1 },
    { label: 'Servizi', href: '#services', show: showServices, order: 2 },
    { label: 'Gallery', href: '#gallery', show: showGallery, order: 3 },
    { label: 'Programma Fedeltà', href: '#loyalty', show: showLoyalty, order: 4 },
    { label: 'Recensioni', href: '#testimonials', show: showTestimonials, order: 5 },
    { label: 'Listino', href: '#pricing', show: showPricing, order: 6 },
    { label: 'Team', href: '#team', show: showTeam, order: 7 },
    { label: 'Video', href: '#video', show: showVideo, order: 8 },
  ]

  // Add custom sections to navigation
  const customNavItems = customSections
    .filter(section => section.visible)
    .map(section => ({
      label: section.menuLabel || section.title,
      href: `#custom-${section.id}`,
      show: true,
      order: 100 + section.order, // Place custom sections after standard ones
    }))

  // Combine and add Contatti at the end
  const navItems = [
    ...baseNavItems,
    ...customNavItems,
    { label: 'Contatti', href: '#contact', show: true, order: 999 },
  ]
    .filter(item => item.show)
    .sort((a, b) => a.order - b.order)

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Top bar with contact info */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2 px-6 text-sm"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">{email}</span>
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">{phone}</span>
              </a>
            )}
          </div>
          {showPoweredBy && (
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden md:inline">Powered by</span>
              <span style={{ color: primaryColor }} className="font-bold">OMNILY PRO</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main navbar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/50'
            : 'bg-transparent'
        }`}
        style={{ marginTop: isScrolled ? 0 : '40px' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => scrollToSection('#hero')}
            >
              {logo && (
                <div
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                    border: `2px solid ${primaryColor}30`,
                  }}
                >
                  <img src={logo} alt={name} className="w-8 h-8 object-contain" />
                </div>
              )}
              <div>
                <h2
                  className={`text-xl font-bold transition-colors ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  {name}
                </h2>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection(item.href)
                  }}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  {item.label}
                </motion.a>
              ))}
            </div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => scrollToSection('#contact')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden lg:block px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              }}
            >
              Inizia Ora
            </motion.button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                isScrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[120px] left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-200"
          >
            <div className="px-6 py-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection(item.href)
                  }}
                  href={item.href}
                  className="block px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
                onClick={() => scrollToSection('#contact')}
                className="w-full px-6 py-3 rounded-xl font-bold text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                }}
              >
                Inizia Ora
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
