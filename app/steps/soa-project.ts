/**
 * Project-based SOA Workflow Steps
 * Using Workflow DevKit for durability
 */

import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { db } from "@/lib/db"
import {
  documents,
  projects,
  workflowState,
  soaSections,
  soaVersions,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { soaStructuredPrompt } from "@/system_prompts/soa_structured"
import { soaSectionTemplates } from "@/lib/soa-schema"
import { soaResponseSchema } from "@/lib/soa-zod-schema"
import { main } from "@/system_prompts/main"
import { soaTemplate } from "@/system_prompts/soa_template"

// Types
interface DocumentData {
  id: string
  name: string
  content: string
  fileType: string
  qualityScore?: number
  qualityIssues?: string[]
}

interface ParseResult {
  success: boolean
  documents: DocumentData[]
  qualityScore?: number
  error?: string
}

interface GenerateResult {
  success: boolean
  sectionsCreated: number
  sectionsFailed: number
  partialSuccess: boolean
  error?: string
}

interface ComplianceResult {
  success: boolean
  issues: string[]
  criticalIssues: string[]
  warnings: string[]
  error?: string
}

interface ApprovalResult {
  approved: boolean
  comments?: string
}

interface FinalizeResult {
  success: boolean
  version: number
  error?: string
}

/**
 * Step 1: Parse and validate documents with quality assessment
 */
export async function stepParseDocuments(
  projectId: string
): Promise<ParseResult> {
  "use step"

  console.log(`[step1/stepParseDocuments] Function called`)
  console.log(`[step1/stepParseDocuments] Project ID:`, projectId)

  try {
    // Get all documents for the project
    console.log(`[step1/stepParseDocuments] Querying database for documents`)
    const projectDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))
    
    console.log(`[step1/stepParseDocuments] Found ${projectDocuments.length} documents`)

    if (projectDocuments.length === 0) {
      return {
        success: false,
        documents: [],
        error: "No documents found. Please upload documents first.",
      }
    }

    // Validate and assess document quality
    const validDocuments: DocumentData[] = []
    const qualityScores: number[] = []

    for (const doc of projectDocuments) {
      if (!doc.parsedContent || doc.parsedContent.trim().length === 0) {
        console.warn(`[step1] Document ${doc.name} has no parsed content`)
        continue
      }

      // Assess document quality
      const quality = assessDocumentQuality(doc.parsedContent, doc.name)
      qualityScores.push(quality.score)

      validDocuments.push({
        id: doc.id,
        name: doc.name,
        content: doc.parsedContent,
        fileType: doc.fileType,
        qualityScore: quality.score,
        qualityIssues: quality.issues,
      })
    }

    if (validDocuments.length === 0) {
      return {
        success: false,
        documents: [],
        error: "No documents with valid content found.",
      }
    }

    // Calculate overall quality score
    const overallQuality =
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length

    // Warn if quality is low but don't fail
    if (overallQuality < 0.5) {
      console.warn(
        `[step1] Low document quality score: ${overallQuality.toFixed(2)}. Proceeding with caution.`
      )
    }

    // Update workflow state
    await updateWorkflowStep(projectId, 1, "completed")

    return {
      success: true,
      documents: validDocuments,
      qualityScore: overallQuality,
    }
  } catch (error) {
    console.error("[step1] Error:", error)
    await updateWorkflowStep(projectId, 1, "failed")
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : "Failed to parse documents",
    }
  }
}

/**
 * Assess document quality based on content characteristics
 */
function assessDocumentQuality(
  content: string,
  fileName: string
): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 1.0

  // Check content length
  const contentLength = content.trim().length
  if (contentLength < 100) {
    issues.push("Document is very short (less than 100 characters)")
    score -= 0.3
  } else if (contentLength < 500) {
    issues.push("Document is short (less than 500 characters)")
    score -= 0.15
  }

  // Check for common financial planning keywords
  const financialKeywords = [
    "income",
    "superannuation",
    "retirement",
    "investment",
    "insurance",
    "tax",
    "age",
    "balance",
    "contribution",
  ]
  const lowerContent = content.toLowerCase()
  const foundKeywords = financialKeywords.filter((keyword) =>
    lowerContent.includes(keyword)
  )
  if (foundKeywords.length < 3) {
    issues.push("Document lacks common financial planning terminology")
    score -= 0.2
  }

  // Check for structured data indicators (numbers, dates, etc.)
  const hasNumbers = /\d/.test(content)
  const hasDates = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(content)
  if (!hasNumbers) {
    issues.push("Document appears to lack numerical data")
    score -= 0.15
  }
  if (!hasDates) {
    issues.push("Document appears to lack date information")
    score -= 0.1
  }

  // Check for placeholder or empty content markers
  if (
    content.includes("[MISSING") ||
    content.includes("[TBD") ||
    content.includes("N/A") ||
    content.includes("To be completed")
  ) {
    issues.push("Document contains placeholder or incomplete content markers")
    score -= 0.2
  }

  // Ensure score is between 0 and 1
  score = Math.max(0, Math.min(1, score))

  return { score, issues }
}

/**
 * Step 2: Generate SOA sections using LLM with structured output
 * 
 * Improvements implemented:
 * - Uses generateObject with Zod schema for type-safe, reliable JSON parsing
 * - Handles partial success (some sections may fail, workflow continues)
 * - Validates source mappings to ensure data integrity
 * - Includes document quality information in prompts
 * - Better error handling with detailed error messages
 * 
 * Future enhancements:
 * - Batch generation for very large document sets (split into groups)
 * - Streaming progress updates for real-time feedback
 * - Retry logic for failed sections
 */
export async function stepGenerateSOA(
  projectId: string,
  documentData: DocumentData[],
  userId?: string  // Optional userId for version tracking
): Promise<GenerateResult> {
  "use step"

  console.log(`[step2/stepGenerateSOA] Function called`)
  console.log(`[step2/stepGenerateSOA] Project ID:`, projectId)
  console.log(`[step2/stepGenerateSOA] User ID:`, userId)
  console.log(`[step2/stepGenerateSOA] Document data length:`, documentData?.length)
  console.log(`[step2/stepGenerateSOA] Document data:`, JSON.stringify(documentData?.map(d => ({ id: d.id, name: d.name, contentLength: d.content?.length })), null, 2))

  if (!projectId) {
    console.error(`[step2/stepGenerateSOA] ERROR: projectId is missing`)
    return {
      success: false,
      sectionsCreated: 0,
      sectionsFailed: 0,
      partialSuccess: false,
      error: "projectId is required",
    }
  }

  if (!documentData || documentData.length === 0) {
    console.error(`[step2/stepGenerateSOA] ERROR: No document data provided`)
    return {
      success: false,
      sectionsCreated: 0,
      sectionsFailed: 0,
      partialSuccess: false,
      error: "No document data provided",
    }
  }

  try {
    console.log(`[step2/stepGenerateSOA] Updating workflow step to in_progress`)
    await updateWorkflowStep(projectId, 2, "in_progress")
    console.log(`[step2/stepGenerateSOA] Workflow step updated successfully`)

    // Check for API key
    console.log(`[step2/stepGenerateSOA] Checking for AI_GATEWAY_API_KEY`)
    const apiKeyExists = !!process.env.AI_GATEWAY_API_KEY
    console.log(`[step2/stepGenerateSOA] API key exists:`, apiKeyExists)
    console.log(`[step2/stepGenerateSOA] API key length:`, process.env.AI_GATEWAY_API_KEY?.length || 0)
    
    if (!process.env.AI_GATEWAY_API_KEY) {
      console.error(`[step2/stepGenerateSOA] ERROR: AI_GATEWAY_API_KEY is not set`)
      await updateWorkflowStep(projectId, 2, "failed")
      return {
        success: false,
        sectionsCreated: 0,
        sectionsFailed: 0,
        partialSuccess: false,
        error: "AI_GATEWAY_API_KEY environment variable is not set",
      }
    }

    // Initialize OpenAI client with Vercel AI Gateway
    const openai = createOpenAI({
      baseURL: "https://ai-gateway.vercel.sh/v1",
      apiKey: process.env.AI_GATEWAY_API_KEY,
    })

    // Combine system prompts
    const systemPrompt = `${main}\n\n${soaTemplate}\n\n${soaStructuredPrompt}`

    // Build the user message with all document content
    console.log(`[step2/stepGenerateSOA] Building user message`)
    const userMessage = buildUserMessage(documentData)
    console.log(`[step2/stepGenerateSOA] User message length:`, userMessage?.length || 0)
    console.log(`[step2/stepGenerateSOA] System prompt length:`, systemPrompt?.length || 0)

    console.log(`[step2/stepGenerateSOA] Starting LLM generation for ${documentData.length} documents`)
    console.log(`[step2/stepGenerateSOA] Using model: openai/gpt-4o`)
    console.log(`[step2/stepGenerateSOA] Max tokens: 16000`)

    // Generate SOA content using structured output
    let parsedResponse
    try {
      const result = await generateObject({
        model: openai("openai/gpt-4o"),
        schema: soaResponseSchema,
        system: systemPrompt,
        prompt: userMessage,
        maxTokens: 16384, // GPT-4o max output tokens
      })

      parsedResponse = result.object
      console.log(`[step2] Generated ${parsedResponse.sections.length} sections with ${parsedResponse.summary.dataCompleteness.toFixed(2)} completeness`)
      console.log(`[step2] Section IDs generated:`, parsedResponse.sections.map(s => s.id).join(', '))
    } catch (generateError) {
      console.error("[step2] LLM generation error:", generateError)
      const errorMessage = generateError instanceof Error ? generateError.message : "Unknown error"
      
      // Check if it's an API key or authentication error
      if (errorMessage.includes("API key") || errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        await updateWorkflowStep(projectId, 2, "failed")
        return {
          success: false,
          sectionsCreated: 0,
          sectionsFailed: 0,
          partialSuccess: false,
          error: "LLM API authentication failed. Please check AI_GATEWAY_API_KEY environment variable.",
        }
      }
      
      // For other errors, fail the step
      await updateWorkflowStep(projectId, 2, "failed")
      return {
        success: false,
        sectionsCreated: 0,
        sectionsFailed: 0,
        partialSuccess: false,
        error: `LLM generation failed: ${errorMessage}`,
      }
    }

    // Delete existing sections for this project before inserting new ones
    // This prevents duplicate sections when regenerating
    try {
      const deleteResult = await db
        .delete(soaSections)
        .where(eq(soaSections.projectId, projectId))
      console.log(`[step2] Deleted existing sections for project ${projectId}`)
    } catch (deleteError) {
      console.error(`[step2] Failed to delete existing sections:`, deleteError)
      // Continue anyway - duplicates are handled in the UI
    }

    // Save sections to database with error handling
    let sectionsCreated = 0
    let sectionsFailed = 0
    const failedSections: string[] = []

    for (const section of parsedResponse.sections) {
      try {
        const template = soaSectionTemplates.find((t) => t.id === section.id)
        if (!template) {
          console.warn(`[step2] No template found for section ${section.id}`)
          sectionsFailed++
          failedSections.push(section.id)
          continue
        }

        // Validate source mappings
        const validatedSources = section.sources.map((s) => {
          const doc = documentData.find((d) => d.name === s.documentName)
          return {
            documentId: doc?.id ?? "",
            documentName: s.documentName,
            excerpt: s.excerpt,
            location: s.location,
          }
        })

        await db.insert(soaSections).values({
          projectId,
          sectionId: section.id,
          parentSectionId: template.parentId,
          title: section.title,
          contentType: template.contentType,
          content: section.content,
          sources: validatedSources,
          requiredFields: section.missingData ?? [],
          status: "generated",
          version: 1,
        })
        sectionsCreated++
      } catch (dbError) {
        console.error(`[step2] Failed to save section ${section.id}:`, dbError)
        sectionsFailed++
        failedSections.push(section.id)
        // Continue with other sections
      }
    }

    // Create initial version record (only if we have a valid userId)
    if (userId) {
      try {
        await db.insert(soaVersions).values({
          projectId,
          versionNumber: 1,
          patch: [],
          createdBy: userId,
          changeType: "generation",
          changeSummary: `Initial SOA generation: ${sectionsCreated} sections created${sectionsFailed > 0 ? `, ${sectionsFailed} failed` : ""}`,
        })
        console.log("[step2] Version record created successfully")
      } catch (versionError) {
        console.error("[step2] Failed to create version record:", versionError)
        // Don't fail the whole step if version creation fails
      }
    } else {
      console.log("[step2] Skipping version record creation - no userId provided")
    }

    // Determine if we had partial success
    const partialSuccess = sectionsCreated > 0 && sectionsFailed > 0
    const overallSuccess = sectionsCreated > 0

    if (overallSuccess) {
      await updateWorkflowStep(projectId, 2, "completed")
    } else {
      await updateWorkflowStep(projectId, 2, "failed")
    }

    return {
      success: overallSuccess,
      sectionsCreated,
      sectionsFailed,
      partialSuccess,
      error:
        sectionsFailed > 0
          ? `Failed to generate ${sectionsFailed} sections: ${failedSections.join(", ")}`
          : undefined,
    }
  } catch (error) {
    console.error("[step2] Error:", error)
    await updateWorkflowStep(projectId, 2, "failed")
    return {
      success: false,
      sectionsCreated: 0,
      sectionsFailed: 0,
      partialSuccess: false,
      error: error instanceof Error ? error.message : "Failed to generate SOA",
    }
  }
}

/**
 * Step 3: Enhanced regulatory compliance check
 */
export async function stepRegulatoryCheck(
  projectId: string
): Promise<ComplianceResult> {
  "use step"

  try {
    await updateWorkflowStep(projectId, 3, "in_progress")

    // Get all sections
    const sections = await db
      .select()
      .from(soaSections)
      .where(eq(soaSections.projectId, projectId))

    const issues: string[] = []
    const criticalIssues: string[] = []
    const warnings: string[] = []

    // Check for missing required main sections (ASIC RG 175 requirement)
    const requiredMainSections = ["M1", "M2", "M5", "M8", "M9", "M10"]
    for (const sectionId of requiredMainSections) {
      const found = sections.find((s) => s.sectionId === sectionId)
      if (!found) {
        criticalIssues.push(`Missing required section: ${sectionId} (ASIC RG 175 requirement)`)
      } else {
        // Check if section has meaningful content
        const content = found.content as { text?: string; tables?: unknown[]; bullets?: string[] }
        const hasContent =
          (content.text && content.text.length > 50) ||
          (content.tables && content.tables.length > 0) ||
          (content.bullets && content.bullets.length > 0)

        if (!hasContent) {
          warnings.push(`Section ${sectionId} exists but appears to be empty or placeholder content`)
        }
      }
    }

    // Check for sections with missing critical data
    for (const section of sections) {
      if (
        section.requiredFields &&
        Array.isArray(section.requiredFields) &&
        section.requiredFields.length > 0
      ) {
        const missingFields = section.requiredFields as string[]
        const criticalFields = missingFields.filter((field) =>
          field.includes("client") || field.includes("income") || field.includes("super")
        )

        if (criticalFields.length > 0) {
          criticalIssues.push(
            `Section ${section.sectionId} missing critical data: ${criticalFields.join(", ")}`
          )
        } else {
          warnings.push(
            `Section ${section.sectionId} has missing data: ${missingFields.join(", ")}`
          )
        }
      }
    }

    // Check for source attribution (required for audit trail)
    let sectionsWithoutSources = 0
    for (const section of sections) {
      const sources = section.sources as Array<{ documentName: string }>
      if (!sources || sources.length === 0) {
        sectionsWithoutSources++
      }
    }
    if (sectionsWithoutSources > 0) {
      warnings.push(
        `${sectionsWithoutSources} section(s) lack source attribution (audit trail requirement)`
      )
    }

    // Check M8 section for fee disclosures (ASIC requirement)
    const m8Section = sections.find((s) => s.sectionId === "M8")
    if (m8Section) {
      const m8Content = m8Section.content as { text?: string }
      const content = m8Content.text?.toLowerCase() || ""
      if (!content.includes("fee") && !content.includes("cost")) {
        warnings.push("M8 section may be missing fee disclosure information")
      }
    }

    // Check M5 section for recommendations (must have rationale)
    const m5Section = sections.find((s) => s.sectionId === "M5")
    if (m5Section) {
      const m5Content = m5Section.content as { text?: string; tables?: unknown[] }
      const hasRecommendations =
        (m5Content.tables && m5Content.tables.length > 0) ||
        (m5Content.text && m5Content.text.length > 100)
      if (!hasRecommendations) {
        criticalIssues.push("M5 section (Recommendations) appears incomplete or missing")
      }
    }

    // Check M9 section for client declaration (must exist)
    const m9Section = sections.find((s) => s.sectionId === "M9")
    if (!m9Section) {
      criticalIssues.push("M9 section (Agreement to Proceed) is missing - required for client signature")
    }

    // Overall assessment
    // Note: Compliance check should NOT fail the workflow - it identifies issues
    // for the user to address during review. Only actual errors should fail.
    const hasCriticalIssues = criticalIssues.length > 0
    
    // Log issues for visibility but don't fail
    if (hasCriticalIssues) {
      console.log(`[step3] Compliance found ${criticalIssues.length} critical issue(s) to address:`)
      criticalIssues.forEach(issue => console.log(`  - ${issue}`))
    }
    if (warnings.length > 0) {
      console.log(`[step3] Compliance found ${warnings.length} warning(s):`)
      warnings.forEach(warning => console.log(`  - ${warning}`))
    }

    // Always mark as completed - issues are informational for review
    await updateWorkflowStep(projectId, 3, "completed")

    return {
      success: true, // Compliance check itself succeeded (found issues to review)
      issues: [...criticalIssues, ...warnings],
      criticalIssues,
      warnings,
    }
  } catch (error) {
    console.error("[step3] Error:", error)
    await updateWorkflowStep(projectId, 3, "failed")
    return {
      success: false,
      issues: [],
      criticalIssues: [],
      warnings: [],
      error: error instanceof Error ? error.message : "Failed to run compliance check",
    }
  }
}

/**
 * Step 4: Await paraplanner approval (HITL)
 * This step marks the workflow as awaiting approval.
 * The approval/rejection is handled via the /api/projects/[id]/approve endpoint.
 */
export async function stepAwaitParaplannerApproval(
  projectId: string
): Promise<ApprovalResult> {
  "use step"

  try {
    // Check if already approved (for workflow resume scenarios)
    const [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    if (state?.stepStatuses?.step4 === "completed") {
      return { approved: true }
    }

    // Mark as awaiting approval
    await updateWorkflowStep(projectId, 4, "awaiting_approval")

    // Update project status to review
    await db
      .update(projects)
      .set({ status: "review", updatedAt: new Date() })
      .where(eq(projects.id, projectId))

    // Return pending - workflow will be manually advanced via approve API
    return { approved: false }
  } catch (error) {
    console.error("[step4] Error:", error)
    await updateWorkflowStep(projectId, 4, "failed")
    return { approved: false }
  }
}

/**
 * Step 5: Await financial planner approval (HITL)
 * This step marks the workflow as awaiting approval.
 * The approval/rejection is handled via the /api/projects/[id]/approve endpoint.
 */
export async function stepAwaitFPApproval(
  projectId: string
): Promise<ApprovalResult> {
  "use step"

  try {
    // Check if already approved (for workflow resume scenarios)
    const [state] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    if (state?.stepStatuses?.step5 === "completed") {
      return { approved: true }
    }

    // Mark as awaiting approval
    await updateWorkflowStep(projectId, 5, "awaiting_approval")

    // Return pending - workflow will be manually advanced via approve API
    return { approved: false }
  } catch (error) {
    console.error("[step5] Error:", error)
    await updateWorkflowStep(projectId, 5, "failed")
    return { approved: false }
  }
}

/**
 * Step 6: Finalize document
 */
export async function stepFinalizeDocument(
  projectId: string,
  userId: string
): Promise<FinalizeResult> {
  "use step"

  try {
    await updateWorkflowStep(projectId, 6, "in_progress")

    // Get current version
    const versions = await db
      .select()
      .from(soaVersions)
      .where(eq(soaVersions.projectId, projectId))

    const newVersion = versions.length + 1

    // Create final version record
    await db.insert(soaVersions).values({
      projectId,
      versionNumber: newVersion,
      patch: [],
      createdBy: userId,
      changeType: "approval",
      changeSummary: "Final approved version",
    })

    // Update all sections to approved status
    await db
      .update(soaSections)
      .set({ status: "approved", version: newVersion, updatedAt: new Date() })
      .where(eq(soaSections.projectId, projectId))

    // Update project status to completed
    await db
      .update(projects)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(projects.id, projectId))

    await updateWorkflowStep(projectId, 6, "completed")

    return {
      success: true,
      version: newVersion,
    }
  } catch (error) {
    console.error("[step6] Error:", error)
    await updateWorkflowStep(projectId, 6, "failed")
    return {
      success: false,
      version: 0,
      error: error instanceof Error ? error.message : "Failed to finalize document",
    }
  }
}

// Helper functions

async function updateWorkflowStep(
  projectId: string,
  step: number,
  status: "pending" | "in_progress" | "completed" | "failed" | "awaiting_approval"
) {
  console.log(`[updateWorkflowStep] Called with projectId=${projectId}, step=${step}, status=${status}`)
  
  const stepKey = `step${step}` as keyof typeof defaultStatuses
  console.log(`[updateWorkflowStep] Step key: ${stepKey}`)

  try {
    const [current] = await db
      .select()
      .from(workflowState)
      .where(eq(workflowState.projectId, projectId))

    console.log(`[updateWorkflowStep] Current workflow state:`, current ? "exists" : "not found")
    
    if (!current) {
      console.log(`[updateWorkflowStep] Creating new workflow state`)
      const newState = {
        projectId,
        currentStep: step,
        stepStatuses: {
          ...defaultStatuses,
          [stepKey]: status,
        },
      }
      console.log(`[updateWorkflowStep] New state:`, JSON.stringify(newState, null, 2))
      await db.insert(workflowState).values(newState)
      console.log(`[updateWorkflowStep] Workflow state created successfully`)
    } else {
      console.log(`[updateWorkflowStep] Updating existing workflow state (id: ${current.id})`)
      const updatedStatuses = {
        ...current.stepStatuses,
        [stepKey]: status,
      }
      console.log(`[updateWorkflowStep] Updated statuses:`, JSON.stringify(updatedStatuses, null, 2))
      await db
        .update(workflowState)
        .set({
          currentStep: step,
          stepStatuses: updatedStatuses,
          updatedAt: new Date(),
        })
        .where(eq(workflowState.id, current.id))
      console.log(`[updateWorkflowStep] Workflow state updated successfully`)
    }
  } catch (error) {
    console.error(`[updateWorkflowStep] ERROR updating workflow step:`, error)
    throw error
  }
}

const defaultStatuses = {
  step1: "pending" as const,
  step2: "pending" as const,
  step3: "pending" as const,
  step4: "pending" as const,
  step5: "pending" as const,
  step6: "pending" as const,
}

function buildUserMessage(documents: DocumentData[]): string {
  const parts = [
    "Analyze the following client documents and generate a structured Statement of Advice (SOA) in JSON format.",
    "For each piece of information, include source attribution showing which document it came from.",
    "",
    "--- CLIENT DOCUMENTS ---",
  ]

  for (const doc of documents) {
    parts.push("")
    parts.push(`=== Document: ${doc.name} (${doc.fileType}) ===`)
    if (doc.qualityScore !== undefined) {
      parts.push(`[Document Quality Score: ${(doc.qualityScore * 100).toFixed(0)}%]`)
      if (doc.qualityIssues && doc.qualityIssues.length > 0) {
        parts.push(`[Quality Issues: ${doc.qualityIssues.join("; ")}]`)
      }
    }
    parts.push(doc.content)
    parts.push("")
  }

  parts.push("--- END OF DOCUMENTS ---")
  parts.push("")
  parts.push("Generate the SOA content as a JSON object following the structure specified in the system prompt.")
  parts.push("If document quality is low or data is missing, clearly mark missing data and include clarification questions.")

  return parts.join("\n")
}
