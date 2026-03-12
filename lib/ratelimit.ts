/**
 * In-memory rate limiting utility for Next.js API routes
 * Tracks requests by key (e.g., IP address, username) for rate limiting
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (e.g., IP address, username)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { success: boolean, remaining: number, resetAt?: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt?: number } {
  const now = Date.now()
  const entry = store.get(key)

  // Create new entry or reset expired one
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  // Increment counter
  entry.count++
  return { success: true, remaining: maxRequests - entry.count }
}

/**
 * Get client IP address from request headers
 * Works with proxies (Vercel, Railway, etc.)
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback - this won't work in production but fine for development
  return 'unknown'
}

/**
 * Reset rate limit for a key (useful for testing or manual admin reset)
 */
export function resetRateLimit(key: string): void {
  store.delete(key)
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  store.clear()
}

/**
 * Cleanup expired entries periodically
 * Call this in a scheduled job or at startup
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

// Cleanup every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

/**
 * Rate limit presets for different endpoint types
 */
export const RATE_LIMITS = {
  // Auth endpoints: 5 requests per minute per IP
  auth: { maxRequests: 5, windowMs: 60 * 1000 },
  // Auth endpoints per username: even stricter, 3 per minute
  authPerUsername: { maxRequests: 3, windowMs: 60 * 1000 },
  // Todo CRUD endpoints: 30 requests per minute per IP
  todos: { maxRequests: 30, windowMs: 60 * 1000 },
  // Import/export: 5 requests per minute per IP
  import_export: { maxRequests: 5, windowMs: 60 * 1000 },
}
