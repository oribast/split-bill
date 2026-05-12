import { sql } from '../../../../lib/db'
import { requireRoomPassword } from '../../../../lib/roomAuth'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!(await requireRoomPassword(req, res, id))) return

  const { participantId, amount, description, note, payerId } = req.body
  const amt = parseFloat(amount)
  if (!participantId || isNaN(amt) || amt <= 0 || !payerId) {
    return res.status(400).json({ error: 'Invalid data: participant, amount and payer are required' })
  }

  try {
    const desc = description || `Начислено ${amt.toFixed(2)} ₽`
    const noteValue = (note && String(note).trim()) || null

    const ev = await sql`
      INSERT INTO events (room_id, type, description, note, payer_id)
      VALUES (${id}, 'individual', ${desc}, ${noteValue}, ${payerId})
      RETURNING id
    `
    await sql`
      INSERT INTO event_entries (event_id, participant_id, delta)
      VALUES (${ev[0].id}, ${participantId}, ${amt})
    `
    return res.status(200).json({ success: true, eventId: ev[0].id })
  } catch (err) {
    console.error('Individual API error:', err)
    return res.status(500).json({ error: 'Failed' })
  }
}
