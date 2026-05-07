import { sql } from '../../../../lib/db'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid room ID' })
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  try {
    const rows = await sql`
      SELECT 
        e.id,
        e.type,
        e.description,
        e.note,
        e.is_reverted,
        e.created_at,
        COALESCE(
          json_agg(
            json_build_object('participant_id', ee.participant_id, 'delta', ee.delta)
            ORDER BY ee.id
          ) FILTER (WHERE ee.id IS NOT NULL),
          '[]'
        ) as entries
      FROM events e
      LEFT JOIN event_entries ee ON ee.event_id = e.id
      WHERE e.room_id = ${id}
      GROUP BY e.id
      ORDER BY e.created_at DESC
      LIMIT 400
    `
    return res.status(200).json({ logs: rows })
  } catch (err) {
    console.error('Logs API error:', err)
    return res.status(500).json({ error: 'Failed to fetch logs' })
  }
}
