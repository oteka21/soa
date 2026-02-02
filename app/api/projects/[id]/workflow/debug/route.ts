import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, documents, workflowState, soaSections } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"

// GET /api/projects/[id]/workflow/debug - Debug workflow status
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

    // Get workflow state
    const [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    // Get documents
    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))

    // Get sections
    const sections = await db
      .select()
      .from(soaSections)
      .where(eq(soaSections.projectId, projectId))

    // Check environment
    const hasApiKey = !!process.env.AI_GATEWAY_API_KEY

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
      },
      workflowState: state,
      documents: {
        count: projectDocuments.length,
        withContent: projectDocuments.filter((d) => d.parsedContent && d.parsedContent.length > 0).length,
        totalContentLength: projectDocuments.reduce((sum, d) => sum + (d.parsedContent?.length || 0), 0),
      },
      sections: {
        count: sections.length,
        byStatus: sections.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      },
      environment: {
        hasApiKey,
        apiKeyLength: process.env.AI_GATEWAY_API_KEY?.length || 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to get debug info:", error)
    return NextResponse.json(
      {
        error: "Failed to get debug info",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
