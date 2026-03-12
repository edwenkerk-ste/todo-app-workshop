import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'session'
const SESSION_EXPIRY_DAYS = 7

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  userId: string
  username: string
}

export async function createSession(userId: string, username: string): Promise<string> {
  const token = await new SignJWT({ userId, username } as SessionPayload & Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  })

  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const userId = payload.userId as string | undefined
    const username = payload.username as string | undefined
    if (!userId || !username) return null
    return { userId, username }
  } catch {
    return null
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/** WebAuthn Relying Party config — read from env or use dev defaults */
export function getRpConfig() {
  return {
    rpName: process.env.RP_NAME ?? 'Todo App',
    rpID: process.env.RP_ID ?? 'localhost',
    origin: process.env.RP_ORIGIN ?? 'http://localhost:3000',
  }
}
