/**
 * AuthContext — Global authentication state
 *
 * Provides authentication state and functions
 * to all child components via React Context.
 *
 * State shape:
 * {
 *   user: Object | null — current user document
 *   token: string | null — JWT token
 *   isLoading: boolean — true while checking auth
 * }
 *
 * Functions provided:
 * login(email, password) — authenticates user,
 *   stores token in localStorage
 * logout() — clears token and user state
 * setAuth(token, user) — directly sets auth state,
 *   used by VerifyOTP and SetPassword after their own
 *   POST calls (avoids a second login POST)
 * updateUser(fields) — updates user state
 *   without a server call (for optimistic updates)
 */
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if Google OAuth redirected back with a token in the URL query param
    // This happens when /api/auth/google/callback redirects to
    // /dashboard?token=JWT or /set-password?token=JWT
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    if (urlToken) {
      localStorage.setItem('umbc_token', urlToken)
      // Remove token from URL so it is not visible in browser history
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Now check localStorage (includes any token just stored from URL above)
    const stored = localStorage.getItem('umbc_token')
    if (!stored) {
      setIsLoading(false)
      return
    }

    api.get('/auth/me', { headers: { Authorization: `Bearer ${stored}` } })
      .then((res) => {
        setUser(res.data)
        setToken(stored)
      })
      .catch(() => {
        localStorage.removeItem('umbc_token')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('umbc_token', res.data.token)
    setToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  /**
   * Directly set auth state from a token + user object.
   * Used by VerifyOTP (after /verify-otp succeeds) and
   * SetPassword (after reading the Google OAuth token from URL).
   * Avoids making a second POST to /auth/login.
   */
  const setAuth = (newToken, newUser) => {
    localStorage.setItem('umbc_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('umbc_token')
    setUser(null)
    setToken(null)
  }

  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }))
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, setAuth, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
