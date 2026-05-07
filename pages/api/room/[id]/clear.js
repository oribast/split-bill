import { sql } from '../../../../lib/db'
import { requireRoomPassword } from '../../../../lib/roomAuth'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!(await requireRoomPassword(req, res, id))) return

  try {
    await sql`DELETE FROM events WHERE room_id = ${id}`
    await sql`DELETE FROM participants WHERE room_id = ${id}`
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed' })
  }
}
