import { Elysia } from 'elysia'
import { logger } from '@utils'

export const AccessLog = (app: Elysia) => app.state<{ startedAt?: number }>({}).onRequest(({ store }) => { store.startedAt = Date.now() }).onAfterResponse(({ request, set, store }) => {
  const method   =  request.method
  const url      =  new URL(request.url)
  const path     =  url.pathname
  const status   =  Number(set.status) ?? 200
  const latency  =  Date.now() - (store.startedAt ?? Date.now())
  const agent    =  request.headers.get("user-agent") || 'unknown'
  const ip       =  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || 'unknown'

  logger.info(`${method} : ${path} - ${status} - ${latency}ms - ${ip}]`)
  logger.access({ method, path, status, latency, ip, agent })
})
