import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { getUserByUsername, getChallenge, deleteChallenge, createAuthenticator } from '@/lib/db'
import { createSession, getRpConfig } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const username = (body.username ?? '').trim()
  const response = body.response

  if (!username || !response) {
    return NextResponse.json({ success: false, error: 'Missing username or response' }, { status: 400 })
  }

  const user = getUserByUsername(username)
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  const expectedChallenge = getChallenge(user.username)
  if (!expectedChallenge) {
    return NextResponse.json({ success: false, error: 'No challenge found. Please restart registration.' }, { status: 400 })
  }

  const { rpID, origin } = getRpConfig()

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
