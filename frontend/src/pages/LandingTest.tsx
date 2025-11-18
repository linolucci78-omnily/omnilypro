import React, { useState } from 'react'
import { Rocket, Star, Zap, ArrowRight, TrendingUp, Users, Award, Sparkles } from 'lucide-react'

const LandingTest: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'dark' | 'light' | 'toggle'>('dark')
  const [toggleMode, setToggleMode] = useState<'dark' | 'light'>('dark')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Selector */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
            🎨 Landing Page Design Test
          </h1>
          <p className="text-gray-600 mb-4">Scegli il design che preferisci:</p>
          <div className="flex gap-3 flex-wrap">
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedView === 'dark'
                  ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/50 scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setSelectedView('dark')}
            >
              🌙 Dark Mode Fisso
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedView === 'light'
                  ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-lg shadow-orange-400/50 scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setSelectedView('light')}
            >
              ☀️ Light Mode Fisso
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedView === 'toggle'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/50 scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setSelectedView('toggle')}
            >
              🔄 Toggle Dark/Light
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="pt-40 pb-20">
        {/* DARK MODE - SUPER SPAZIALE 🌙 */}
        {selectedView === 'dark' && (
          <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
            {/* Animated Particles Background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-20">
              {/* Hero Badge */}
              <div className="flex justify-center mb-8 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-red-500/20">
                  <Sparkles size={14} className="text-red-400 animate-pulse" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                    Piattaforma #1 in Italia
                  </span>
                </div>
              </div>

              {/* Hero Title */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-center mb-6 animate-fade-in-up">
                <span className="text-white">Il Futuro della</span>
                <br />
                <span className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 bg-clip-text text-transparent animate-gradient">
                  Customer Loyalty
                </span>
              </h1>

              {/* Hero Description */}
              <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto mb-12 animate-fade-in-up delay-100">
                OMNILY PRO è l'ecosistema completo Hardware + Software + AI che trasforma i tuoi clienti in fan fedeli
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 justify-center mb-20 animate-fade-in-up delay-200">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <Rocket size={24} className="group-hover:rotate-12 transition-transform" />
                    <span>Inizia Gratis</span>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
                <button className="px-8 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl font-bold text-lg border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 shadow-lg">
                  Vedi Demo
                </button>
              </div>

              {/* Glassmorphic Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 animate-fade-in-up delay-300">
                {/* Revenue Card */}
                <div className="group relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/50 group-hover:scale-110 transition-transform">
                      <TrendingUp size={28} className="text-white" />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">€125.4K</div>
                    <div className="text-gray-400 font-medium mb-3">Revenue Mensile</div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                      +42.5%
                    </div>
                  </div>
                </div>

                {/* Customers Card */}
                <div className="group relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                      <Users size={28} className="text-white" />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">8,542</div>
                    <div className="text-gray-400 font-medium mb-3">Clienti Attivi</div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                      +18.2%
                    </div>
                  </div>
                </div>

                {/* Retention Card */}
                <div className="group relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                      <Award size={28} className="text-white" />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">87.3%</div>
                    <div className="text-gray-400 font-medium mb-3">Retention Rate</div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                      +12.8%
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="animate-fade-in-up delay-400">
                <h2 className="text-4xl md:text-5xl font-black text-center text-white mb-12">
                  Funzionalità <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Premium</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-red-500/50 hover:scale-105 transition-all duration-500">
                    <Zap size={48} className="text-red-500 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    <h3 className="text-2xl font-bold text-white mb-3">Setup Istantaneo</h3>
                    <p className="text-gray-400">Operativo in 24 ore con il nostro wizard guidato</p>
                  </div>
                  <div className="group p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-pink-500/50 hover:scale-105 transition-all duration-500">
                    <Star size={48} className="text-pink-500 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    <h3 className="text-2xl font-bold text-white mb-3">AI Predictive</h3>
                    <p className="text-gray-400">Intelligenza artificiale per prevedere i comportamenti</p>
                  </div>
                  <div className="group p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-orange-500/50 hover:scale-105 transition-all duration-500">
                    <Rocket size={48} className="text-orange-500 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    <h3 className="text-2xl font-bold text-white mb-3">Hardware Integrato</h3>
                    <p className="text-gray-400">Lettore NFC e stampante termica inclusi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIGHT MODE - MODERNO E PULITO ☀️ */}
        {selectedView === 'light' && (
          <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 overflow-hidden">
            {/* Decorative Gradients */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-red-200/40 to-pink-200/40 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-20">
              {/* Hero Badge */}
              <div className="flex justify-center mb-8 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 shadow-lg">
                  <Sparkles size={14} className="text-red-600 animate-pulse" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Piattaforma #1 in Italia
                  </span>
                </div>
              </div>

              {/* Hero Title */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-center mb-6 animate-fade-in-up">
                <span className="text-gray-900">Il Futuro della</span>
                <br />
                <span className="bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Customer Loyalty
                </span>
              </h1>

              {/* Hero Description */}
              <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-12 animate-fade-in-up delay-100">
                OMNILY PRO è l'ecosistema completo Hardware + Software + AI che trasforma i tuoi clienti in fan fedeli
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 justify-center mb-20 animate-fade-in-up delay-200">
                <button className="group px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <Rocket size={24} className="group-hover:rotate-12 transition-transform" />
                    <span>Inizia Gratis</span>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
                <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-gray-300 hover:scale-105 transition-all duration-300 shadow-lg">
                  Vedi Demo
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 animate-fade-in-up delay-300">
                <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-red-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                    <TrendingUp size={28} className="text-white" />
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">€125.4K</div>
                  <div className="text-gray-600 font-medium mb-3">Revenue Mensile</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                    +42.5%
                  </div>
                </div>

                <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-blue-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <Users size={28} className="text-white" />
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">8,542</div>
                  <div className="text-gray-600 font-medium mb-3">Clienti Attivi</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                    +18.2%
                  </div>
                </div>

                <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-purple-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                    <Award size={28} className="text-white" />
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">87.3%</div>
                  <div className="text-gray-600 font-medium mb-3">Retention Rate</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                    +12.8%
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="animate-fade-in-up delay-400">
                <h2 className="text-4xl md:text-5xl font-black text-center text-gray-900 mb-12">
                  Funzionalità <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Premium</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-red-300 hover:scale-105 hover:shadow-xl transition-all duration-500">
                    <Zap size={48} className="text-red-600 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Setup Istantaneo</h3>
                    <p className="text-gray-600">Operativo in 24 ore con il nostro wizard guidato</p>
                  </div>
                  <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-pink-300 hover:scale-105 hover:shadow-xl transition-all duration-500">
                    <Star size={48} className="text-pink-600 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Predictive</h3>
                    <p className="text-gray-600">Intelligenza artificiale per prevedere i comportamenti</p>
                  </div>
                  <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-orange-300 hover:scale-105 hover:shadow-xl transition-all duration-500">
                    <Rocket size={48} className="text-orange-600 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Hardware Integrato</h3>
                    <p className="text-gray-600">Lettore NFC e stampante termica inclusi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOGGLE MODE - BEST OF BOTH WORLDS 🔄 */}
        {selectedView === 'toggle' && (
          <div className={`relative min-h-screen overflow-hidden transition-all duration-700 ${
            toggleMode === 'dark'
              ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
              : 'bg-gradient-to-br from-orange-50 via-white to-pink-50'
          }`}>
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
              {toggleMode === 'dark' ? (
                <>
                  <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-red-200/40 to-pink-200/40 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full blur-3xl"></div>
                </>
              )}
            </div>

            {/* Toggle Switch */}
            <div className="relative flex justify-center pt-8 mb-8">
              <button
                onClick={() => setToggleMode(toggleMode === 'dark' ? 'light' : 'dark')}
                className={`relative w-20 h-10 rounded-full transition-all duration-500 ${
                  toggleMode === 'dark' ? 'bg-gray-700' : 'bg-orange-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-lg ${
                  toggleMode === 'dark'
                    ? 'translate-x-10 bg-gray-900'
                    : 'translate-x-0 bg-white'
                }`}>
                  {toggleMode === 'dark' ? '🌙' : '☀️'}
                </div>
              </button>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-12">
              {/* Hero Badge */}
              <div className="flex justify-center mb-8 animate-fade-in">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg transition-all duration-500 ${
                  toggleMode === 'dark'
                    ? 'bg-white/5 backdrop-blur-xl border-white/10 shadow-red-500/20'
                    : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200'
                }`}>
                  <Sparkles size={14} className={`animate-pulse ${toggleMode === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm font-semibold bg-gradient-to-r ${
                    toggleMode === 'dark' ? 'from-red-400 to-pink-400' : 'from-red-600 to-pink-600'
                  } bg-clip-text text-transparent`}>
                    Piattaforma #1 in Italia
                  </span>
                </div>
              </div>

              {/* Hero Title */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-center mb-6 animate-fade-in-up transition-colors duration-500">
                <span className={toggleMode === 'dark' ? 'text-white' : 'text-gray-900'}>Il Futuro della</span>
                <br />
                <span className={`bg-gradient-to-r ${
                  toggleMode === 'dark'
                    ? 'from-red-500 via-pink-500 to-orange-500'
                    : 'from-red-600 via-pink-600 to-orange-600'
                } bg-clip-text text-transparent`}>
                  Customer Loyalty
                </span>
              </h1>

              {/* Hero Description */}
              <p className={`text-xl text-center max-w-3xl mx-auto mb-12 animate-fade-in-up delay-100 transition-colors duration-500 ${
                toggleMode === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                OMNILY PRO è l'ecosistema completo Hardware + Software + AI che trasforma i tuoi clienti in fan fedeli
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 justify-center mb-20 animate-fade-in-up delay-200">
                <button className="group px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-500/50 hover:shadow-2xl hover:shadow-red-500/80 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <Rocket size={24} className="group-hover:rotate-12 transition-transform" />
                    <span>Inizia Gratis</span>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
                <button className={`px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg ${
                  toggleMode === 'dark'
                    ? 'bg-white/5 backdrop-blur-xl text-white border border-white/10 hover:bg-white/10'
                    : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300'
                }`}>
                  Vedi Demo
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up delay-300">
                <div className={`group p-8 rounded-3xl border hover:scale-105 hover:shadow-2xl transition-all duration-500 ${
                  toggleMode === 'dark'
                    ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-red-500/30'
                    : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-red-500/20'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/50 group-hover:scale-110 transition-transform">
                    <TrendingUp size={28} className="text-white" />
                  </div>
                  <div className={`text-4xl font-black mb-2 ${toggleMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>€125.4K</div>
                  <div className={`font-medium mb-3 ${toggleMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Revenue Mensile</div>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                    toggleMode === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    +42.5%
                  </div>
                </div>

                <div className={`group p-8 rounded-3xl border hover:scale-105 hover:shadow-2xl transition-all duration-500 ${
                  toggleMode === 'dark'
                    ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-blue-500/30'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-blue-500/20'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                    <Users size={28} className="text-white" />
                  </div>
                  <div className={`text-4xl font-black mb-2 ${toggleMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>8,542</div>
                  <div className={`font-medium mb-3 ${toggleMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Clienti Attivi</div>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                    toggleMode === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    +18.2%
                  </div>
                </div>

                <div className={`group p-8 rounded-3xl border hover:scale-105 hover:shadow-2xl transition-all duration-500 ${
                  toggleMode === 'dark'
                    ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-purple-500/30'
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-purple-500/20'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                    <Award size={28} className="text-white" />
                  </div>
                  <div className={`text-4xl font-black mb-2 ${toggleMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>87.3%</div>
                  <div className={`font-medium mb-3 ${toggleMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Retention Rate</div>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                    toggleMode === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    +12.8%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            📝 Note sul Design Selezionato
          </h3>
          {selectedView === 'dark' && (
            <div>
              <p className="text-lg font-semibold mb-3 text-gray-900">🌙 Dark Mode Fisso</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✨</span>
                  <span>Effetti glow e glassmorphism SUPER visibili</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">🎨</span>
                  <span>Gradients vibranti e particelle animate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">💎</span>
                  <span>Look premium, moderno e tech</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">🌟</span>
                  <span>Perfetto per prodotti SaaS innovativi</span>
                </li>
              </ul>
            </div>
          )}
          {selectedView === 'light' && (
            <div>
              <p className="text-lg font-semibold mb-3 text-gray-900">☀️ Light Mode Fisso</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">📖</span>
                  <span>Massima leggibilità su tutti i dispositivi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">🌈</span>
                  <span>Gradients colorati e accattivanti</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✨</span>
                  <span>Shadows eleganti e design pulito</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">📱</span>
                  <span>Familiare e professionale</span>
                </li>
              </ul>
            </div>
          )}
          {selectedView === 'toggle' && (
            <div>
              <p className="text-lg font-semibold mb-3 text-gray-900">🔄 Toggle Dark/Light</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">🎭</span>
                  <span>Due design completi in uno</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">👥</span>
                  <span>Ogni utente sceglie la propria preferenza</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">🔧</span>
                  <span>Richiede più sviluppo ma massima flessibilità</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">💾</span>
                  <span>Preferenza salvata automaticamente</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LandingTest
