"use client"

import { useEffect, useState } from "react"
import { ProjectList } from "@/components/projects/project-list"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { useSession } from "@/lib/auth-client"

interface Project {
  id: string
  name: string
  description?: string | null
  status: "draft" | "in_progress" | "review" | "completed"
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects")
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Transform dates from strings to Date objects
  const transformedProjects = projects.map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
            Here are your SOA projects.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={transformedProjects.length}
          description="All time"
        />
        <StatCard
          title="In Progress"
          value={transformedProjects.filter((p) => p.status === "in_progress").length}
          description="Currently active"
        />
        <StatCard
          title="In Review"
          value={transformedProjects.filter((p) => p.status === "review").length}
          description="Awaiting approval"
        />
        <StatCard
          title="Completed"
          value={transformedProjects.filter((p) => p.status === "completed").length}
          description="Finalized"
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Projects</h2>
        <ProjectList projects={transformedProjects} isLoading={isLoading} />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string
  value: number
  description: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
