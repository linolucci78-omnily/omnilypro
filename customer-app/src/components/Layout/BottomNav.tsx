import { Home, Gift, Ticket, User, ScanLine } from 'lucide-react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import './BottomNav.css'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams()

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: `/${slug}/home`, special: false },
    { id: 'rewards', label: 'Premi', icon: Gift, path: `/${slug}/rewards`, special: false },
    { id: 'card', label: 'Card', icon: ScanLine, path: `/${slug}/card`, special: true },
    { id: 'coupons', label: 'Coupon', icon: Ticket, path: `/${slug}/coupons`, special: false },
    { id: 'profile', label: 'Profilo', icon: User, path: `/${slug}/profile`, special: false }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon
        const active = isActive(item.path)

        // Bottone centrale speciale (Card/QR)
        if (item.special) {
          return (
            <div key={item.id} className="relative -top-8 group">
              <button
                onClick={() => navigate(item.path)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-90 border-[6px] border-white ${
                  active
                    ? 'bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-red-500/40 scale-110'
                    : 'bg-gradient-to-br from-gray-800 to-black text-white shadow-gray-400/50 hover:scale-105'
                }`}
              >
                <Icon size={28} strokeWidth={2.5} />
              </button>
              {/* Etichetta sotto il bottone */}
              <span className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 whitespace-nowrap ${
                active ? 'text-red-600 opacity-100' : 'text-gray-400 opacity-0'
              }`}>
                {item.label}
              </span>
            </div>
          )
        }

        // Bottoni normali
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <Icon size={24} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
