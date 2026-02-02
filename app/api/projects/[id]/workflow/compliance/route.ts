import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, workflowState } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { start } from "workflow/api"
import { runComplianceAndApproval } from "@/app/workflows/soa-project"

// POST /api/projects/[id]/workflow/compliance - Run compliance check and approval workflow
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

    // Get workflow state
    const [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    if (!state) {
      return NextResponse.json(
        { error: "No workflow state found. Generate SOA first." },
        { status: 400 }
      )
    }

    // Verify step 2 is completed
    if (state.stepStatuses.step2 !== "completed") {
      return NextResponse.json(
        { error: "SOA generation must be completed first" },
        { status: 400 }
      )
    }

    // Update workflow state to start step 3
    const updatedStatuses = {
      ...state.stepStatuses,
      step3: "in_progress" as const,
    }
    
    await db
      .update(workflowState)
      .set({
        currentStep: 3,
        stepStatuses: updatedStatuses,
        updatedAt: new Date(),
      })
      .where(eq(workflowState.id, state.id))

    // Start the compliance and approval workflow
    const workflowInput: { projectId: string; userId: string } = {
      projectId: String(projectId),
      userId: String(session.user.id),
    }

    console.log("[workflow/compliance] Starting compliance workflow for project:", projectId)
    
    const workflowRun = await start(runComplianceAndApproval, [workflowInput])
    const runId = (workflowRun as any)?.runId || (workflowRun as any)?.id

    // Store the workflow run ID
    if (runId) {
      await db
        .update(workflowState)
        .set({
          workflowRunId: runId,
          updatedAt: new Date(),
        })
        .where(eq(workflowState.projectId, projectId))
    }

    console.log("[workflow/compliance] Started compliance workflow run:", runId)

    return NextResponse.json({
      message: "Compliance workflow started",
      workflowRunId: runId,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to start compliance workflow:", error)
    return NextResponse.json(
      { error: "Failed to start compliance workflow" },
      { status: 500 }
    )
  }
}
