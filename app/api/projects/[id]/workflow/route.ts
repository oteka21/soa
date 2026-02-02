import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, documents, workflowState } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { start, getRun } from "workflow/api"
import { buildProjectSoa } from "@/app/workflows/soa-project"

// POST /api/projects/[id]/workflow - Start or continue the workflow
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

    // Get project documents
    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))

    if (projectDocuments.length === 0) {
      return NextResponse.json(
        { error: "No documents uploaded. Please upload documents first." },
        { status: 400 }
      )
    }

    // Get or create workflow state
    let [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    if (!state) {
      const [newState] = await db
        .insert(workflowState)
        .values({
          projectId,
          currentStep: 1,
          stepStatuses: {
            step1: "completed", // Documents already uploaded
            step2: "in_progress",
            step3: "pending",
            step4: "pending",
            step5: "pending",
            step6: "pending",
          },
        })
        .returning()
      state = newState
    } else {
      // Update workflow state to start step 2 if not already started
      if (state.stepStatuses.step2 === "pending") {
        const updatedStatuses = {
          ...state.stepStatuses,
          step1: "completed" as const,
          step2: "in_progress" as const,
        }
        await db
          .update(workflowState)
          .set({
            currentStep: 2,
            stepStatuses: updatedStatuses,
            updatedAt: new Date(),
          })
          .where(eq(workflowState.id, state.id))
        state = { ...state, currentStep: 2, stepStatuses: updatedStatuses }
      }
    }

    // Update project status
    if (project.status === "draft") {
      await db
        .update(projects)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(projects.id, projectId))
    }

    // Start the durable workflow using Workflow DevKit
    // This provides automatic retries, state persistence, and observability
    // Ensure input is plain serializable object
    const workflowInput: { projectId: string; userId: string } = {
      projectId: String(projectId),
      userId: String(session.user.id),
    }
    
    // Validate input is serializable
    try {
      JSON.stringify(workflowInput)
      console.log("[workflow/route] Input is JSON serializable ✓")
    } catch (e) {
      console.error("[workflow/route] ERROR: Input is not JSON serializable!", e)
      throw new Error("Workflow input is not serializable")
    }
    
    console.log("=".repeat(80))
    console.log("[workflow/route] ========== STARTING WORKFLOW ==========")
    console.log("[workflow/route] Project ID:", projectId)
    console.log("[workflow/route] User ID:", session.user.id)
    console.log("[workflow/route] Workflow input:", JSON.stringify(workflowInput, null, 2))
    console.log("[workflow/route] Workflow state before start:", JSON.stringify(state, null, 2))
    console.log("[workflow/route] buildProjectSoa function:", typeof buildProjectSoa)
    console.log("[workflow/route] buildProjectSoa name:", buildProjectSoa.name)
    console.log("[workflow/route] Calling start()...")
    
    let workflowRun
    try {
      // IMPORTANT: Workflow DevKit expects arguments as an array
      // Each element in the array is passed as a positional argument to the workflow function
      workflowRun = await start(buildProjectSoa, [workflowInput])
      console.log("[workflow/route] start() completed successfully")
    } catch (startError) {
      console.error("[workflow/route] ERROR calling start():", startError)
      console.error("[workflow/route] Error type:", typeof startError)
      console.error("[workflow/route] Error message:", startError instanceof Error ? startError.message : String(startError))
      console.error("[workflow/route] Error stack:", startError instanceof Error ? startError.stack : "No stack")
      throw startError
    }
    
    console.log("[workflow/route] Workflow run result:", workflowRun)
    console.log("[workflow/route] Workflow run type:", typeof workflowRun)
    console.log("[workflow/route] Workflow run keys:", workflowRun ? Object.keys(workflowRun) : "null/undefined")
    
    // Workflow DevKit uses runId, not id
    const runId = (workflowRun as any)?.runId || (workflowRun as any)?.id
    console.log("[workflow/route] Workflow run ID (runId):", runId)
    console.log("[workflow/route] Workflow run ID (id):", (workflowRun as any)?.id)
    console.log("=".repeat(80))

    // Store the workflow run ID for tracking
    if (runId) {
      await db
        .update(workflowState)
        .set({
          workflowRunId: runId,
          updatedAt: new Date(),
        })
        .where(eq(workflowState.projectId, projectId))
      console.log("[workflow/route] Stored workflow run ID:", runId)
    } else {
      console.error("[workflow/route] WARNING: Workflow run ID is missing!")
      console.error("[workflow/route] Full workflow run object:", JSON.stringify(workflowRun, null, 2))
    }

    console.log("[workflow/route] Started workflow run:", runId)

    return NextResponse.json({
      message: "Workflow started",
      workflowState: state,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to start workflow:", error)
    return NextResponse.json(
      { error: "Failed to start workflow" },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/workflow - Get workflow status
export async function GET(
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

    const [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    // If we have a workflow run ID, try to get its status
    let workflowStatus = null
    if (state?.workflowRunId) {
      try {
        const run = getRun(state.workflowRunId)
        workflowStatus = {
          status: await run.status,
          // Don't await returnValue if still running - it will hang
        }
        console.log("[workflow/route] Workflow status:", workflowStatus)
      } catch (statusError) {
        console.error("[workflow/route] Error getting workflow status:", statusError)
        workflowStatus = { error: statusError instanceof Error ? statusError.message : "Unknown error" }
      }
    }

    return NextResponse.json({ 
      workflowState: state ?? null,
      workflowStatus,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to get workflow status:", error)
    return NextResponse.json(
      { error: "Failed to get workflow status" },
      { status: 500 }
    )
  }
}
