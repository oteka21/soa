/**
 * Reset a stuck workflow
 * Usage: pnpm exec tsx scripts/reset-workflow.ts <projectId>
 */

import { db } from "@/lib/db"
import { workflowState } from "@/db/schema"
import { eq } from "drizzle-orm"

const projectId = process.argv[2]

if (!projectId) {
  console.error("Usage: pnpm exec tsx scripts/reset-workflow.ts <projectId>")
  process.exit(1)
}

async function resetWorkflow() {
  console.log(`Resetting workflow for project: ${projectId}`)

  // Get current workflow state
  const [state] = await db
    .select()
    .from(workflowState)
    .where(eq(workflowState.projectId, projectId))

  if (!state) {
    console.error("No workflow state found for this project")
    process.exit(1)
  }

  console.log("Current state:", {
    currentStep: state.currentStep,
    stepStatuses: state.stepStatuses,
    workflowRunId: state.workflowRunId,
  })

  // Reset to pending state
  const updatedStatuses = {
    step1: "completed" as const,
    step2: "pending" as const,
    step3: "pending" as const,
    step4: "pending" as const,
    step5: "pending" as const,
    step6: "pending" as const,
  }

  await db
    .update(workflowState)
    .set({
      stepStatuses: updatedStatuses,
      currentStep: 1,
      workflowRunId: null,
      updatedAt: new Date(),
    })
    .where(eq(workflowState.id, state.id))

  console.log("✅ Workflow reset successfully!")
  console.log("New state:", {
    currentStep: 1,
    stepStatuses: updatedStatuses,
    workflowRunId: null,
  })

  process.exit(0)
}

resetWorkflow().catch((error) => {
  console.error("Error resetting workflow:", error)
  process.exit(1)
})
