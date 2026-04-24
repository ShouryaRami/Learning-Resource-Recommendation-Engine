/**
 * SetPassword page
 * Shown after Google OAuth for new users only.
 * Forces password creation for future non-Google logins.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { setPassword } from '../api/auth'

const calculateStrength = (pwd) => {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600']
const segmentColors = (score, i) => {
  if (i >= score) return 'bg-gray-200'
  if (score === 1) return 'bg-red-400'
  if (score === 2) return 'bg-orange-400'
  if (score === 3) return 'bg-yellow-400'
  return 'bg-green-500'
}

const SetPassword = () => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [password, setPasswordVal] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = calculateStrength(password)

  // On mount: read token from URL, store it, fetch user to populate context
  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token')
    if (token) {
      localStorage.setItem('umbc_token', token)
      // Fetch user data so AuthContext is populated while they set their password
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setAuth(token, res.data))
        .catch(() => navigate('/login'))
    } else {
      // No URL token — check if there is already a stored token (edge case)
      const stored = localStorage.getItem('umbc_token')
      if (!stored) navigate('/login')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (strength < 2) {
      setError('Password is too weak. Add uppercase letters and numbers.')
      return
    }

    setLoading(true)
    try {
      await setPassword({ password, confirmPassword })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">

        <h2 className="text-2xl font-bold text-center text-gray-900">Set Your Password</h2>
        <p className="text-gray-500 text-sm text-center mt-2 mb-8">
          You signed in with Google. Set a password so you can also sign in
          with email from any device.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password with strength indicator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPasswordVal(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
            />
            {password && (
              <div className="mt-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full flex-1 ${segmentColors(strength, i)}`}
                    />
                  ))}
                </div>
                {strength > 0 && (
                  <p className={`text-xs mt-1 text-right ${strengthColor[strength]}`}>
                    {strengthLabel[strength]}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting password...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SetPassword
