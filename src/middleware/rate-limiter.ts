import { Elysia, status } from 'elysia'
import { errors } from './middleware'

type RateLimitRecord = {
  count: number
  expiresAt: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

function getClientKey(request: Request, userId?: string | number) {
  if (userId) return `user:${userId}`

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || 'unknown'

  return `ip:${ip}`
}

export const RateLimiter = (app: Elysia, options?: { windowMs?: number, max?: number }) => app.onRequest(({ request, set, store }) => {
  const max       =  options?.max      || ( process.env.APP_RATELIMIT_COUNTDOWN ? Number(process.env.APP_RATE_LIMIT)          :  60 )
  const windowMs  =  options?.windowMs || ( process.env.APP_RATELIMIT_COUNTDOWN ? Number(process.env.APP_RATELIMIT_COUNTDOWN) :  60_000 )

  const user    =  (store as any)?.user
  const key     =  getClientKey(request, user?.id)

  const now     =  Date.now()
  let   record  =  rateLimitStore.get(key)

  if (!record || record.expiresAt < now) {
    record = { count: 1, expiresAt: now + windowMs }
    rateLimitStore.set(key, record)
  } else {
    record.count++
  }

  set.headers['X-RateLimit-Limit']      =  String(max)
  set.headers['X-RateLimit-Remaining']  =  String(Math.max(0, max - record.count))
  set.headers['X-RateLimit-Reset']      =  String(record.expiresAt)

  if (record.count > max) throw status(errors.ratelimited.status, { message: errors.ratelimited.message });
})
