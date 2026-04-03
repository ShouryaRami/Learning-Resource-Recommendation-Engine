/**
 * @desc Nodemailer transporter configured for Gmail SMTP
 * Requires EMAIL_USER and EMAIL_APP_PASSWORD in .env
 * Uses Gmail App Password (not regular Gmail password)
 */
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
})

/**
 * @desc Send an email using the Gmail transporter
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html - HTML body content
 * @returns {Promise<void>}
 */
async function sendMail(to, subject, html) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html
  })
}

module.exports = { transporter, sendMail }
