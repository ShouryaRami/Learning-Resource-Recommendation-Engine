/**
 * @desc Passport.js Google OAuth 2.0 strategy configuration
 * Handles Google sign-in and links Google accounts to
 * existing users or creates new accounts automatically.
 * Call require('./config/passport') in index.js once.
 */
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:5000/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value
    const googleId = profile.id

    // Check if user already exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }]
    })

    if (user) {
      // Update googleId if not already set (existing email user linking Google)
      if (!user.googleId) {
        user.googleId = googleId
      }
      user.lastLogin = new Date()
      await user.save()
      return done(null, user)
    }

    // Create new user from Google profile
    // password is intentionally null — user must set it via /set-password
    user = await User.create({
      fullName: profile.displayName,
      email,
      googleId,
      isVerified: true,
      role: 'student'
    })

    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))

// Not using sessions but required by passport
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

module.exports = passport
