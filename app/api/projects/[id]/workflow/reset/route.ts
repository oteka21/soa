import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { workflowState } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { projects } from "@/db/schema"

// POST /api/projects/[id]/workflow/reset - Reset a stuck workflow
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id: projectId } = await params

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.ownerId, session.user.id))
      )

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get current workflow state
    const [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    if (!state) {
      return NextResponse.json(
        { error: "No workflow state found" },
        { status: 404 }
      )
    }

    // Reset step2 from "in_progress" to "pending" if it's stuck
    const step2Status = state.stepStatuses.step2
    if (step2Status === "in_progress") {
      const updatedStatuses = {
        ...state.stepStatuses,
        step2: "pending" as const,
      }

      await db
        .update(workflowState)
        .set({
          stepStatuses: updatedStatuses,
          currentStep: 1,
          workflowRunId: null, // Clear the stuck workflow run ID
          updatedAt: new Date(),
        })
        .where(eq(workflowState.id, state.id))

      console.log(`[workflow/reset] Reset workflow for project ${projectId}`)

      return NextResponse.json({
        message: "Workflow reset successfully",
        workflowState: {
          ...state,
          stepStatuses: updatedStatuses,
          currentStep: 1,
          workflowRunId: null,
        },
      })
    } else {
      return NextResponse.json({
        message: "Workflow is not stuck (step2 is not in_progress)",
        workflowState: state,
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to reset workflow:", error)
    return NextResponse.json(
      { error: "Failed to reset workflow" },
      { status: 500 }
    )
  }
}
