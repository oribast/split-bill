import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  const { id } = req.query
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const events = await sql`
      SELECT 
        e.id, e.type, e.amount, e.description, e.note, e.created_at, e.is_reverted,
        p.name as payer_name
      FROM events e
      LEFT JOIN participants p ON p.id = e.payer_id
      WHERE e.room_id = ${id} AND e.is_reverted = false
      ORDER BY e.created_at DESC
    `

    const logs = []
    for (const ev of events) {
      const entries = await sql`
        SELECT participant_id, delta 
        FROM event_entries 
        WHERE event_id = ${ev.id}
      `
      logs.push({ ...ev, entries })
    }

    res.status(200).json({ logs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка загрузки истории' })
  }
}
