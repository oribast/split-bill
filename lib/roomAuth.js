import { sql } from './db'
import { hashPassword } from './auth'

export async function requireRoomPassword(req, res, id) {
  const rooms = await sql`SELECT password_hash FROM rooms WHERE id = ${id}`
  if (rooms.length === 0) {
    res.status(404).json({ error: 'Room not found' })
    return false
  }
  const room = rooms[0]
  if (!room.password_hash) return true

  const provided = req.headers['x-room-password']
  if (!provided || hashPassword(provided) !== room.password_hash) {
    res.status(403).json({ error: 'Invalid or missing password' })
    return false
  }
  return true
}
