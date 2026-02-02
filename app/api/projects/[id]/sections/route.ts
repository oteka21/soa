import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, soaSections, documents } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { createVersion } from "@/lib/version-control"
import { soaSectionTemplates } from "@/lib/soa-schema"

const updateSectionSchema = z.object({
  sectionId: z.string(),
  content: z.object({
    text: z.string().optional(),
    tables: z
      .array(
        z.object({
          headers: z.array(z.string()),
          rows: z.array(z.array(z.string())),
        })
      )
      .optional(),
    bullets: z.array(z.string()).optional(),
  }),
  sources: z
    .array(
      z.object({
        documentId: z.string(),
        documentName: z.string(),
        excerpt: z.string(),
        location: z.string().optional(),
      })
    )
    .optional(),
})

// GET /api/projects/[id]/sections - Get all sections for a project
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

    const sections = await db
      .select()
      .from(soaSections)
      .where(eq(soaSections.projectId, projectId))

    return NextResponse.json(sections)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch sections:", error)
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/sections - Update a section
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
    const { sectionId, content, sources } = updateSectionSchema.parse(body)

    // Find the section
    const [existingSection] = await db
      .select()
      .from(soaSections)
      .where(
        and(
          eq(soaSections.projectId, projectId),
          eq(soaSections.sectionId, sectionId)
        )
      )

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    // Update the section
    const [updated] = await db
      .update(soaSections)
      .set({
        content,
        sources: sources ?? existingSection.sources,
        status: "reviewed",
        updatedAt: new Date(),
      })
      .where(eq(soaSections.id, existingSection.id))
      .returning()

    // Create a new version
    await createVersion(
      projectId,
      session.user.id,
      "edit",
      `Updated section: ${sectionId}`
    )

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
    console.error("Failed to update section:", error)
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    )
  }
}

const addSectionSchema = z.object({
  sectionId: z.string(),
  generateContent: z.boolean().optional().default(true),
})

// POST /api/projects/[id]/sections - Add a new section
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
    const { sectionId, generateContent } = addSectionSchema.parse(body)

    // Check if section already exists
    const [existing] = await db
      .select()
      .from(soaSections)
      .where(
        and(
          eq(soaSections.projectId, projectId),
          eq(soaSections.sectionId, sectionId)
        )
      )

    if (existing) {
      return NextResponse.json(
        { error: `Section ${sectionId} already exists` },
        { status: 400 }
      )
    }

    // Get template
    const template = soaSectionTemplates.find((t) => t.id === sectionId)
    if (!template) {
      return NextResponse.json(
        { error: `Section template ${sectionId} not found` },
        { status: 404 }
      )
    }

    let content: z.infer<typeof updateSectionSchema>["content"] = {}
    let sources: Array<{
      documentId: string
      documentName: string
      excerpt: string
      location?: string
    }> = []
    let requiredFields: string[] = template.requiredFields

    // Generate content if requested
    if (generateContent) {
      // Get project documents
      const projectDocuments = await db
        .select()
        .from(documents)
        .where(eq(documents.projectId, projectId))

      const documentData = projectDocuments
        .filter((doc) => doc.parsedContent && doc.parsedContent.trim().length > 0)
        .map((doc) => ({
          id: doc.id,
          name: doc.name,
          content: doc.parsedContent!,
          fileType: doc.fileType,
        }))

      if (documentData.length > 0) {
        try {
          const { generateObject } = await import("ai")
          const { createOpenAI } = await import("@ai-sdk/openai")
          const { soaResponseSchema } = await import("@/lib/soa-zod-schema")
          const { soaStructuredPrompt } = await import("@/system_prompts/soa_structured")
          const { main } = await import("@/system_prompts/main")
          const { soaTemplate } = await import("@/system_prompts/soa_template")

          const openai = createOpenAI({
            baseURL: "https://ai-gateway.vercel.sh/v1",
            apiKey: process.env.AI_GATEWAY_API_KEY,
          })

          const systemPrompt = `${main}\n\n${soaTemplate}\n\n${soaStructuredPrompt}\n\nIMPORTANT: Generate content ONLY for section ${sectionId} (${template.title}). Do not generate other sections.`

          const userMessage = buildSectionUserMessage(documentData, template)

          const result = await generateObject({
            model: openai("openai/gpt-4o"),
            schema: soaResponseSchema,
            system: systemPrompt,
            prompt: userMessage,
          })

          const generatedSection = result.object.sections.find((s) => s.id === sectionId)
          if (generatedSection) {
            content = generatedSection.content
            sources = generatedSection.sources.map((s) => {
              const doc = documentData.find((d) => d.name === s.documentName)
              return {
                documentId: doc?.id ?? "",
                documentName: s.documentName,
                excerpt: s.excerpt,
                location: s.location,
              }
            })
            requiredFields = generatedSection.missingData || []
          }
        } catch (error) {
          console.error("Failed to generate content for new section:", error)
          // Continue with empty section
        }
      }
    }

    // Create the section
    const [created] = await db
      .insert(soaSections)
      .values({
        projectId,
        sectionId: template.id,
        parentSectionId: template.parentId,
        title: template.title,
        contentType: template.contentType,
        content,
        sources,
        requiredFields,
        status: generateContent ? "generated" : "pending",
        version: 1,
      })
      .returning()

    // Create version record
    await createVersion(
      projectId,
      session.user.id,
      "edit",
      `Added section: ${sectionId}${generateContent ? " (with generated content)" : " (empty)"}`
    )

    return NextResponse.json(created, { status: 201 })
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
    console.error("Failed to add section:", error)
    return NextResponse.json(
      { error: "Failed to add section" },
      { status: 500 }
    )
  }
}

function buildSectionUserMessage(
  documents: Array<{ name: string; content: string; fileType: string }>,
  template: { id: string; title: string; description: string }
): string {
  const parts = [
    `Generate content for section ${template.id}: ${template.title}`,
    `Description: ${template.description}`,
    "",
    "Analyze the following client documents and generate content ONLY for this section.",
    "Include source attribution showing which document each piece of information came from.",
    "",
    "--- CLIENT DOCUMENTS ---",
  ]

  for (const doc of documents) {
    parts.push("")
    parts.push(`=== Document: ${doc.name} (${doc.fileType}) ===`)
    parts.push(doc.content)
    parts.push("")
  }

  parts.push("--- END OF DOCUMENTS ---")
  parts.push("")
  parts.push(
    `Generate the content for section ${template.id} as a JSON object following the structure specified in the system prompt.`
  )

  return parts.join("\n")
}
