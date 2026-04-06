/**
 * ForgotPassword page
 * Email input that triggers password reset OTP email.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      // Always show success — server never reveals if email exists
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">

        <p className="text-yellow-500 font-bold text-lg text-center mb-6">UMBC Learn</p>

        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
            <p className="text-gray-500 text-sm mt-1 mb-8">
              Enter your email and we will send you a reset code.
            </p>

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
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <p className="text-5xl mb-4">📧</p>
            <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
            <p className="text-gray-500 text-sm mt-2">
              We sent a reset code to <span className="font-semibold text-gray-700">{email}</span>
            </p>
            <Link
              to="/reset-password"
              className="mt-6 inline-block w-full text-center bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Enter reset code
            </Link>
          </div>
        )}

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

export default ForgotPassword
