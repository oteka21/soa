import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects } from "@/db/schema"
import { requireSession } from "@/lib/get-session"
import { eq, and } from "drizzle-orm"
import {
  getVersionHistory,
  getContentAtVersion,
  compareVersions,
  rollbackToVersion,
} from "@/lib/version-control"
import { z } from "zod"

// GET /api/projects/[id]/versions - Get version history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const version = searchParams.get("version")
    const compare = searchParams.get("compare")

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

    // If version is specified, get content at that version
    if (version) {
      const content = await getContentAtVersion(projectId, parseInt(version))
      return NextResponse.json({ version: parseInt(version), content })
    }

    // If compare is specified (format: "1,2"), compare two versions
    if (compare) {
      const [fromVersion, toVersion] = compare.split(",").map(Number)
      if (isNaN(fromVersion) || isNaN(toVersion)) {
        return NextResponse.json(
          { error: "Invalid version numbers" },
          { status: 400 }
        )
      }
      const diff = await compareVersions(projectId, fromVersion, toVersion)
      return NextResponse.json(diff)
    }

    // Default: return version history
    const history = await getVersionHistory(projectId)
    return NextResponse.json(history)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch versions:", error)
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    )
  }
}

const rollbackSchema = z.object({
  targetVersion: z.number().min(1),
})

// POST /api/projects/[id]/versions - Rollback to a version
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
    const { targetVersion } = rollbackSchema.parse(body)

    const newVersion = await rollbackToVersion(
      projectId,
      targetVersion,
      session.user.id
    )

    return NextResponse.json({
      message: `Rolled back to version ${targetVersion}`,
      newVersion,
    })
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
    console.error("Failed to rollback:", error)
    return NextResponse.json({ error: "Failed to rollback" }, { status: 500 })
  }
}
