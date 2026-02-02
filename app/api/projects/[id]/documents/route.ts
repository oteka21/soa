import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, documents } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import mammoth from "mammoth"

const createDocumentsSchema = z.object({
  documents: z.array(
    z.object({
      url: z.string().url(),
      name: z.string(),
    })
  ),
})

function isDocx(name: string): boolean {
  return name.toLowerCase().endsWith(".docx")
}

function isTxt(name: string): boolean {
  return name.toLowerCase().endsWith(".txt")
}

async function extractDocumentContent(
  url: string,
  name: string
): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${name}`)
  }

  if (isDocx(name)) {
    const buffer = Buffer.from(await response.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    if (result.messages.length > 0) {
      console.log(`[mammoth] messages for ${name}:`, result.messages)
    }
    return result.value
  }

  if (isTxt(name)) {
    return response.text()
  }

  // For other file types, try to get text content
  const text = await response.text()
  return text
}

function getFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  const typeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
  }
  return typeMap[ext] ?? "application/octet-stream"
}

// POST /api/projects/[id]/documents - Upload documents to a project
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
    const validatedData = createDocumentsSchema.parse(body)

    // Process and save each document
    const savedDocuments = []
    for (const doc of validatedData.documents) {
      try {
        const parsedContent = await extractDocumentContent(doc.url, doc.name)
        const fileType = getFileType(doc.name)

        const [saved] = await db
          .insert(documents)
          .values({
            projectId,
            name: doc.name,
            url: doc.url,
            parsedContent,
            fileType,
          })
          .returning()

        savedDocuments.push(saved)
        console.log(
          `[document saved] ${doc.name} | length=${parsedContent.length}`
        )
      } catch (error) {
        console.error(`Failed to process document ${doc.name}:`, error)
        // Continue with other documents
      }
    }

    // Update project status if this is the first upload
    if (project.status === "draft" && savedDocuments.length > 0) {
      await db
        .update(projects)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(projects.id, projectId))
    }

    return NextResponse.json(savedDocuments, { status: 201 })
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
    console.error("Failed to save documents:", error)
    return NextResponse.json(
      { error: "Failed to save documents" },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/documents - Get all documents for a project
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

    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))

    return NextResponse.json(projectDocuments)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
