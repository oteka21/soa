/**
 * Reset database - drops all tables and recreates them
 * Run with: npx tsx --env-file=.env scripts/reset-db.ts
 */

import { neon } from "@neondatabase/serverless"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

const sql = neon(connectionString)

async function resetDb() {
  console.log("Dropping all tables...")

  try {
    // Drop tables in order (respecting foreign key constraints)
    await sql`DROP TABLE IF EXISTS comments CASCADE`
    await sql`DROP TABLE IF EXISTS soa_versions CASCADE`
    await sql`DROP TABLE IF EXISTS soa_sections CASCADE`
    await sql`DROP TABLE IF EXISTS workflow_state CASCADE`
    await sql`DROP TABLE IF EXISTS documents CASCADE`
    await sql`DROP TABLE IF EXISTS projects CASCADE`
    await sql`DROP TABLE IF EXISTS verifications CASCADE`
    await sql`DROP TABLE IF EXISTS accounts CASCADE`
    await sql`DROP TABLE IF EXISTS sessions CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Drop enums
    await sql`DROP TYPE IF EXISTS user_role CASCADE`
    await sql`DROP TYPE IF EXISTS project_status CASCADE`
    await sql`DROP TYPE IF EXISTS change_type CASCADE`
    await sql`DROP TYPE IF EXISTS comment_status CASCADE`
    await sql`DROP TYPE IF EXISTS section_status CASCADE`

    console.log("All tables dropped successfully!")
    console.log("\nNow run: pnpm db:generate && pnpm db:migrate")
  } catch (error) {
    console.error("Error dropping tables:", error)
  }

  process.exit(0)
}

resetDb()
