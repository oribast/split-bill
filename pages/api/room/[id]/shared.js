import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  const { id } = req.query
  if (req.method !== 'POST') return res.status(405).end()

  const { amount, selectedIds, description, note, payerId } = req.body

  if (!selectedIds?.length || amount === '' || !payerId) {
    return res.status(400).json({ error: 'Не хватает данных: участники, сумма или плательщик' })
  }

  const amt = parseFloat(amount)
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Некорректная сумма' })
  }

  const totalCents = Math.round(amt * 100)
  const count = selectedIds.length
  const baseCents = Math.floor(totalCents / count)
  let remainderCents = totalCents - baseCents * count

  try {
    const eventId = randomUUID()

    await sql`
      INSERT INTO events (id, room_id, type, amount, description, note, payer_id)
      VALUES (${eventId}, ${id}, 'shared', ${amt}, ${description || ''}, ${note || ''}, ${payerId})
    `

    for (const pid of selectedIds) {
      let addCents = baseCents
      if (remainderCents > 0) {
        addCents += 1
        remainderCents -= 1
      }
      const addAmount = addCents / 100

      await sql`
        INSERT INTO event_entries (event_id, participant_id, delta)
        VALUES (${eventId}, ${pid}, ${addAmount})
      `

      await sql`
        UPDATE participants SET amount = amount + ${addAmount} WHERE id = ${pid}
      `
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка распределения' })
  }
}
