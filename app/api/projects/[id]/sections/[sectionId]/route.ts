import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, soaSections } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and, inArray } from "drizzle-orm"
import { createVersion } from "@/lib/version-control"
import { getChildSectionIds } from "@/lib/soa-renderer"

// DELETE /api/projects/[id]/sections/[sectionId] - Delete a section
export async function DELETE(
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

    // Get all sections to find children
    const allSections = await db
      .select()
      .from(soaSections)
      .where(eq(soaSections.projectId, projectId))

    // Find the section to delete
    const sectionToDelete = allSections.find((s) => s.sectionId === sectionId)
    if (!sectionToDelete) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    // Get all child section IDs recursively
    const childIds = getChildSectionIds(sectionId, allSections)
    const allIdsToDelete = [
      sectionToDelete.id,
      ...childIds
        .map((childSectionId) => {
          const child = allSections.find((s) => s.sectionId === childSectionId)
          return child?.id
        })
        .filter(Boolean) as string[],
    ]

    // Delete section and all children
    await db.delete(soaSections).where(inArray(soaSections.id, allIdsToDelete))

    // Create version record
    await createVersion(
      projectId,
      session.user.id,
      "edit",
      `Deleted section: ${sectionId}${childIds.length > 0 ? ` (and ${childIds.length} child section(s))` : ""}`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to delete section:", error)
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    )
  }
}
