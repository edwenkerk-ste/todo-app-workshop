'use client'

import React, { useEffect, useState } from 'react'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // If already authenticated, redirect to home
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((body) => {
        if (body.success) {
          window.location.href = '/'
        }
      })
      .catch(() => {})
  }, [])

  const handleRegister = async () => {
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Username is required')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Step 1: Get registration options
      const optionsRes = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })
      const optionsBody = await optionsRes.json()
      if (!optionsRes.ok || !optionsBody.success) {
        throw new Error(optionsBody.error ?? 'Failed to get registration options')
      }

      // Step 2: Create credential with browser
      const credential = await startRegistration({ optionsJSON: optionsBody.data })

      // Step 3: Verify with server
      const verifyRes = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, response: credential }),
      })
      const verifyBody = await verifyRes.json()
      if (!verifyRes.ok || !verifyBody.success) {
        throw new Error(verifyBody.error ?? 'Registration failed')
      }

      // Success - redirect
      window.location.href = '/'
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Username is required')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Step 1: Get authentication options
      const optionsRes = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })
      const optionsBody = await optionsRes.json()
      if (!optionsRes.ok || !optionsBody.success) {
        throw new Error(optionsBody.error ?? 'Failed to get login options')
      }

      // Step 2: Authenticate with browser
      const credential = await startAuthentication({ optionsJSON: optionsBody.data })

      // Step 3: Verify with server
      const verifyRes = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, response: credential }),
      })
      const verifyBody = await verifyRes.json()
      if (!verifyRes.ok || !verifyBody.success) {
        throw new Error(verifyBody.error ?? 'Login failed')
      }

      // Success - redirect
      window.location.href = '/'
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, marginTop: '4rem' }}>
      <div className="card">
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', textAlign: 'center' }}>
          Todo App
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {mode === 'login' ? 'Sign in with your passkey' : 'Create a new account with a passkey'}
        </p>

        {error && (
          <div style={{ color: '#f87171', marginBottom: '0.75rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (mode === 'login') void handleLogin()
                else void handleRegister()
              }
            }}
            autoFocus
          />

          {mode === 'login' ? (
            <button className="button" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In with Passkey'}
            </button>
          ) : (
            <button className="button" onClick={handleRegister} disabled={loading}>
              {loading ? 'Registering…' : 'Register with Passkey'}
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          {mode === 'login' ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null) }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Register
              </button>
            </p>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null) }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
