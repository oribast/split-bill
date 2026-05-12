import { sql } from '../../../../lib/db'
import { requireRoomPassword } from '../../../../lib/roomAuth'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!(await requireRoomPassword(req, res, id))) return

  const { amount, selectedIds, description, note, payerId } = req.body
  const amt = parseFloat(amount)
  if (!Array.isArray(selectedIds) || selectedIds.length === 0 || isNaN(amt) || amt <= 0 || !payerId) {
    return res.status(400).json({ error: 'Invalid data: participants, amount and payer are required' })
  }

  try {
    const totalCents = Math.round(amt * 100)
    const count = selectedIds.length
    const baseCents = Math.floor(totalCents / count)
    let remainderCents = totalCents - baseCents * count
    const desc = description || `Распределено ${amt.toFixed(2)} ₽`
    const noteValue = (note && String(note).trim()) || null

    const ev = await sql`
      INSERT INTO events (room_id, type, description, note, payer_id)
      VALUES (${id}, 'shared', ${desc}, ${noteValue}, ${payerId})
      RETURNING id
    `
    const eventId = ev[0].id

    for (const pid of selectedIds) {
      let addCents = baseCents
      if (remainderCents > 0) { addCents += 1; remainderCents -= 1 }
      const addAmount = addCents / 100
      if (addAmount > 0) {
        await sql`
          INSERT INTO event_entries (event_id, participant_id, delta)
          VALUES (${eventId}, ${pid}, ${addAmount})
        `
      }
    }
    return res.status(200).json({ success: true, eventId })
  } catch (err) {
    console.error('Shared API error:', err)
    return res.status(500).json({ error: 'Failed' })
  }
}
