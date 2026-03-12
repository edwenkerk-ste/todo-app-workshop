import { NextResponse } from 'next/server'
import { exportAllData } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

  const data = exportAllData()
  return NextResponse.json({ success: true, data })
}
