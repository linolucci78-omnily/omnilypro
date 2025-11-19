import { Home, CreditCard, Gift, Ticket, User } from 'lucide-react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import './BottomNav.css'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams()

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: `/${slug}/home` },
    { id: 'card', label: 'Card', icon: CreditCard, path: `/${slug}/card` },
    { id: 'rewards', label: 'Premi', icon: Gift, path: `/${slug}/rewards` },
    { id: 'coupons', label: 'Coupon', icon: Ticket, path: `/${slug}/coupons` },
    { id: 'profile', label: 'Profilo', icon: User, path: `/${slug}/profile` }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon
        const active = isActive(item.path)

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
