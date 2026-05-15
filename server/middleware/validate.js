/**
 * @desc express-validator rule sets for UMBC Learn routes
 * Spread these arrays into route definitions to
 * validate and sanitize all user input.
 */
const { body, validationResult } = require('express-validator')

/**
 * @desc Validation rules for user registration
 */
const registerRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    })
]

/**
 * @desc Validation rules for user login
 */
const loginRules = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty().withMessage('Password is required')
]

/**
 * @desc Middleware to check validation results
 * Returns 400 with errors array if validation failed
 * Call this after spreading rule arrays in routes
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    })
  }
  next()
}

module.exports = { registerRules, loginRules, handleValidation }
