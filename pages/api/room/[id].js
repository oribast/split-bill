import { sql } from '../../../lib/db'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  try {
    if (req.method === 'GET') {
      const roomRows = await sql`SELECT id, password_hash IS NOT NULL as is_protected FROM rooms WHERE id = ${id}`
      if (roomRows.length === 0) return res.status(404).json({ error: 'Room not found' })
      const room = roomRows[0]

      const participants = await sql`
        SELECT p.id, p.name, COALESCE(SUM(ee.delta), 0) as amount
        FROM participants p
        LEFT JOIN (
          SELECT ee.participant_id, ee.delta
          FROM event_entries ee
          JOIN events e ON e.id = ee.event_id
          WHERE e.room_id = ${id} AND e.is_reverted = FALSE
        ) ee ON ee.participant_id = p.id
        WHERE p.room_id = ${id}
        GROUP BY p.id, p.name
        ORDER BY MIN(p.created_at)
      `
      return res.status(200).json({
        id: room.id,
        isProtected: room.is_protected,
        participants: participants.map(p => ({ ...p, amount: parseFloat(p.amount) || 0 }))
      })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
