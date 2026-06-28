import { Elysia } from 'elysia'
import { logger } from '@utils'

export const Cors = (app: Elysia) => app.onRequest(({ request, set }) => {
  const origin                       = request.headers.get('origin') ?? ''
  let allowedOrigin: string          = '*'

  const originsConf = process.env.APP_CORS_ORIGINS || '*'

  if (originsConf !== '*') {
    try {
      const allowedOrigins = JSON.parse(originsConf)
      if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
          allowedOrigin = origin || ""
      }
    } catch (e) {
      const em = 'Cors Error: Failed to parse APP_CORS_ORIGINS, fallback to "*"'
      logger.error(em, { error: em })
      allowedOrigin = ''
    }
  }
  
  set.headers['Access-Control-Allow-Origin']      = allowedOrigin
  set.headers['Access-Control-Allow-Methods']     = process.env.APP_CORS_METHODS || 'GET, POST, PUT, DELETE, OPTIONS'
  set.headers['Access-Control-Allow-Headers']     = 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Option, x-App'
  set.headers['Access-Control-Allow-Credentials'] = 'true'

  if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, })
  }
})
