/**
 * Project-based SOA Workflow
 * 
 * This workflow processes a project through the SOA generation pipeline:
 * 1. Parse documents (already done during upload)
 * 2. Generate SOA sections using LLM
 * 3. Regulatory compliance check
 * 4. Paraplanner review (HITL)
 * 5. Financial planner review (HITL)
 * 6. Finalize document
 */

import {
  stepParseDocuments,
  stepGenerateSOA,
  stepRegulatoryCheck,
  stepAwaitParaplannerApproval,
  stepAwaitFPApproval,
  stepFinalizeDocument,
} from "@/app/steps/soa-project"

export interface ProjectWorkflowInput {
  projectId: string
  userId: string
}

export interface ProjectWorkflowResult {
  projectId: string
  success: boolean
  currentStep: number
  status: "completed" | "awaiting_approval" | "failed"
  error?: string
}

export async function buildProjectSoa(
  input: ProjectWorkflowInput
): Promise<ProjectWorkflowResult> {
  "use workflow"

  console.log("[workflow/buildProjectSoa] Function called")
  console.log("[workflow/buildProjectSoa] Input received:", JSON.stringify(input, null, 2))
  console.log("[workflow/buildProjectSoa] Input type:", typeof input)
  console.log("[workflow/buildProjectSoa] Input is undefined?", input === undefined)
  console.log("[workflow/buildProjectSoa] Input is null?", input === null)

  if (!input) {
    const errorMsg = "Input is undefined or null"
    console.error(`[workflow/buildProjectSoa] ERROR: ${errorMsg}`)
    throw new Error(errorMsg)
  }

  if (!input.projectId) {
    const errorMsg = "projectId is missing from input"
    console.error(`[workflow/buildProjectSoa] ERROR: ${errorMsg}`)
    console.error(`[workflow/buildProjectSoa] Input keys:`, Object.keys(input))
    throw new Error(errorMsg)
  }

  if (!input.userId) {
    const errorMsg = "userId is missing from input"
    console.error(`[workflow/buildProjectSoa] ERROR: ${errorMsg}`)
    throw new Error(errorMsg)
  }

  const { projectId, userId } = input

  console.log(`[workflow/buildProjectSoa] Starting SOA workflow for project ${projectId}, user ${userId}`)

  try {
    // Step 1: Parse documents (documents are already parsed during upload,
    // but this step validates and prepares them for generation)
    console.log("[workflow/buildProjectSoa] Step 1: Validating parsed documents")
    console.log("[workflow/buildProjectSoa] Calling stepParseDocuments with projectId:", projectId)
    const parseResult = await stepParseDocuments(projectId)
    console.log("[workflow/buildProjectSoa] Step 1 result:", JSON.stringify({ success: parseResult.success, documentCount: parseResult.documents?.length, error: parseResult.error }, null, 2))
    
    if (!parseResult.success) {
      console.error("[workflow/buildProjectSoa] Step 1 failed:", parseResult.error)
      return {
        projectId,
        success: false,
        currentStep: 1,
        status: "failed",
        error: parseResult.error,
      }
    }

    // Step 2: Generate SOA sections using LLM
    console.log("[workflow/buildProjectSoa] Step 2: Generating SOA sections")
    console.log("[workflow/buildProjectSoa] Calling stepGenerateSOA with projectId:", projectId, "documentCount:", parseResult.documents.length, "userId:", userId)
    const generateResult = await stepGenerateSOA(projectId, parseResult.documents, userId)
    console.log("[workflow/buildProjectSoa] Step 2 result:", JSON.stringify({ success: generateResult.success, sectionsCreated: generateResult.sectionsCreated, sectionsFailed: generateResult.sectionsFailed, error: generateResult.error }, null, 2))
    if (!generateResult.success) {
      // Allow partial success - if some sections were created, continue with warnings
      if (generateResult.partialSuccess && generateResult.sectionsCreated > 0) {
        console.warn(
          `[workflow] Partial success: ${generateResult.sectionsCreated} sections created, ${generateResult.sectionsFailed} failed`
        )
        // Continue workflow but note the partial success
      } else {
        return {
          projectId,
          success: false,
          currentStep: 2,
          status: "failed",
          error: generateResult.error || "Failed to generate any SOA sections",
        }
      }
    }

    // Step 3: Regulatory compliance check
    // Note: This step identifies issues but doesn't block - user reviews in step 4
    console.log("[workflow] Step 3: Running regulatory compliance check")
    const complianceResult = await stepRegulatoryCheck(projectId)
    
    // Log issues for visibility - they'll be shown in the review UI
    if (complianceResult.criticalIssues?.length > 0) {
      console.log(`[workflow] Compliance issues found (for review):`, complianceResult.criticalIssues)
    }
    if (complianceResult.warnings?.length > 0) {
      console.log(`[workflow] Compliance warnings (for review):`, complianceResult.warnings)
    }
    
    // Only fail if there was an actual error (not just compliance issues)
    if (complianceResult.error) {
      console.error(`[workflow] Compliance check error:`, complianceResult.error)
      return {
        projectId,
        success: false,
        currentStep: 3,
        status: "failed",
        error: complianceResult.error,
      }
    }
    
    console.log("[workflow] Compliance check complete - proceeding to review")

    // Step 4: Paraplanner review (HITL - waits for approval)
    console.log("[workflow] Step 4: Awaiting paraplanner review")
    const paraplannerResult = await stepAwaitParaplannerApproval(projectId)
    if (!paraplannerResult.approved) {
      return {
        projectId,
        success: false,
        currentStep: 4,
        status: "awaiting_approval",
      }
    }

    // Step 5: Financial planner review (HITL - waits for approval)
    console.log("[workflow] Step 5: Awaiting financial planner review")
    const fpResult = await stepAwaitFPApproval(projectId)
    if (!fpResult.approved) {
      return {
        projectId,
        success: false,
        currentStep: 5,
        status: "awaiting_approval",
      }
    }

    // Step 6: Finalize document
    console.log("[workflow] Step 6: Finalizing document")
    const finalResult = await stepFinalizeDocument(projectId, userId)
    if (!finalResult.success) {
      return {
        projectId,
        success: false,
        currentStep: 6,
        status: "failed",
        error: finalResult.error,
      }
    }

    console.log(`[workflow] Workflow completed for project ${projectId}`)
    return {
      projectId,
      success: true,
      currentStep: 6,
      status: "completed",
    }
  } catch (error) {
    console.error("[workflow] Workflow error:", error)
    return {
      projectId,
      success: false,
      currentStep: 0,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
