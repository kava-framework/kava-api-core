import crypto from 'crypto'
import { db } from '@skalfa/skalfa-orm'

export async function createUserMailToken(userId: number) {
  const token = Math.floor(100000 + Math.random() * 900000).toString()

  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const trx = await db.transaction()

  await trx.table('user_mail_tokens').insert({
    user_id     : userId,
    token       : hash,
    created_at  : new Date(),
  })
  
  const record = await trx.table('user_mail_tokens').orderBy('id', 'desc').first()
  
  await trx.commit()

  return {
    token    : token,
    tokenId  : record.id
  }
}
