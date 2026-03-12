import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { getUserByUsername, createUser, getAuthenticatorsByUserId, setChallenge } from '@/lib/db'
import { getRpConfig } from '@/lib/auth'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIp(request)
  const { success: ipLimitOk } = checkRateLimit(ip, RATE_LIMITS.auth.maxRequests, RATE_LIMITS.auth.windowMs)
  if (!ipLimitOk) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const username = (body.username ?? '').trim()
  if (!username) {
    return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 })
  }

  // Get or create user
  let user = getUserByUsername(username)
  if (user) {
    // Check if user already has authenticators - then they should login instead
    const existingAuths = getAuthenticatorsByUserId(user.id)
    if (existingAuths.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User already registered. Please login.' },
        { status: 409 }
      )
    }
  } else {
    user = createUser(username)
  }

  const { rpName, rpID } = getRpConfig(request)
  const existingAuths = getAuthenticatorsByUserId(user.id)

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.username,
    attestationType: 'none',
    excludeCredentials: existingAuths.map((auth) => ({
      id: auth.credential_id,
      transports: auth.transports ? (JSON.parse(auth.transports) as AuthenticatorTransport[]) : undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  setChallenge(user.username, options.challenge)

  return NextResponse.json({ success: true, data: options })
}
