import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { hashEmail, generateAnonymousHandle } from '@/lib/auth/crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, otp } = body

    if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'Email and 6-digit verification code are required.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedOtp = otp.trim()

    const emailHash = hashEmail(normalizedEmail)

    // 1. Look up the latest OTP record for this email hash
    const otpRecord = await prisma.otpToken.findFirst({
      where: { emailHash },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No active verification code found for this address.' },
        { status: 400 }
      )
    }

    // 2. Check expiration
    if (otpRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.otpToken.delete({ where: { id: otpRecord.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // 3. Check failed attempts (Maximum 5 attempts allowed)
    if (otpRecord.attempts >= 5) {
      await prisma.otpToken.delete({ where: { id: otpRecord.id } }).catch(() => {})
      return NextResponse.json(
        {
          error:
            'Too many incorrect attempts. This verification code has been invalidated for security.',
        },
        { status: 400 }
      )
    }

    // 4. Increment attempts counter
    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    })

    // 5. Compare submitted OTP with bcrypt hash
    const isValid = await bcrypt.compare(trimmedOtp, otpRecord.hashedOtp)

    if (!isValid) {
      const remaining = 5 - (otpRecord.attempts + 1)
      return NextResponse.json(
        {
          error: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code invalidated.'}`,
        },
        { status: 400 }
      )
    }

    // 6. Valid OTP! Delete all OTP tokens for this email hash (single use, prevents replay)
    await prisma.otpToken.deleteMany({
      where: { emailHash },
    })

    // 7. Find or create the anonymous User record
    // Real email and student name are NEVER saved. Only the one-way HMAC emailHash is stored.
    const user = await prisma.user.upsert({
      where: { emailHash },
      update: {},
      create: {
        emailHash,
        anonymousHandle: generateAnonymousHandle(),
      },
    })

    // 9. Create a Session valid for 30 days
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: sessionExpiresAt,
      },
    })

    // 9. Prepare response and set secure HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      redirectTo: `/`,
    })

    response.cookies.set('universitea_session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: sessionExpiresAt,
    })

    return response
  } catch (error: unknown) {
    console.error('Error in verify-otp route:', error)
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
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }
}
