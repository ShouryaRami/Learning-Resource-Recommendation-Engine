/**
 * @desc HTML email templates for UMBC Learn OTP emails
 * Returns styled HTML strings for use with Nodemailer
 */

/**
 * @desc Email verification OTP template
 * @param {string} fullName - Recipient full name
 * @param {string} otp - 6-digit OTP code
 * @returns {string} HTML email string
 */
function verificationEmailTemplate(fullName, otp) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - UMBC Learn</title>
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
      <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="background:#000000;padding:28px 32px;">
          <h1 style="margin:0;color:#FFD700;font-size:22px;font-weight:bold;">UMBC Learn</h1>
          <p style="margin:4px 0 0;color:#888888;font-size:13px;">Learning Resource Recommendation Engine</p>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Verify your email address</h2>
          <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.5;">
            Hi ${fullName}, use the verification code below to activate your UMBC Learn account.
          </p>
          <div style="background:#f9f9f9;border:2px dashed #FFD700;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
            <p style="margin:0 0 8px;color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
            <p style="margin:0;color:#000000;font-size:40px;font-weight:bold;letter-spacing:12px;">${otp}</p>
          </div>
          <p style="margin:0 0 8px;color:#888888;font-size:13px;">
            ⏱ This code expires in <strong>10 minutes</strong>
          </p>
          <p style="margin:0;color:#888888;font-size:13px;">
            If you did not create an account, you can safely ignore this email.
          </p>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #eeeeee;">
          <p style="margin:0;color:#aaaaaa;font-size:12px;text-align:center;">
            UMBC Learn &mdash; SENG 701 Capstone &mdash; Spring 2026
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * @desc Password reset OTP email template
 * @param {string} fullName - Recipient full name
 * @param {string} otp - 6-digit OTP code
 * @returns {string} HTML email string
 */
function resetEmailTemplate(fullName, otp) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - UMBC Learn</title>
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
      <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="background:#000000;padding:28px 32px;">
          <h1 style="margin:0;color:#FFD700;font-size:22px;font-weight:bold;">UMBC Learn</h1>
          <p style="margin:4px 0 0;color:#888888;font-size:13px;">Learning Resource Recommendation Engine</p>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.5;">
            Hi ${fullName}, use the code below to reset your UMBC Learn password.
          </p>
          <div style="background:#f9f9f9;border:2px dashed #FFD700;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
            <p style="margin:0 0 8px;color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your reset code</p>
            <p style="margin:0;color:#000000;font-size:40px;font-weight:bold;letter-spacing:12px;">${otp}</p>
          </div>
          <p style="margin:0 0 8px;color:#888888;font-size:13px;">
            ⏱ This code expires in <strong>10 minutes</strong>
          </p>
          <p style="margin:0;color:#888888;font-size:13px;">
            If you did not request a password reset, please ignore this email.
            Your password will not be changed.
          </p>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #eeeeee;">
          <p style="margin:0;color:#aaaaaa;font-size:12px;text-align:center;">
            UMBC Learn &mdash; SENG 701 Capstone &mdash; Spring 2026
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

module.exports = { verificationEmailTemplate, resetEmailTemplate }
