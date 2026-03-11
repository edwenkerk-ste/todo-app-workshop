import { NextResponse } from 'next/server'
import { exportAllData } from '@/lib/db'

export async function GET() {
  const data = exportAllData()
  return NextResponse.json({ success: true, data })
}
