"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Menu,
  Plus,
  FileText,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { useEffect, useState } from "react"

interface SidebarProps {
  className?: string
}

interface Project {
  id: string
  name: string
  status: string
}

function SidebarContent() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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
      }
    }
    fetchProjects()
    
    // Refresh projects every 10 seconds to catch new projects
    const interval = setInterval(fetchProjects, 10000)
    return () => clearInterval(interval)
  }, [])

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FileText className="h-6 w-6" />
          <span>SOA Platform</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {/* Dashboard Link */}
          <Button
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            className={cn("w-full justify-start", pathname === "/dashboard" && "bg-muted")}
            asChild
          >
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>

          {/* Collapsible Projects Section */}
          <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={pathname.startsWith("/projects") ? "secondary" : "ghost"}
                className={cn("w-full justify-start", pathname.startsWith("/projects") && "bg-muted")}
              >
                {isProjectsOpen ? (
                  <ChevronDown className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                <FolderOpen className="mr-2 h-4 w-4" />
                Projects
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {/* Search Field */}
              <div className="relative px-2 pb-2">
                <Search className="absolute left-4 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>

              {/* Project List */}
              <div className="space-y-1 pl-6">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const isActive = pathname === `/projects/${project.id}` || pathname.startsWith(`/projects/${project.id}/`)
                    return (
                      <Button
                        key={project.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-xs h-8",
                          isActive && "bg-muted"
                        )}
                        asChild
                      >
                        <Link href={`/projects/${project.id}`}>
                          <FileText className="mr-2 h-3 w-3" />
                          <span className="truncate">{project.name}</span>
                        </Link>
                      </Button>
                    )
                  })
                ) : (
                  <p className="px-2 py-2 text-xs text-muted-foreground">
                    {searchQuery ? "No projects found" : "No projects yet"}
                  </p>
                )}
              </div>

              {/* View All Projects Link */}
              <Button
                variant="ghost"
                className="w-full justify-start text-xs h-8 pl-6"
                asChild
              >
                <Link href="/projects">
                  <FolderOpen className="mr-2 h-3 w-3" />
                  View All Projects
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* New Project Button */}
        <div className="mt-6">
          <CreateProjectDialog
            trigger={
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            }
          />
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden w-64 flex-shrink-0 border-r bg-background lg:block",
        className
      )}
    >
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}
