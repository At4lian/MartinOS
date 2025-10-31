import type { NextRequest } from "next/server"

import { env } from "@/lib/env"

type RateLimitEntry = {
  count: number
  expiresAt: number
}

type RateLimitStore = Map<string, RateLimitEntry>

declare global {
  var __rateLimitStore: RateLimitStore | undefined
}

const store: RateLimitStore = globalThis.__rateLimitStore ?? new Map()

if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = store
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function applyRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const existingEntry = store.get(identifier)

  if (!existingEntry || existingEntry.expiresAt <= now) {
    store.set(identifier, { count: 1, expiresAt: now + windowMs })

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    }
  }

  if (existingEntry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: existingEntry.expiresAt,
    }
  }

  existingEntry.count += 1

  return {
    success: true,
    limit,
    remaining: Math.max(limit - existingEntry.count, 0),
    reset: existingEntry.expiresAt,
  }
}

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "anonymous"
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return "anonymous"
}

export function withRateLimit(
  handler: (request: NextRequest, ...rest: unknown[]) => Promise<Response> | Response,
  options?: {
    limit?: number
    windowMs?: number
  },
) {
  const limit = options?.limit ?? env.AUTH_RATE_LIMIT_MAX
  const windowMs = options?.windowMs ?? env.AUTH_RATE_LIMIT_WINDOW_MS

  return async (request: NextRequest, ...rest: unknown[]) => {
    const identifier = getClientIdentifier(request)
    const result = applyRateLimit(identifier, limit, windowMs)
    const headers = new Headers({
      "RateLimit-Limit": String(result.limit),
      "RateLimit-Remaining": String(Math.max(result.remaining, 0)),
      "RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    })

    if (!result.success) {
      return new Response("Too Many Requests", {
        status: 429,
        headers,
      })
    }

    const response = await handler(request, ...rest)

    headers.forEach((value, key) => {
      if (!response.headers.has(key)) {
        response.headers.set(key, value)
      }
    })

    return response
  }
}
