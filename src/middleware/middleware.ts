import { Auth } from './auth'
import { Private } from './private'
import { Cors } from './cors'
import { RateLimiter } from './rate-limiter'
import { BodyParse } from './body-parse'
import { AccessLog } from './access-log'
import { ErrorHandler } from './error-handler'
import { ContextMiddleware } from './context'



declare module "elysia" {
  interface Elysia {
    api(
      basePath: string,
      controller: {
        index    ?:  any
        store    ?:  any
        show     ?:  any
        update   ?:  any
        destroy  ?:  any
      }
    ): this
  }
}

export const errors = {
  unauthorized: {
    status: 401,
    message: "Unauthorized!"
  },
  ratelimited: {
    status: 429,
    message: "Too many requests!"
  },
  notfound: {
    status: 404,
    message: "Endpoint not found!"
  },
  request: {
    status: 400,
    message: "Bad Request!"
  },
  error: {
    status: 500,
    message: "Endpoint not found!"
  }
} as const;



export const middleware = {
  // =====================================>
  // ## Middleware: authenticate request token
  // =====================================>
  Auth,

  // =====================================>
  // ## Middleware: restrict access to private routes
  // =====================================>
  Private,

  // =====================================>
  // ## Middleware: handle CORS headers
  // =====================================>
  Cors,

  // =====================================>
  // ## Middleware: rate limit request threshold
  // =====================================>
  RateLimiter,

  // =====================================>
  // ## Middleware: parse request body formats
  // =====================================>
  BodyParse,

  // =====================================>
  // ## Middleware: log request access details
  // =====================================>
  AccessLog,

  // =====================================>
  // ## Middleware: handle global route errors
  // =====================================>
  ErrorHandler,

  // =====================================>
  // ## Middleware: initialize async local context
  // =====================================>
  Context: ContextMiddleware,
}