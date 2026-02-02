/**
 * Utility functions for batch SOA section generation
 * 
 * This module provides utilities for generating SOA sections in batches
 * to handle large document sets and improve quality through focused generation.
 * 
 * Future enhancement: Implement batch generation when document sets exceed
 * token limits or when section-by-section generation is preferred.
 */

import { soaSectionTemplates } from "./soa-schema"

/**
 * Group sections into batches for generation
 * @param batchSize Maximum number of sections per batch
 * @returns Array of section ID arrays, each representing a batch
 */
export function groupSectionsIntoBatches(batchSize: number = 10): string[][] {
  const batches: string[][] = []
  const allSectionIds = soaSectionTemplates.map((t) => t.id)

  for (let i = 0; i < allSectionIds.length; i += batchSize) {
    batches.push(allSectionIds.slice(i, i + batchSize))
  }

  return batches
}

/**
 * Group sections by parent section for hierarchical generation
 * @returns Map of parent section IDs to their child sections
 */
export function groupSectionsByParent(): Map<string | null, string[]> {
  const groups = new Map<string | null, string[]>()

  for (const template of soaSectionTemplates) {
    const parentId = template.parentId
    if (!groups.has(parentId)) {
      groups.set(parentId, [])
    }
    groups.get(parentId)!.push(template.id)
  }

  return groups
}

/**
 * Get main sections (top-level sections without parents)
 */
export function getMainSections(): string[] {
  return soaSectionTemplates
    .filter((t) => t.parentId === null)
    .map((t) => t.id)
}

/**
 * Get child sections for a given parent
 */
export function getChildSections(parentId: string): string[] {
  return soaSectionTemplates
    .filter((t) => t.parentId === parentId)
    .map((t) => t.id)
}

/**
 * Estimate token count for a batch of sections
 * Rough estimate: ~100 tokens per section ID in prompt
 */
export function estimateBatchTokens(sectionIds: string[]): number {
  return sectionIds.length * 100
}
