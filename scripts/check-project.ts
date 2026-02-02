/**
 * Check a specific project's state
 * Run with: npx tsx --env-file=.env scripts/check-project.ts "test project 3"
 */

import { db } from "../lib/db"
import { projects, documents, workflowState, soaSections, soaVersions } from "../db/schema"
import { eq, like } from "drizzle-orm"

async function checkProject(projectName: string) {
  console.log(`=== Checking Project: "${projectName}" ===\n`)

  // Find project by name
  const projectResults = await db
    .select()
    .from(projects)
    .where(like(projects.name, `%${projectName}%`))

  if (projectResults.length === 0) {
    console.log(`No project found matching "${projectName}"`)
    console.log("\nAll projects:")
    const allProjects = await db.select().from(projects)
    for (const p of allProjects) {
      console.log(`  - ${p.name} (ID: ${p.id})`)
    }
    process.exit(1)
  }

  const project = projectResults[0]
  console.log(`Found project: ${project.name}`)
  console.log(`  ID: ${project.id}`)
  console.log(`  Status: ${project.status}`)
  console.log(`  Created: ${project.createdAt}`)
  console.log(`  Updated: ${project.updatedAt}`)
  console.log()

  // Documents
  const docs = await db.select().from(documents).where(eq(documents.projectId, project.id))
  console.log(`Documents: ${docs.length}`)
  for (const doc of docs) {
    const contentLength = doc.parsedContent?.length ?? 0
    const hasContent = contentLength > 0
    console.log(`  - ${doc.name}`)
    console.log(`    Content length: ${contentLength} chars`)
    console.log(`    Has parsed content: ${hasContent}`)
    if (hasContent) {
      const preview = doc.parsedContent!.substring(0, 100).replace(/\n/g, " ")
      console.log(`    Preview: ${preview}...`)
    }
  }
  console.log()

  // Workflow state
  const [state] = await db
    .select()
    .from(workflowState)
    .where(eq(workflowState.projectId, project.id))

  if (state) {
    console.log(`Workflow State:`)
    console.log(`  ID: ${state.id}`)
    console.log(`  Current Step: ${state.currentStep}`)
    console.log(`  Workflow Run ID: ${state.workflowRunId || "(none)"}`)
    console.log(`  Created: ${state.createdAt}`)
    console.log(`  Updated: ${state.updatedAt}`)
    console.log(`  Step Statuses:`)
    console.log(`    Step 1: ${state.stepStatuses.step1}`)
    console.log(`    Step 2: ${state.stepStatuses.step2}`)
    console.log(`    Step 3: ${state.stepStatuses.step3}`)
    console.log(`    Step 4: ${state.stepStatuses.step4}`)
    console.log(`    Step 5: ${state.stepStatuses.step5}`)
    console.log(`    Step 6: ${state.stepStatuses.step6}`)
  } else {
    console.log("Workflow State: None")
  }
  console.log()

  // SOA Sections
  const sections = await db
    .select()
    .from(soaSections)
    .where(eq(soaSections.projectId, project.id))

  console.log(`SOA Sections: ${sections.length}`)
  if (sections.length > 0) {
    for (const s of sections) {
      const contentPreview = s.content
        ? JSON.stringify(s.content).substring(0, 100)
        : "(no content)"
      console.log(`  - ${s.sectionId}: ${s.title}`)
      console.log(`    Status: ${s.status}`)
      console.log(`    Content preview: ${contentPreview}...`)
      console.log(`    Sources: ${s.sources?.length || 0}`)
      console.log(`    Required fields: ${s.requiredFields?.length || 0}`)
    }
  }
  console.log()

  // Versions
  const versions = await db
    .select()
    .from(soaVersions)
    .where(eq(soaVersions.projectId, project.id))

  console.log(`SOA Versions: ${versions.length}`)
  for (const v of versions) {
    console.log(`  - Version ${v.version}: ${v.action} at ${v.createdAt}`)
  }

  process.exit(0)
}

const projectName = process.argv[2] || "test project 3"
checkProject(projectName).catch(console.error)
