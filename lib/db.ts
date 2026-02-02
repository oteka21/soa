import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@/db/schema"

const connectionString =
  process.env.DATABASE_URL ??
  process.env.NEON_DATABASE_URL ??
  process.env.NEO_API_KEY ??
  process.env.a

if (!connectionString) {
  throw new Error(
    "Missing database URL: set your Neon connection string in .env as DATABASE_URL=..."
  )
}

const sql = neon(connectionString)
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export { schema }
