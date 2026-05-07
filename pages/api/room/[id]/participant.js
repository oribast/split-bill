import { sql } from '../../../../lib/db'
import { requireRoomPassword } from '../../../../lib/roomAuth'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })
  if (!(await requireRoomPassword(req, res, id))) return

  try {
    if (req.method === 'POST') {
      const { name } = req.body
      const pid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      await sql`INSERT INTO participants (id, room_id, name) VALUES (${pid}, ${id}, ${name || 'Без имени'})`
      return res.status(200).json({ id: pid, name: name || 'Без имени' })
    }
    if (req.method === 'PUT') {
      const { participantId, name } = req.body
      if (!participantId || !name) return res.status(400).json({ error: 'Missing data' })
      await sql`UPDATE participants SET name = ${name} WHERE id = ${participantId} AND room_id = ${id}`
      return res.status(200).json({ success: true })
    }
    if (req.method === 'DELETE') {
      const { participantId } = req.query
      if (!participantId) return res.status(400).json({ error: 'Missing participantId' })
      await sql`DELETE FROM participants WHERE id = ${participantId} AND room_id = ${id}`
      return res.status(200).json({ success: true })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
