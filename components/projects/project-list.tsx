"use client"

import { ProjectCard } from "./project-card"
import { Skeleton } from "@/components/ui/skeleton"

interface Project {
  id: string
  name: string
  description?: string | null
  status: "draft" | "in_progress" | "review" | "completed"
  createdAt: Date
  updatedAt: Date
}

interface ProjectListProps {
  projects: Project[]
  isLoading?: boolean
}

export function ProjectList({ projects, isLoading }: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-lg font-semibold">No projects yet</h3>
        <p className="text-sm text-muted-foreground">
          Get started by creating your first project
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  )
}
