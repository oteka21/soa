"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, ChevronRight } from "lucide-react"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string | null
    status: "draft" | "in_progress" | "review" | "completed"
    createdAt: Date
    updatedAt: Date
  }
}

const statusConfig = {
  draft: {
    label: "Draft",
    variant: "secondary" as const,
  },
  in_progress: {
    label: "In Progress",
    variant: "default" as const,
  },
  review: {
    label: "Review",
    variant: "outline" as const,
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
  },
}

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status]

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-medium">
              {project.name}
            </CardTitle>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardHeader>
        <CardContent>
          {project.description && (
            <CardDescription className="mb-3 line-clamp-2">
              {project.description}
            </CardDescription>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Updated {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
              </span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
