/**
 * ResetPassword page
 * OTP + new password form for password reset flow.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { resetPassword } from '../api/auth'

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

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const strength = calculateStrength(newPassword)

  // Redirect to login after successful reset
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset! Please sign in.' } })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !code || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (strength < 2) {
      setError('Password is too weak. Add uppercase letters and numbers.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ email, code, newPassword, confirmPassword })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4 text-center">
          <p className="text-green-500 text-5xl">✓</p>
          <h2 className="text-xl font-bold text-gray-900 mt-4">Password reset successfully!</h2>
          <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">

        <p className="text-yellow-500 font-bold text-lg text-center mb-2">UMBC Learn</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reset Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@umbc.edu"
              className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Reset code — numeric only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reset Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              placeholder="6-digit code"
              className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400 tracking-widest font-mono"
            />
          </div>

          {/* New password with strength indicator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
            />
            {newPassword && (
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <Link
          to="/login"
          className="text-gray-500 text-sm mt-6 block text-center hover:underline"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default ResetPassword
