import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    // Basic DB check
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        timestamp,
        database: 'connected',
        services: {
          database: 'up',
          aiProvider: process.env.AI_PROVIDER || 'mock',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[HealthCheck Error]:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        environment: process.env.NODE_ENV || 'development',
        timestamp,
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}
