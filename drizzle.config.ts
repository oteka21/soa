import { config } from "dotenv"
import path from "node:path"
import { defineConfig } from "drizzle-kit"

const root = process.cwd()
config({ path: path.resolve(root, ".env") })
config({ path: path.resolve(root, ".env.local") })

const url =
  process.env.DATABASE_URL ??
  process.env.NEON_DATABASE_URL ??
  process.env.NEO_API_KEY ??
  process.env.a
if (!url) {
  throw new Error(
    "Database URL not set. Add your Neon connection string to .env as DATABASE_URL=..."
  )
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
})
