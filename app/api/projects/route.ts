import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, workflowState } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

// GET /api/projects - List all projects for the current user
export async function GET() {
  try {
    const session = await requireSession()

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, session.user.id))
      .orderBy(desc(projects.updatedAt))

    return NextResponse.json(userProjects)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const session = await requireSession()

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Create the project
    const [project] = await db
      .insert(projects)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        ownerId: session.user.id,
        status: "draft",
      })
      .returning()

    // Create initial workflow state
    await db.insert(workflowState).values({
      projectId: project.id,
      currentStep: 1,
      stepStatuses: {
        step1: "pending",
        step2: "pending",
        step3: "pending",
        step4: "pending",
        step5: "pending",
        step6: "pending",
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Failed to create project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
