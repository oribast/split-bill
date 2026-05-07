import { sql } from '../../lib/db'
import { hashPassword } from '../../lib/auth'

function generateId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { password } = req.body || {}
    let id, exists = true, attempts = 0
    while (exists && attempts < 10) {
      id = generateId()
      const rows = await sql`SELECT 1 FROM rooms WHERE id = ${id}`
      if (rows.length === 0) exists = false
      attempts++
    }
    if (exists) return res.status(500).json({ error: 'Could not generate unique ID' })

    const passwordHash = password ? hashPassword(password) : null
    await sql`INSERT INTO rooms (id, password_hash, created_at, updated_at) VALUES (${id}, ${passwordHash}, NOW(), NOW())`
    return res.status(200).json({ id, participants: [] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to create room' })
  }
}
