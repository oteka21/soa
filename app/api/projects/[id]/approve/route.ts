import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, workflowState } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const approveSchema = z.object({
  step: z.number().min(4).max(5), // Only steps 4 and 5 are HITL
  action: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
})

// POST /api/projects/[id]/approve - Approve or reject a workflow step
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

    const body = await request.json()
    const { step, action, comments } = approveSchema.parse(body)

    // Get current workflow state
    const [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    if (!state) {
      return NextResponse.json(
        { error: "Workflow not started" },
        { status: 400 }
      )
    }

    // Verify we're at the correct step
    const stepKey = `step${step}` as keyof typeof state.stepStatuses
    if (state.stepStatuses[stepKey] !== "awaiting_approval") {
      return NextResponse.json(
        { error: `Step ${step} is not awaiting approval` },
        { status: 400 }
      )
    }

    const approved = action === "approve"

    if (approved) {
      // Update database state for approved
      const updatedStatuses = {
        ...state.stepStatuses,
        [stepKey]: "completed" as const,
      }

      const nextStep = step + 1
      if (nextStep <= 6) {
        const nextStepKey = `step${nextStep}` as keyof typeof state.stepStatuses
        updatedStatuses[nextStepKey] =
          nextStep <= 5 ? ("awaiting_approval" as const) : ("in_progress" as const)
      }

      await db
        .update(workflowState)
        .set({
          currentStep: nextStep,
          stepStatuses: updatedStatuses,
          updatedAt: new Date(),
        })
        .where(eq(workflowState.id, state.id))

      // If step 5 approved, also complete step 6 and mark project as completed
      if (step === 5) {
        await db
          .update(workflowState)
          .set({
            currentStep: 6,
            stepStatuses: {
              ...updatedStatuses,
              step6: "completed" as const,
            },
            updatedAt: new Date(),
          })
          .where(eq(workflowState.id, state.id))

        await db
          .update(projects)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(projects.id, projectId))
      }

      return NextResponse.json({
        message: `Step ${step} approved`,
        nextStep: step === 5 ? 6 : nextStep,
      })
    } else {
      // Rejected - mark as failed
      const updatedStatuses = {
        ...state.stepStatuses,
        [stepKey]: "failed" as const,
      }

      await db
        .update(workflowState)
        .set({
          stepStatuses: updatedStatuses,
          updatedAt: new Date(),
        })
        .where(eq(workflowState.id, state.id))

      return NextResponse.json({
        message: `Step ${step} rejected.`,
        comments,
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to process approval:", error)
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    )
  }
}
