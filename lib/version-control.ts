/**
 * Version Control for SOA documents using JSON Patch (RFC 6902)
 */

import { createPatch, applyPatch } from "rfc6902"
import { db } from "./db"
import { soaSections, soaVersions } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import type { SOASection, SectionContent, SourceReference } from "./soa-schema"

// Type for sections stored in DB
interface DBSection {
  id: string
  projectId: string
  sectionId: string
  parentSectionId: string | null
  title: string
  contentType: string
  content: SectionContent
  sources: SourceReference[]
  requiredFields: string[]
  status: string
  version: number
  updatedAt: Date
}

// Simplified section for version comparison
interface VersionableSection {
  sectionId: string
  title: string
  content: SectionContent
  sources: SourceReference[]
  status: string
}

/**
 * Create a new version when SOA content changes
 */
export async function createVersion(
  projectId: string,
  userId: string,
  changeType: "generation" | "edit" | "approval",
  changeSummary?: string
): Promise<number> {
  // Get current sections
  const currentSections = await db
    .select()
    .from(soaSections)
    .where(eq(soaSections.projectId, projectId))

  // Get previous version's content
  const versions = await db
    .select()
    .from(soaVersions)
    .where(eq(soaVersions.projectId, projectId))
    .orderBy(asc(soaVersions.versionNumber))

  const newVersionNumber = versions.length + 1

  // For the first version, there's no previous content to diff against
  if (versions.length === 0) {
    await db.insert(soaVersions).values({
      projectId,
      versionNumber: newVersionNumber,
      patch: [], // No patch for initial version
      createdBy: userId,
      changeType,
      changeSummary: changeSummary ?? "Initial version",
    })
    return newVersionNumber
  }

  // Reconstruct previous content by applying all patches
  const previousContent = await getContentAtVersion(
    projectId,
    versions.length
  )

  // Current content as versionable sections
  const currentContent: VersionableSection[] = currentSections.map((s) => ({
    sectionId: s.sectionId,
    title: s.title,
    content: s.content as SectionContent,
    sources: s.sources as SourceReference[],
    status: s.status ?? "pending",
  }))

  // Create patch
  const patch = createPatch(previousContent, currentContent)

  // Save new version
  await db.insert(soaVersions).values({
    projectId,
    versionNumber: newVersionNumber,
    patch,
    createdBy: userId,
    changeType,
    changeSummary,
  })

  // Update section versions
  await db
    .update(soaSections)
    .set({ version: newVersionNumber })
    .where(eq(soaSections.projectId, projectId))

  return newVersionNumber
}

/**
 * Get content at a specific version by applying patches
 */
export async function getContentAtVersion(
  projectId: string,
  targetVersion: number
): Promise<VersionableSection[]> {
  // Get all versions up to target
  const versions = await db
    .select()
    .from(soaVersions)
    .where(eq(soaVersions.projectId, projectId))
    .orderBy(asc(soaVersions.versionNumber))

  if (versions.length === 0) {
    return []
  }

  // For version 1, we need to get the initial state
  // We reconstruct by getting current state and un-applying newer patches
  const currentSections = await db
    .select()
    .from(soaSections)
    .where(eq(soaSections.projectId, projectId))

  let content: VersionableSection[] = currentSections.map((s) => ({
    sectionId: s.sectionId,
    title: s.title,
    content: s.content as SectionContent,
    sources: s.sources as SourceReference[],
    status: s.status ?? "pending",
  }))

  // If requesting current version, return as-is
  const currentVersion = versions[versions.length - 1].versionNumber
  if (targetVersion >= currentVersion) {
    return content
  }

  // To get an older version, we apply patches in reverse
  // This is a simplified approach - for production, you might want to
  // store full snapshots periodically

  // Actually, let's take a forward approach: start from version 1 (initial)
  // and apply patches forward

  // Get version 1 content by getting current and un-applying all patches
  for (let i = versions.length - 1; i > 0; i--) {
    const version = versions[i]
    if (version.patch && Array.isArray(version.patch)) {
      // Create reverse patch
      const reversePatch = createReversePatch(version.patch as import("rfc6902").Operation[])
      applyPatch(content, reversePatch)
    }
  }

  // Now content is at version 1
  // Apply patches forward up to target version
  for (let i = 1; i < targetVersion && i < versions.length; i++) {
    const version = versions[i]
    if (version.patch && Array.isArray(version.patch)) {
      applyPatch(content, version.patch as import("rfc6902").Operation[])
    }
  }

  return content
}

/**
 * Get version history for a project
 */
export async function getVersionHistory(projectId: string) {
  const versions = await db
    .select()
    .from(soaVersions)
    .where(eq(soaVersions.projectId, projectId))
    .orderBy(asc(soaVersions.versionNumber))

  return versions.map((v) => ({
    version: v.versionNumber,
    changeType: v.changeType,
    changeSummary: v.changeSummary,
    createdBy: v.createdBy,
    createdAt: v.createdAt,
    patchSize: Array.isArray(v.patch) ? v.patch.length : 0,
  }))
}

/**
 * Compare two versions and return the diff
 */
export async function compareVersions(
  projectId: string,
  fromVersion: number,
  toVersion: number
) {
  const fromContent = await getContentAtVersion(projectId, fromVersion)
  const toContent = await getContentAtVersion(projectId, toVersion)

  const patch = createPatch(fromContent, toContent)

  return {
    fromVersion,
    toVersion,
    patch,
    changes: patch.length,
  }
}

/**
 * Rollback to a specific version
 */
export async function rollbackToVersion(
  projectId: string,
  targetVersion: number,
  userId: string
): Promise<number> {
  // Get content at target version
  const targetContent = await getContentAtVersion(projectId, targetVersion)

  // Update current sections with target content
  for (const section of targetContent) {
    await db
      .update(soaSections)
      .set({
        title: section.title,
        content: section.content,
        sources: section.sources,
        status: section.status as "pending" | "generated" | "reviewed" | "approved",
        updatedAt: new Date(),
      })
      .where(eq(soaSections.sectionId, section.sectionId))
  }

  // Create a new version for the rollback
  const newVersion = await createVersion(
    projectId,
    userId,
    "edit",
    `Rollback to version ${targetVersion}`
  )

  return newVersion
}

// Helper to create a reverse patch (simplified - only handles common operations)
function createReversePatch(
  patch: import("rfc6902").Operation[]
): import("rfc6902").Operation[] {
  return patch
    .map((op): import("rfc6902").Operation | null => {
      switch (op.op) {
        case "add":
          return { op: "remove", path: op.path }
        case "remove":
          return { op: "add", path: op.path, value: undefined }
        case "replace":
          return { op: "replace", path: op.path, value: undefined }
        default:
          return null
      }
    })
    .filter((op): op is import("rfc6902").Operation => op !== null)
    .reverse()
}
