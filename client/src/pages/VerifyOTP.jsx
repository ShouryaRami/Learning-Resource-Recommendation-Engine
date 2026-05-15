/**
 * VerifyOTP page
 * 6-box OTP input for email verification.
 * Auto-advances between boxes, auto-submits when complete,
 * shows countdown timer with resend option.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { verifyOTP, resendOTP } from '../api/auth'

const VerifyOTP = () => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const inputRefs = useRef([])

  // Redirect to register if no email was passed in location state
  useEffect(() => {
    if (!email) navigate('/register')
  }, [email, navigate])

  // Countdown timer — enables resend button when expired
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true)
      return
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const timeDisplay = `${mins}:${secs}`

  /**
   * Submit the OTP code to the server
   * Accepts the code as a parameter so it can be called from
   * auto-submit before state updates settle
   */
  const submitCode = async (code) => {
    if (code.length < 6) {
      setError('Please enter all 6 digits')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await verifyOTP(email, code)
      const { token, user } = res.data
      localStorage.setItem('umbc_token', token)
      setAuth(token, user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.')
      // Clear all boxes and focus first on error
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleDigitChange = (index, value) => {
    // Only allow numeric input, take the last typed character
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = cleaned
    setDigits(newDigits)

    // Auto-advance to next box
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 boxes are filled
    if (newDigits.every((d) => d !== '')) {
      submitCode(newDigits.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    // Backspace on empty box moves focus to previous box and clears it
    if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const pasted = text.replace(/\D/g, '').slice(0, 6)
    const newDigits = [...digits]
    pasted.split('').forEach((char, i) => {
      newDigits[i] = char
    })
    setDigits(newDigits)
    // Focus the last filled box
    const lastIndex = Math.min(pasted.length, 5)
    inputRefs.current[lastIndex]?.focus()
    // Auto-submit if all 6 filled from paste
    if (newDigits.every((d) => d !== '')) {
      submitCode(newDigits.join(''))
    }
  }

  const handleResend = async () => {
    try {
      await resendOTP(email)
      setTimeLeft(600)
      setCanResend(false)
      setResendMsg('New code sent! Check your email.')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setResendMsg('Failed to resend. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">

        <p className="text-yellow-500 font-bold text-lg text-center mb-6">UMBC Learn</p>

        <h2 className="text-2xl font-bold text-center text-gray-900">Check your email</h2>
        <p className="text-gray-500 text-sm text-center mt-1">We sent a 6-digit code to:</p>
        <p className="text-gray-800 font-semibold text-center mt-1">{email}</p>

        {/* 6 OTP input boxes */}
        <div className="flex gap-2 justify-center mt-8">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg outline-none transition
                ${digit ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}
                focus:border-yellow-400`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        {/* Countdown timer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {timeLeft > 0 ? (
            <>
              Code expires in{' '}
              <span className="text-yellow-600 font-mono font-bold">{timeDisplay}</span>
            </>
          ) : (
            <span className="text-gray-400">Code expired</span>
          )}
        </div>

        {/* Resend section */}
        <div className="mt-4 text-center text-sm">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-yellow-600 underline cursor-pointer"
            >
              Resend verification code
            </button>
          ) : timeLeft > 0 ? (
            <span className="text-gray-400">
              Resend available in <span className="font-mono">{timeLeft}s</span>
            </span>
          ) : null}
        </div>

        {resendMsg && (
          <p className="text-green-600 text-sm text-center mt-2">{resendMsg}</p>
        )}

        {/* Spinner shown while verifying */}
        {loading && (
          <div className="flex justify-center mt-6">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyOTP
