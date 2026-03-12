import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'session'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required. Generate with: openssl rand -base64 32')
  }
  if (secret === 'dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must be changed from default value in production')
  }
  return new TextEncoder().encode(secret)
}

// Routes that require authentication
const PROTECTED_ROUTES = ['/', '/calendar']

// Routes that should redirect to / if already authenticated
const AUTH_ROUTES = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value

  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, getSecret())
      isAuthenticated = true
    } catch {
      // Invalid/expired token
    }
  }

  // Protect application routes
  if (PROTECTED_ROUTES.includes(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users away from login
  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      const homeUrl = new URL('/', request.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/calendar', '/login'],
}
