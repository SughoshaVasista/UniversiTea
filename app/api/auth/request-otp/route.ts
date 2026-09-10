import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { sendOtpEmail } from '@/lib/email/sendOtp'
import { hashEmail } from '@/lib/auth/crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const domain = normalizedEmail.split('@')[1]

    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid email domain format.' },
        { status: 400 }
      )
    }

    // 2. Cryptographic one-way hash: ensures real name in email is never stored in DB
    const emailHash = hashEmail(normalizedEmail)

    // 3. Check rate limit: max 3 OTP requests in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const recentRequestsCount = await prisma.otpToken.count({
      where: {
        emailHash,
        createdAt: { gte: fifteenMinutesAgo },
      },
    })

    if (recentRequestsCount >= 3) {
      return NextResponse.json(
        {
          error:
            'Too many OTP requests for this address. Please wait 15 minutes before requesting another code.',
        },
        { status: 429 }
      )
    }

    // 4. Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // 5. Hash OTP with bcrypt before saving to database
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

    // 6. Save ONLY the hashed email and hashed OTP to database
    await prisma.otpToken.create({
      data: {
        emailHash,
        hashedOtp,
        expiresAt,
        attempts: 0,
      },
    })

    // 6. Send OTP to student email
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      collegeName: 'UniversiTea',
    })

    return NextResponse.json({
      success: true,
      message: 'A verification code has been sent to your email address.',
    })
  } catch (error: unknown) {
    console.error('Error in request-otp route:', error)
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      return NextResponse.json(
        {
          error:
            'Cannot reach PostgreSQL database at localhost:5432. Please start your PostgreSQL server or set DATABASE_URL in .env.',
        },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to process request. Please try again later.' },
      { status: 500 }
    )
  }
}
