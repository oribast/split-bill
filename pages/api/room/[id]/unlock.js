import { sql } from '../../../../lib/db'
import { hashPassword } from '../../../../lib/auth'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })

  try {
    const rows = await sql`SELECT password_hash FROM rooms WHERE id = ${id}`
    if (rows.length === 0) return res.status(404).json({ error: 'Room not found' })
    const room = rows[0]
    if (!room.password_hash) return res.status(200).json({ success: true })
    if (hashPassword(password) !== room.password_hash) return res.status(403).json({ error: 'Invalid password' })
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
