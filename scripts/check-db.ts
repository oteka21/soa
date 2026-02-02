/**
 * Check database state
 * Run with: npx tsx --env-file=.env scripts/check-db.ts
 * Or: node --import tsx scripts/check-db.ts (with .env file in directory)
 */

// Load environment variables FIRST before any other imports
import dotenv from "dotenv"
import { resolve } from "path"
dotenv.config({ path: resolve(process.cwd(), ".env") })

// Now import db after env is loaded
import { db } from "../lib/db"
import { projects, documents, workflowState, soaSections, soaVersions } from "../db/schema"
import { eq } from "drizzle-orm"

async function checkDb() {
  console.log("=== Checking Database State ===\n")

  // Get all projects
  const allProjects = await db.select().from(projects)
  console.log(`Found ${allProjects.length} projects:`)
  for (const p of allProjects) {
    console.log(`  - ${p.name} (ID: ${p.id}, Status: ${p.status})`)
    
    // Highlight test project 3
    if (p.name.toLowerCase().includes("test project 3")) {
      console.log(`    ⚠️  THIS IS TEST PROJECT 3`)
    }
  }
  console.log()
  
  // Find and highlight test project 3
  const testProject3 = allProjects.find(
    (p) => p.name.toLowerCase().includes("test project 3")
  )
  
  if (testProject3) {
    console.log("=".repeat(60))
    console.log(`TEST PROJECT 3 FOUND:`)
    console.log(`  Project ID: ${testProject3.id}`)
    console.log(`  Name: ${testProject3.name}`)
    console.log(`  Status: ${testProject3.status}`)
    console.log(`  Debug URL: GET /api/projects/${testProject3.id}/workflow/debug`)
    console.log(`  Reset URL: POST /api/projects/${testProject3.id}/workflow/reset`)
    console.log("=".repeat(60))
    console.log()
  }

  // For each project, check documents, workflow state, and sections
  for (const project of allProjects) {
    console.log(`\n--- Project: ${project.name} ---`)
    
    // Documents
    const docs = await db.select().from(documents).where(eq(documents.projectId, project.id))
    console.log(`Documents: ${docs.length}`)
    for (const doc of docs) {
      console.log(`  - ${doc.name} (${doc.parsedContent?.length ?? 0} chars)`)
    }

    // Workflow state
    const [state] = await db.select().from(workflowState).where(eq(workflowState.projectId, project.id))
    if (state) {
      console.log(`Workflow State: Step ${state.currentStep}`)
      console.log(`  Statuses: ${JSON.stringify(state.stepStatuses)}`)
    } else {
      console.log("Workflow State: None")
    }

    // SOA Sections
    const sections = await db.select().from(soaSections).where(eq(soaSections.projectId, project.id))
    console.log(`SOA Sections: ${sections.length}`)
    if (sections.length > 0) {
      for (const s of sections.slice(0, 5)) {
        console.log(`  - ${s.sectionId}: ${s.title} (${s.status})`)
      }
      if (sections.length > 5) {
        console.log(`  ... and ${sections.length - 5} more`)
      }
    }

    // Versions
    const versions = await db.select().from(soaVersions).where(eq(soaVersions.projectId, project.id))
    console.log(`SOA Versions: ${versions.length}`)
  }

  process.exit(0)
}

checkDb().catch(console.error)
