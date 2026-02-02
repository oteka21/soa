/**
 * List all projects in the database
 * Run with: node --loader ts-node/esm scripts/list-projects.ts
 * Or: npx tsx scripts/list-projects.ts
 */

import { db } from "../lib/db"
import { projects, workflowState, documents, soaSections } from "../db/schema"
import { eq } from "drizzle-orm"

async function listProjects() {
  console.log("=== All Projects ===\n")

  try {
    const allProjects = await db.select().from(projects)
    
    if (allProjects.length === 0) {
      console.log("No projects found in database.")
      process.exit(0)
    }

    console.log(`Found ${allProjects.length} project(s):\n`)

    for (const project of allProjects) {
      console.log(`📁 ${project.name}`)
      console.log(`   ID: ${project.id}`)
      console.log(`   Status: ${project.status}`)
      console.log(`   Created: ${project.createdAt}`)
      console.log(`   Updated: ${project.updatedAt}`)

      // Get workflow state
      const [state] = await db
        .select()
        .from(workflowState)
        .where(eq(workflowState.projectId, project.id))

      if (state) {
        console.log(`   Workflow:`)
        console.log(`     Current Step: ${state.currentStep}`)
        console.log(`     Step 2 Status: ${state.stepStatuses.step2}`)
        console.log(`     Workflow Run ID: ${state.workflowRunId || "(none)"}`)
      } else {
        console.log(`   Workflow: None`)
      }

      // Get documents count
      const docs = await db
        .select()
        .from(documents)
        .where(eq(documents.projectId, project.id))
      console.log(`   Documents: ${docs.length}`)

      // Get sections count
      const sections = await db
        .select()
        .from(soaSections)
        .where(eq(soaSections.projectId, project.id))
      console.log(`   SOA Sections: ${sections.length}`)

      // Highlight "test project 3"
      if (project.name.toLowerCase().includes("test project 3")) {
        console.log(`   ⚠️  THIS IS TEST PROJECT 3`)
        if (state?.stepStatuses.step2 === "in_progress") {
          console.log(`   ⚠️  STATUS: STUCK IN PROGRESS`)
          console.log(`   💡 Reset URL: POST /api/projects/${project.id}/workflow/reset`)
        }
      }

      console.log()
    }

    // Find test project 3 specifically
    const testProject3 = allProjects.find(
      (p) => p.name.toLowerCase().includes("test project 3")
    )

    if (testProject3) {
      console.log("=".repeat(60))
      console.log(`TEST PROJECT 3 DETAILS:`)
      console.log(`  Project ID: ${testProject3.id}`)
      console.log(`  Debug URL: GET /api/projects/${testProject3.id}/workflow/debug`)
      console.log(`  Reset URL: POST /api/projects/${testProject3.id}/workflow/reset`)
      console.log("=".repeat(60))
    }

    process.exit(0)
  } catch (error) {
    console.error("Error listing projects:", error)
    process.exit(1)
  }
}

listProjects()
