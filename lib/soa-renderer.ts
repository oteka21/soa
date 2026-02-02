/**
 * Utilities for rendering SOA sections in document format
 */

import { soaSectionTemplates } from "./soa-schema"

/**
 * Sort sections by their hierarchical order
 */
export function sortSectionsByOrder(sections: Array<{ sectionId: string }>) {
  return [...sections].sort((a, b) => {
    // Extract main section number (M1, M2, etc.)
    const aMain = a.sectionId.match(/^M(\d+)/)?.[1]
    const bMain = b.sectionId.match(/^M(\d+)/)?.[1]

    if (aMain && bMain) {
      const aNum = parseInt(aMain)
      const bNum = parseInt(bMain)
      if (aNum !== bNum) return aNum - bNum
    }

    // Extract subsection number (M3_S1, M3_S2, etc.)
    const aSub = a.sectionId.match(/_S(\d+)/)?.[1]
    const bSub = b.sectionId.match(/_S(\d+)/)?.[1]

    if (aSub && bSub) {
      const aSubNum = parseInt(aSub)
      const bSubNum = parseInt(bSub)
      if (aSubNum !== bSubNum) return aSubNum - bSubNum
    }

    // Extract sub-subsection number (M3_S7_SS1, etc.)
    const aSubSub = a.sectionId.match(/_SS(\d+)/)?.[1]
    const bSubSub = b.sectionId.match(/_SS(\d+)/)?.[1]

    if (aSubSub && bSubSub) {
      const aSubSubNum = parseInt(aSubSub)
      const bSubSubNum = parseInt(bSubSub)
      if (aSubSubNum !== bSubSubNum) return aSubSubNum - bSubSubNum
    }

    // Fallback to string comparison
    return a.sectionId.localeCompare(b.sectionId)
  })
}

/**
 * Get section template by ID
 */
export function getSectionTemplate(sectionId: string) {
  return soaSectionTemplates.find((t) => t.id === sectionId)
}

/**
 * Get all available section templates that can be added
 */
export function getAvailableTemplates(
  existingSectionIds: string[]
): Array<{ id: string; title: string; parentId: string | null }> {
  return soaSectionTemplates
    .filter((template) => !existingSectionIds.includes(template.id))
    .map((template) => ({
      id: template.id,
      title: template.title,
      parentId: template.parentId,
    }))
}

/**
 * Check if a section has children
 */
export function hasChildren(
  sectionId: string,
  allSections: Array<{ parentSectionId: string | null }>
): boolean {
  return allSections.some((s) => s.parentSectionId === sectionId)
}

/**
 * Get all child section IDs recursively
 */
export function getChildSectionIds(
  sectionId: string,
  allSections: Array<{ sectionId: string; parentSectionId: string | null }>
): string[] {
  const directChildren = allSections
    .filter((s) => s.parentSectionId === sectionId)
    .map((s) => s.sectionId)

  const allChildren = [...directChildren]
  for (const childId of directChildren) {
    allChildren.push(...getChildSectionIds(childId, allSections))
  }

  return allChildren
}
