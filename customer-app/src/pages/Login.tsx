import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOrganization } from '../contexts/OrganizationContext'
import { Trophy, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Login() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { login, customer, loading: authLoading } = useAuth()
  const { organization } = useOrganization()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && customer) {
      console.log('✅ Already logged in, redirecting to home')
      navigate(`/${slug}/home`, { replace: true })
    }
  }, [customer, authLoading, navigate, slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(`/${slug}/home`)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (!organization) return null

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Icon Header */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-red-600" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-black text-gray-900 text-center mb-2">
          {organization?.name || 'LUCE'}
        </h1>
        <p className="text-red-600 text-center font-bold tracking-widest uppercase text-sm mb-10">
          LOYALTY CLUB
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-3 uppercase tracking-wide">
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
                placeholder="alessandra@example.com"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-gray-600 text-sm font-semibold uppercase tracking-wide">
                Password
              </label>
              <button
                type="button"
                className="text-red-600 text-sm font-semibold hover:text-red-700"
              >
                Password dimenticata?
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
          >
            {loading ? 'Accesso...' : 'Accedi'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>

          {/* Register Link */}
          <div className="text-center mt-8">
            <span className="text-gray-500">Non hai un account? </span>
            <Link
              to={`/${slug}/register`}
              className="text-red-600 font-bold hover:text-red-700"
            >
              Registrati gratis
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
