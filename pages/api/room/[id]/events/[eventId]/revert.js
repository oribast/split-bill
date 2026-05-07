import { sql } from '../../../../../../lib/db'
import { requireRoomPassword } from '../../../../../../lib/roomAuth'

export default async function handler(req, res) {
  const { id, eventId } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })
  if (!eventId || isNaN(parseInt(eventId))) return res.status(400).json({ error: 'Invalid event ID' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!(await requireRoomPassword(req, res, id))) return

  try {
    const rows = await sql`
      UPDATE events
      SET is_reverted = TRUE, reverted_at = NOW()
      WHERE id = ${parseInt(eventId)} AND room_id = ${id} AND is_reverted = FALSE
        AND type IN ('individual', 'shared')
      RETURNING id
    `
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Event not found, already reverted or not revertible' })
    }
    return res.status(200).json({ success: true, revertedEventId: rows[0].id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Rollback failed' })
  }
}
