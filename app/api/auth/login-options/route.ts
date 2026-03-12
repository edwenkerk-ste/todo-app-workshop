import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getUserByUsername, getAuthenticatorsByUserId, setChallenge } from '@/lib/db'
import { getRpConfig } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const username = (body.username ?? '').trim()
  if (!username) {
    return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 })
  }

  const user = getUserByUsername(username)
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  const authenticators = getAuthenticatorsByUserId(user.id)
  if (authenticators.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No authenticators found. Please register first.' },
      { status: 400 }
    )
  }

  const { rpID } = getRpConfig(request)

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: authenticators.map((auth) => ({
      id: auth.credential_id,
      transports: auth.transports ? (JSON.parse(auth.transports) as AuthenticatorTransport[]) : undefined,
    })),
    userVerification: 'preferred',
  })

  setChallenge(user.username, options.challenge)

  return NextResponse.json({ success: true, data: options })
}
