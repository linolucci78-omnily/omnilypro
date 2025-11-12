import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../components/Layout/BottomNav'

export default function Rewards() {
  const { customer } = useAuth()
  const navigate = useNavigate()
  const { slug } = useParams()

  if (!customer) {
    navigate(`/${slug}/login`)
    return null
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid var(--gray-200)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          🎁 Catalogo Premi
        </h2>
        <p style={{ color: 'var(--gray-600)' }}>
          Hai {customer.points || 0} punti disponibili
        </p>
      </div>

      <div style={{ padding: '1.5rem', textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎁</div>
        <h3 style={{ marginBottom: '0.5rem' }}>Premi in arrivo!</h3>
        <p style={{ color: 'var(--gray-600)' }}>
          Il catalogo premi sarà disponibile presto
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
