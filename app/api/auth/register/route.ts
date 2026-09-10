import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashEmail, generateAnonymousHandle } from '@/lib/auth/crypto'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const emailHash = hashEmail(username.toLowerCase())

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { emailHash }
    })

    if (existingUser) {
      if (existingUser.hashedPassword) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      } else {
        // User exists but has no password (e.g., they used Guest or OAuth before with this same username string, highly unlikely but possible).
        // Let's set the password for them.
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { hashedPassword }
        })
        return NextResponse.json({ success: true })
      }
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        emailHash,
        hashedPassword,
        anonymousHandle: generateAnonymousHandle(),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
