import { neon } from '@neondatabase/serverless'

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('POSTGRES_URL or DATABASE_URL environment variable is not set')
}

export const sql = neon(connectionString)
