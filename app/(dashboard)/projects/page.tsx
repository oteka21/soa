"use client"

import { useEffect, useState } from "react"
import { ProjectList } from "@/components/projects/project-list"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { Header } from "@/components/dashboard/header"

interface Project {
  id: string
  name: string
  description?: string | null
  status: "draft" | "in_progress" | "review" | "completed"
  createdAt: string
  updatedAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

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

  // Transform and filter projects
  const filteredProjects = projects
    .map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))
    .filter((project) => {
      const matchesSearch =
        search === "" ||
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.description?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter
      return matchesSearch && matchesStatus
    })

  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto bg-muted/10 p-4 lg:p-6">
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your Statement of Advice projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProjectList projects={filteredProjects} isLoading={isLoading} />
        </div>
      </main>
    </>
  )
}
