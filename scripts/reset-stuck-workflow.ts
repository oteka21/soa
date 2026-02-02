import { db } from "@/lib/db"
import { workflowState } from "@/db/schema"
import { eq } from "drizzle-orm"

const projectId = process.argv[2]

if (!projectId) {
  console.error("Usage: npx tsx --env-file=.env scripts/reset-stuck-workflow.ts <projectId>")
  process.exit(1)
}

async function resetWorkflow() {
  console.log(`Resetting workflow for project: ${projectId}`)
  
  const result = await db
    .update(workflowState)
    .set({
      currentStep: 1,
      stepStatuses: {
        step1: "completed" as const,
        step2: "pending" as const,
        step3: "pending" as const,
        step4: "pending" as const,
        step5: "pending" as const,
        step6: "pending" as const,
      },
      workflowRunId: null,
      updatedAt: new Date(),
    })
    .where(eq(workflowState.projectId, projectId))
    .returning()
  
  console.log("✅ Workflow reset successfully!")
  console.log("You can now try generating the SOA again.")
  console.log("Refresh your browser and click 'Generate SOA'")
}

resetWorkflow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error)
    process.exit(1)
  })
