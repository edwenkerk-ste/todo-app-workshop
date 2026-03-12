import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import {
  getUserByUsername,
  getChallenge,
  deleteChallenge,
  getAuthenticatorByCredentialId,
  updateAuthenticatorCounter,
} from '@/lib/db'
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
    return NextResponse.json({ success: false, error: 'No challenge found. Please restart login.' }, { status: 400 })
  }

  const { rpID, origin } = getRpConfig()

  // Find the authenticator that was used
  const credentialIdFromResponse = response.id
  const authenticator = getAuthenticatorByCredentialId(credentialIdFromResponse)

  if (!authenticator || authenticator.user_id !== user.id) {
    deleteChallenge(user.username)
    return NextResponse.json({ success: false, error: 'Authenticator not found' }, { status: 400 })
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credential_id,
        publicKey: isoBase64URL.toBuffer(authenticator.credential_public_key),
        counter: authenticator.counter ?? 0,
        transports: authenticator.transports
          ? (JSON.parse(authenticator.transports) as AuthenticatorTransport[])
          : undefined,
      },
    })

    if (!verification.verified) {
      deleteChallenge(user.username)
      return NextResponse.json({ success: false, error: 'Authentication verification failed' }, { status: 400 })
    }

    updateAuthenticatorCounter(authenticator.credential_id, verification.authenticationInfo.newCounter)
    deleteChallenge(user.username)

    await createSession(user.id, user.username)

    return NextResponse.json({
      success: true,
      data: { verified: true },
    })
  } catch (err) {
    deleteChallenge(user.username)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 400 }
    )
  }
}
