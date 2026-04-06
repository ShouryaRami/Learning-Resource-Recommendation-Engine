/**
 * Auth API module — wrappers for authentication endpoints.
 * All functions return axios promises.
 */
import api from './axios'

/**
 * @desc Register a new user (returns OTP message, not a token)
 * @param {Object} data - { fullName, email, password, confirmPassword, skillLevel }
 */
export const registerUser = (data) => api.post('/auth/register', data)

/**
 * @desc Verify email OTP and activate account
 * @param {string} email - User email
 * @param {string} code - 6-digit OTP code
 */
export const verifyOTP = (email, code) => api.post('/auth/verify-otp', { email, code })

/**
 * @desc Resend OTP verification email
 * @param {string} email - User email
 */
export const resendOTP = (email) => api.post('/auth/resend-otp', { email })

/**
 * @desc Send password reset OTP to email
 * @param {string} email - User email
 */
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })

/**
 * @desc Reset password using OTP code
 * @param {Object} data - { email, code, newPassword, confirmPassword }
 */
export const resetPassword = (data) => api.post('/auth/reset-password', data)

/**
 * @desc Set password for Google OAuth users (requires auth token)
 * @param {Object} data - { password, confirmPassword }
 */
export const setPassword = (data) => api.post('/auth/set-password', data)
