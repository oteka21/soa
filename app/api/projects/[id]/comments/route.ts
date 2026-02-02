import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, soaSections, comments, users } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod"

const createCommentSchema = z.object({
  sectionId: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  status: z.enum(["open", "resolved"]).optional(),
  content: z.string().min(1).max(2000).optional(),
})

// GET /api/projects/[id]/comments - Get all comments for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const sectionIdParam = searchParams.get("sectionId")

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

    // Get all sections for this project
    const sections = await db
      .select()
      .from(soaSections)
      .where(eq(soaSections.projectId, projectId))

    const sectionIds = sections.map((s) => s.id)

    if (sectionIds.length === 0) {
      return NextResponse.json([])
    }

    // Build query for comments
    let query = db
      .select({
        id: comments.id,
        sectionId: comments.sectionId,
        authorId: comments.authorId,
        authorName: users.name,
        authorEmail: users.email,
        content: comments.content,
        status: comments.status,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .orderBy(desc(comments.createdAt))

    // Filter by sectionId if provided
    if (sectionIdParam) {
      const projectComments = await query.where(
        eq(comments.sectionId, sectionIdParam)
      )
      return NextResponse.json(projectComments)
    }

    // Get all comments for project sections
    const allComments = []
    for (const sectionId of sectionIds) {
      const sectionComments = await db
        .select({
          id: comments.id,
          sectionId: comments.sectionId,
          authorId: comments.authorId,
          authorName: users.name,
          authorEmail: users.email,
          content: comments.content,
          status: comments.status,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.sectionId, sectionId))
        .orderBy(desc(comments.createdAt))

      allComments.push(...sectionComments)
    }

    return NextResponse.json(allComments)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/comments - Create a comment
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
    const { sectionId, content } = createCommentSchema.parse(body)

    // Verify section belongs to project
    const [section] = await db
      .select()
      .from(soaSections)
      .where(
        and(eq(soaSections.id, sectionId), eq(soaSections.projectId, projectId))
      )

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    // Create comment
    const [comment] = await db
      .insert(comments)
      .values({
        sectionId,
        authorId: session.user.id,
        content,
        status: "open",
      })
      .returning()

    return NextResponse.json(comment, { status: 201 })
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
    console.error("Failed to create comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/comments - Update a comment
export async function PATCH(
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
    const { commentId, status, content } = updateCommentSchema.parse(body)

    // Get the comment
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Verify comment belongs to a section in this project
    const [section] = await db
      .select()
      .from(soaSections)
      .where(
        and(
          eq(soaSections.id, existingComment.sectionId),
          eq(soaSections.projectId, projectId)
        )
      )

    if (!section) {
      return NextResponse.json(
        { error: "Comment not in this project" },
        { status: 403 }
      )
    }

    // Update comment
    const updateData: { status?: "open" | "resolved"; content?: string } = {}
    if (status) updateData.status = status
    if (content) updateData.content = content

    const [updated] = await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, commentId))
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
    console.error("Failed to update comment:", error)
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    )
  }
}
