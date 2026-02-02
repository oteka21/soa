import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, documents, soaSections } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { soaResponseSchema } from "@/lib/soa-zod-schema"
import { soaStructuredPrompt } from "@/system_prompts/soa_structured"
import { main } from "@/system_prompts/main"
import { soaTemplate } from "@/system_prompts/soa_template"
import { soaSectionTemplates } from "@/lib/soa-schema"
import { createVersion } from "@/lib/version-control"

// POST /api/projects/[id]/sections/[sectionId]/regenerate - Regenerate a single section
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await requireSession()
    const { id: projectId, sectionId } = await params

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

    // Get the section template
    const template = soaSectionTemplates.find((t) => t.id === sectionId)
    if (!template) {
      return NextResponse.json(
        { error: `Section template ${sectionId} not found` },
        { status: 404 }
      )
    }

    // Get project documents
    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))

    if (projectDocuments.length === 0) {
      return NextResponse.json(
        { error: "No documents found. Please upload documents first." },
        { status: 400 }
      )
    }

    // Build document data
    const documentData = projectDocuments
      .filter((doc) => doc.parsedContent && doc.parsedContent.trim().length > 0)
      .map((doc) => ({
        id: doc.id,
        name: doc.name,
        content: doc.parsedContent!,
        fileType: doc.fileType,
      }))

    if (documentData.length === 0) {
      return NextResponse.json(
        { error: "No documents with valid content found." },
        { status: 400 }
      )
    }

    // Build user message focused on this specific section
    const userMessage = buildSectionUserMessage(documentData, template)

    // Initialize OpenAI client
    const openai = createOpenAI({
      baseURL: "https://ai-gateway.vercel.sh/v1",
      apiKey: process.env.AI_GATEWAY_API_KEY,
    })

    // Combine system prompts
    const systemPrompt = `${main}\n\n${soaTemplate}\n\n${soaStructuredPrompt}\n\nIMPORTANT: Generate content ONLY for section ${sectionId} (${template.title}). Do not generate other sections.`

    // Generate section content
    let generatedSection
    try {
      const result = await generateObject({
        model: openai("openai/gpt-4o"),
        schema: soaResponseSchema,
        system: systemPrompt,
        prompt: userMessage,
      })

      // Find the section we generated
      generatedSection = result.object.sections.find((s) => s.id === sectionId)
      if (!generatedSection) {
        throw new Error(`Section ${sectionId} was not generated`)
      }
    } catch (generateError) {
      console.error("[regenerate] LLM generation error:", generateError)
      return NextResponse.json(
        {
          error: "Failed to regenerate section",
          details: generateError instanceof Error ? generateError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    // Find existing section
    const [existingSection] = await db
      .select()
      .from(soaSections)
      .where(
        and(
          eq(soaSections.projectId, projectId),
          eq(soaSections.sectionId, sectionId)
        )
      )

    // Validate source mappings
    const validatedSources = generatedSection.sources.map((s) => {
      const doc = documentData.find((d) => d.name === s.documentName)
      return {
        documentId: doc?.id ?? "",
        documentName: s.documentName,
        excerpt: s.excerpt,
        location: s.location,
      }
    })

    if (existingSection) {
      // Update existing section
      const [updated] = await db
        .update(soaSections)
        .set({
          content: generatedSection.content,
          sources: validatedSources,
          requiredFields: generatedSection.missingData ?? [],
          status: "generated",
          updatedAt: new Date(),
        })
        .where(eq(soaSections.id, existingSection.id))
        .returning()

      // Create version record
      await createVersion(
        projectId,
        session.user.id,
        "edit",
        `Regenerated section: ${sectionId}`
      )

      return NextResponse.json(updated)
    } else {
      // Create new section
      const [created] = await db
        .insert(soaSections)
        .values({
          projectId,
          sectionId: generatedSection.id,
          parentSectionId: template.parentId,
          title: generatedSection.title,
          contentType: template.contentType,
          content: generatedSection.content,
          sources: validatedSources,
          requiredFields: generatedSection.missingData ?? [],
          status: "generated",
          version: 1,
        })
        .returning()

      // Create version record
      await createVersion(
        projectId,
        session.user.id,
        "edit",
        `Added and generated section: ${sectionId}`
      )

      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to regenerate section:", error)
    return NextResponse.json(
      {
        error: "Failed to regenerate section",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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
