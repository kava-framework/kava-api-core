import { Elysia, status } from 'elysia'
import { errors } from './middleware'

export const Private = (app: Elysia) => app.derive(async ({ user }: Record<string, any> | any) => {
  if (!user) {
    throw status(errors.unauthorized.status, { message: errors.unauthorized.message })
  }
})
