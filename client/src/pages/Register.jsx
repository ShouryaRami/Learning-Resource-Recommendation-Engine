import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

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

const Register = () => {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [skillLevel, setSkillLevel] = useState('beginner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = calculateStrength(password)
  const passwordsMismatch = confirmPassword !== '' && confirmPassword !== password

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
      // Register returns { message, email } — not a token
      // Verification happens on /verify-otp before login is granted
      await api.post('/auth/register', { fullName, email, password, confirmPassword, skillLevel })
      navigate('/verify-otp', { state: { email } })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* Left — brand panel */}
      <div className="hidden md:flex relative w-1/2 bg-black flex-col justify-center items-center px-12">
        <span className="text-yellow-400 font-bold text-2xl absolute top-8 left-8">
          UMBC Learn
        </span>
        <div className="flex flex-col items-center text-center w-full max-w-xs">
          <h2 className="text-white text-4xl font-bold">Join UMBC Learn</h2>
          <p className="text-gray-400 text-base mt-3">
            Start your personalized learning journey today
          </p>
        </div>
      </div>

      {/* Right — registration form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-8 bg-white">
        <div className="max-w-sm w-full">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Shourya Rami"
                className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
              />
            </div>

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

            {/* Password with strength indicator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {passwordsMismatch && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Skill level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                required
                className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
