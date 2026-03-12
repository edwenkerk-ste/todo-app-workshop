import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { getUserByUsername, getChallenge, deleteChallenge, createAuthenticator } from '@/lib/db'
import { createSession, getRpConfig } from '@/lib/auth'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIp(request)
  const { success: ipLimitOk } = checkRateLimit(ip, RATE_LIMITS.auth.maxRequests, RATE_LIMITS.auth.windowMs)
  if (!ipLimitOk) {
    return NextResponse.json(
      { success: false, error: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const username = (body.username ?? '').trim()
  const response = body.response

  if (!username || !response) {
    return NextResponse.json({ success: false, error: 'Missing username or response' }, { status: 400 })
  }

  // Additional rate limit per username to prevent user enumeration
  const { success: usernameLimitOk } = checkRateLimit(
    `register-username-${username}`,
    RATE_LIMITS.authPerUsername.maxRequests,
    RATE_LIMITS.authPerUsername.windowMs
  )
  if (!usernameLimitOk) {
    return NextResponse.json(
      { success: false, error: 'Too many registration attempts for this account. Please try again later.' },
      { status: 429 }
    )
  }

  const user = getUserByUsername(username)
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  const expectedChallenge = getChallenge(user.username)
  if (!expectedChallenge) {
    return NextResponse.json({ success: false, error: 'No challenge found. Please restart registration.' }, { status: 400 })
  }

  const { rpID, origin } = getRpConfig(request)

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ success: false, error: 'Registration verification failed' }, { status: 400 })
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    createAuthenticator({
      user_id: user.id,
      credential_id: credential.id,
      credential_public_key: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter ?? 0,
      transports: credential.transports ? JSON.stringify(credential.transports) : null,
    })

    deleteChallenge(user.username)

    await createSession(user.id, user.username)

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    })
  } catch (err) {
    deleteChallenge(user.username)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 400 }
    )
  }
}
