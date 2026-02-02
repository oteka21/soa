import { db } from "@/lib/db"
import { projects, workflowState, soaSections, documents } from "@/db/schema"
import { eq } from "drizzle-orm"

const projectId = process.argv[2]

if (!projectId) {
  console.error("Usage: npx tsx --env-file=.env scripts/check-project-status.ts <projectId>")
  process.exit(1)
}

async function checkProject() {
  console.log(`\n=== Checking Project: ${projectId} ===\n`)

  // Check project
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))

  if (!project) {
    console.log("❌ Project not found!")
    return
  }

  console.log("✅ Project found:")
  console.log("  Name:", project.name)
  console.log("  Status:", project.status)
  console.log("  Created:", project.createdAt)
  console.log("  Updated:", project.updatedAt)

  // Check documents
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.projectId, projectId))

  console.log("\n📄 Documents:", docs.length)
  docs.forEach((doc) => {
    console.log(`  - ${doc.name} (${doc.fileType})`)
  })

  // Check workflow state
  const [workflow] = await db
    .select()
    .from(workflowState)
    .where(eq(workflowState.projectId, projectId))

  if (workflow) {
    console.log("\n⚙️  Workflow State:")
    console.log("  Current Step:", workflow.currentStep)
    console.log("  Step Statuses:", JSON.stringify(workflow.stepStatuses, null, 4))
    console.log("  Workflow Run ID:", workflow.workflowRunId)
    console.log("  Updated:", workflow.updatedAt)
  } else {
    console.log("\n❌ No workflow state found")
  }

  // Check sections
  const sections = await db
    .select()
    .from(soaSections)
    .where(eq(soaSections.projectId, projectId))

  console.log("\n📝 SOA Sections:", sections.length)
  if (sections.length > 0) {
    sections.slice(0, 10).forEach((section) => {
      console.log(`  - ${section.sectionId}: ${section.title} (${section.status})`)
    })
    if (sections.length > 10) {
      console.log(`  ... and ${sections.length - 10} more`)
    }
  }

  console.log("\n=== Summary ===")
  console.log("Documents:", docs.length)
  console.log("Sections:", sections.length)
  console.log("Workflow exists:", !!workflow)
  console.log("Current step:", workflow?.currentStep || "N/A")
  console.log("Step 2 status:", workflow?.stepStatuses?.step2 || "N/A")
  
  if (workflow?.stepStatuses?.step2 === "in_progress" && sections.length === 0) {
    console.log("\n⚠️  ISSUE: Step 2 is 'in_progress' but no sections generated!")
    console.log("This indicates the workflow is stuck or failed silently.")
  }
}

checkProject()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error)
    process.exit(1)
  })
