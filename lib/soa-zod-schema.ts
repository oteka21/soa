/**
 * Zod schemas for structured SOA generation
 * Used with generateObject for type-safe LLM output
 * 
 * IMPORTANT: OpenAI's structured output requires ALL properties to be marked as required.
 * Do NOT use .optional() - instead use nullable types or empty defaults.
 */

import { z } from "zod"

// Source reference schema
// Note: All fields must be required for OpenAI structured output
export const sourceReferenceSchema = z.object({
  documentName: z.string().describe("Name of the source document"),
  excerpt: z.string().describe("Relevant quote or paraphrase from the document"),
  location: z.string().describe("Page number or section location, or empty string if not available"),
})

// Table data schema
export const tableDataSchema = z.object({
  headers: z.array(z.string()).describe("Table column headers"),
  rows: z.array(z.array(z.string())).describe("Table rows, each row is an array of cell values"),
})

// Section content schema
// All fields required - use empty string/array when not applicable
export const sectionContentSchema = z.object({
  text: z.string().describe("Narrative text content for paragraph sections, or empty string if not applicable"),
  tables: z.array(tableDataSchema).describe("Table data for table sections, or empty array if not applicable"),
  bullets: z.array(z.string()).describe("Bullet points for bulleted sections, or empty array if not applicable"),
})

// SOA section schema
// All fields required - use empty arrays when not applicable
export const soaSectionSchema = z.object({
  id: z.string().describe("Section ID (e.g., M1, M3_S1, M3_S7_SS1)"),
  title: z.string().describe("Section title"),
  content: sectionContentSchema.describe("Section content"),
  sources: z.array(sourceReferenceSchema).describe("Source references for all data in this section"),
  missingData: z.array(z.string()).describe("List of required data that was not found, or empty array if complete"),
  clarificationQuestions: z.array(z.string()).describe("Questions to ask for missing data, or empty array if none"),
})

// Summary schema
export const soaSummarySchema = z.object({
  dataCompleteness: z.number().min(0).max(1).describe("Overall data completeness score (0-1)"),
  sectionsGenerated: z.number().describe("Number of sections successfully generated"),
  sectionsNeedingClarification: z.number().describe("Number of sections with missing data"),
  keyMissingItems: z.array(z.string()).describe("List of critical missing information, or empty array if complete"),
})

// Complete SOA response schema
export const soaResponseSchema = z.object({
  sections: z.array(soaSectionSchema).describe("All generated SOA sections"),
  summary: soaSummarySchema.describe("Summary of generation results"),
})

export type SOAResponse = z.infer<typeof soaResponseSchema>
export type SOASection = z.infer<typeof soaSectionSchema>
export type SectionContent = z.infer<typeof sectionContentSchema>
