import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resendOTP } from '../api/auth'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsVerification(false)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      // 403 with needsVerification means account exists but email not verified
      if (err.response?.status === 403 && data?.needsVerification) {
        setNeedsVerification(true)
      }
      setError(data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    try {
      await resendOTP(email)
      setResendSuccess(true)
    } catch {
      // Server always returns 200 for resend — this catch is for network errors
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* Left — brand + Google OAuth panel */}
      <div className="hidden md:flex relative w-1/2 bg-black flex-col justify-center items-center px-12">
        <span className="text-yellow-400 font-bold text-2xl absolute top-8 left-8">
          UMBC Learn
        </span>

        <div className="flex flex-col items-center text-center w-full max-w-xs">
          <h2 className="text-white text-4xl font-bold">Welcome back</h2>
          <p className="text-gray-400 text-base mt-3">
            Sign in to continue your learning journey
          </p>

          {/* Google OAuth button */}
          <button
            onClick={() =>
              (window.location.href =
                (import.meta.env.VITE_API_BASE_URL || '') + '/auth/google')
            }
            className="mt-10 bg-white text-gray-800 font-semibold flex items-center gap-3 px-6 py-3 rounded-lg hover:bg-gray-100 transition w-full"
          >
            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
              G
            </div>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full mt-6">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Right — email/password form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-8 bg-white">
        <div className="max-w-sm w-full">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

          {/* Unverified email alert */}
          {needsVerification && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                Please verify your email first
              </p>
              <button
                onClick={handleResendOTP}
                disabled={resendLoading || resendSuccess}
                className="text-yellow-600 text-sm underline cursor-pointer mt-1 disabled:opacity-60"
              >
                {resendLoading
                  ? 'Sending...'
                  : resendSuccess
                  ? 'Code sent! Check your email'
                  : 'Resend verification code'}
              </button>
            </div>
          )}

          {/* Generic error (not needsVerification) */}
          {error && !needsVerification && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-yellow-600 text-sm hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-yellow-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
