import { NextResponse } from 'next/server'
import { getUserByUsername, createUser } from '@/lib/db'
import { createSession } from '@/lib/auth'

const E2E_ALLOWED =
  process.env.NODE_ENV === 'development' || process.env.E2E_TEST_SESSION_ENABLED === '1'

export async function POST(request: Request) {
  if (!E2E_ALLOWED) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username.trim() : 'e2e-user'
  if (!username) {
    return NextResponse.json({ error: 'username required' }, { status: 400 })
  }

  let user = getUserByUsername(username)
  if (!user) {
    user = createUser(username)
  }
  await createSession(user.id, user.username)
  return NextResponse.json({ success: true, username: user.username })
}
