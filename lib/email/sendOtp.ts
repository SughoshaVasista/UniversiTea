import nodemailer from 'nodemailer'

interface SendOtpParams {
  to: string
  otp: string
  collegeName: string
}

export async function sendOtpEmail({
  to,
  otp,
  collegeName,
}: SendOtpParams): Promise<boolean> {
  const fromEmail = process.env.EMAIL_FROM || 'noreply@universitea.com'

  // If SMTP environment variables are configured, send real email
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: `UniversiTea <${fromEmail}>`,
        to,
        subject: `Your UniversiTea Verification Code: ${otp}`,
        text: `Your one-time verification code for UniversiTea (${collegeName}) is: ${otp}. It will expire in 10 minutes. Never share this code with anyone.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #09090b; color: #f4f4f5; padding: 32px; border-radius: 16px; border: 1px solid #27272a;">
            <h2 style="color: #fbbf24; margin-top: 0; font-size: 24px;">🍵 UniversiTea</h2>
            <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">
              Your one-time login & account verification code. Your public activity remains 100% anonymous.
            </p>
            <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-family: monospace; font-weight: 700; letter-spacing: 6px; color: #34d399;">
                ${otp}
              </span>
            </div>
            <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
              This code will expire in <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.
            </p>
          </div>
        `,
      })
      return true
    } catch (err) {
      console.error('[sendOtpEmail] SMTP Delivery Error:', err)
    }
  }

  // Local development / Test fallback:
  console.log('\n======================================================')
  console.log(`🍵 [UniversiTea DEV AUTH] OTP Code for: ${to}`)
  console.log(`🔑 Verification Code: ${otp}`)
  console.log(`🏛️ College: ${collegeName}`)
  console.log('⏰ Valid for 10 minutes')
  console.log('======================================================\n')

  return true
}
