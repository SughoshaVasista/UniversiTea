import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json(
    { error: 'Guest sessions cannot participate. Create a UniversiTea account to continue.' },
    { status: 403 }
  )
}
