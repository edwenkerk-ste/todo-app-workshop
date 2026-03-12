import { NextRequest, NextResponse } from 'next/server'
import { getAllHolidays, getHolidaysByMonth, seedHolidays } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  if (year && month) {
    const y = parseInt(year, 10)
    const m = parseInt(month, 10)
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
    }
    const holidays = getHolidaysByMonth(y, m)
    return NextResponse.json(holidays)
  }

  const holidays = getAllHolidays()
  return NextResponse.json(holidays)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const body = await request.json()
  if (!Array.isArray(body.holidays)) {
    return NextResponse.json({ error: 'holidays array required' }, { status: 400 })
  }
  const count = seedHolidays(body.holidays)
  return NextResponse.json({ seeded: count })
}
