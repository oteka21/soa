import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, documents, workflowState, soaSections } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { UTApi } from "uploadthing/server"

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["draft", "in_progress", "review", "completed"]).optional(),
})

// GET /api/projects/[id] - Get a single project with related data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id } = await params

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Fetch related data
    const [projectDocuments, projectWorkflowState, projectSections] =
      await Promise.all([
        db.select().from(documents).where(eq(documents.projectId, id)),
        db
          .select()
          .from(workflowState)
          .where(eq(workflowState.projectId, id))
          .then((rows) => rows[0]),
        db.select().from(soaSections).where(eq(soaSections.projectId, id)),
      ])

    return NextResponse.json({
      ...project,
      documents: projectDocuments,
      workflowState: projectWorkflowState,
      sections: projectSections,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id } = await params

    // Verify ownership
    const [existing] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    const [updated] = await db
      .update(projects)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning()

    return NextResponse.json(updated)
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
    console.error("Failed to update project:", error)
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id } = await params

    // Verify ownership
    const [existing] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Fetch all documents for this project to delete their files from UploadThing
    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, id))

    // Delete files from UploadThing if there are any documents
    if (projectDocuments.length > 0) {
      try {
        const utapi = new UTApi()
        const fileUrls = projectDocuments.map((doc) => doc.url)
        
        // UTApi.deleteFiles can accept an array of URLs and will extract file keys
        await utapi.deleteFiles(fileUrls)
        console.log(`Deleted ${fileUrls.length} file(s) from UploadThing`)
      } catch (fileError) {
        // Log error but don't fail the deletion - we still want to delete the project
        // even if file deletion fails (files might already be deleted or URL format changed)
        console.error("Failed to delete files from UploadThing:", fileError)
      }
    }

    // Delete the project (cascade will handle related records)
    await db.delete(projects).where(eq(projects.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to delete project:", error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
