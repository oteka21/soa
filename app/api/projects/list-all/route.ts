import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, workflowState, documents, soaSections } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET /api/projects/list-all - List all projects (for debugging)
// Note: This bypasses auth for debugging purposes - remove in production
export async function GET() {
  try {
    const allProjects = await db.select().from(projects)

    const projectsWithDetails = await Promise.all(
      allProjects.map(async (project) => {
        const [state] = await db
          .select()
          .from(workflowState)
          .where(eq(workflowState.projectId, project.id))

        const docs = await db
          .select()
          .from(documents)
          .where(eq(documents.projectId, project.id))

        const sections = await db
          .select()
          .from(soaSections)
          .where(eq(soaSections.projectId, project.id))

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          workflowState: state
            ? {
                currentStep: state.currentStep,
                step2Status: state.stepStatuses.step2,
                workflowRunId: state.workflowRunId,
              }
            : null,
          documentsCount: docs.length,
          sectionsCount: sections.length,
          isTestProject3: project.name.toLowerCase().includes("test project 3"),
        }
      })
    )

    // Find test project 3
    const testProject3 = projectsWithDetails.find((p) => p.isTestProject3)

    return NextResponse.json({
      projects: projectsWithDetails,
      testProject3: testProject3
        ? {
            id: testProject3.id,
            name: testProject3.name,
            status: testProject3.status,
            workflowState: testProject3.workflowState,
            documentsCount: testProject3.documentsCount,
            sectionsCount: testProject3.sectionsCount,
            debugUrl: `/api/projects/${testProject3.id}/workflow/debug`,
            resetUrl: `/api/projects/${testProject3.id}/workflow/reset`,
          }
        : null,
    })
  } catch (error) {
    console.error("Failed to list projects:", error)
    return NextResponse.json(
      {
        error: "Failed to list projects",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
