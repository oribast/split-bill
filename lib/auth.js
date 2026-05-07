import crypto from 'crypto'

const SECRET = process.env.ROOM_PASSWORD_SECRET || 'default-insecure-secret'

export function hashPassword(password) {
  return crypto.createHmac('sha256', SECRET).update(password).digest('hex')
}
