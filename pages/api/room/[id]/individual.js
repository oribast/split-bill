import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  const { id } = req.query
  if (req.method !== 'POST') return res.status(405).end()

  const { participantId, amount, description, note, payerId } = req.body

  if (!participantId || amount === '' || !payerId) {
    return res.status(400).json({ error: 'Не хватает данных: участник, сумма или плательщик' })
  }

  const amt = parseFloat(amount)
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Некорректная сумма' })
  }

  try {
    await sql.transaction(async (txn) => {
      const [event] = await txn`
        INSERT INTO events (room_id, type, amount, description, note, payer_id)
        VALUES (${id}, 'individual', ${amt}, ${description || ''}, ${note || ''}, ${payerId})
        RETURNING id
      `

      await txn`
        INSERT INTO event_entries (event_id, participant_id, delta)
        VALUES (${event.id}, ${participantId}, ${amt})
      `

      await txn`
        UPDATE participants SET amount = amount + ${amt} WHERE id = ${participantId}
      `
    })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка создания траты' })
  }
}
