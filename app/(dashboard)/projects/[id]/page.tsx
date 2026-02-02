"use client"

import { useEffect, useState, useRef, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  WorkflowStepper,
  type StepStatus,
} from "@/components/workflow/workflow-stepper"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  ArrowLeft,
  Upload,
  Play,
  FileText,
  Trash2,
  Loader2,
  XCircle,
  Edit,
  Download,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DocumentView } from "@/components/review/document-view"
import { EditModeView } from "@/components/review/edit-mode-view"

interface Document {
  id: string
  name: string
  url: string
  fileType: string
  uploadedAt: string
  parsedContent?: string | null
}

interface WorkflowState {
  id: string
  currentStep: number
  stepStatuses: Record<string, StepStatus>
  workflowRunId?: string | null
}

interface SectionContent {
  text?: string
  tables?: Array<{ headers: string[]; rows: string[][] }>
  bullets?: string[]
}

interface SoaSection {
  id: string
  sectionId: string
  parentSectionId?: string | null
  title: string
  contentType: string
  content: SectionContent
  sources: Array<{
    documentId: string
    documentName: string
    excerpt: string
    location?: string
  }>
  status: "pending" | "generated" | "reviewed" | "approved"
}

interface Project {
  id: string
  name: string
  description?: string | null
  status: "draft" | "in_progress" | "review" | "completed"
  createdAt: string
  updatedAt: string
  documents: Document[]
  workflowState?: WorkflowState | null
  sections: SoaSection[]
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStartingWorkflow, setIsStartingWorkflow] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [viewingStep, setViewingStep] = useState<number>(1) // Track which step user is viewing
  const [viewMode, setViewMode] = useState<"document" | "edit">("document")
  const initialLoadDone = useRef(false)
  const previousStep2Status = useRef<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/projects")
            return
          }
          throw new Error("Failed to fetch project")
        }
        const data = await response.json()
        setProject(data)
        
        // Only set viewing step on first load
        if (!initialLoadDone.current) {
          initialLoadDone.current = true
          const currentStep = data.workflowState?.currentStep ?? 1
          setViewingStep(currentStep)
          previousStep2Status.current = data.workflowState?.stepStatuses?.step2 ?? null
          
          // Load view mode preference from localStorage
          const savedViewMode = localStorage.getItem(`soa-view-mode-${projectId}`)
          if (savedViewMode === "edit" || savedViewMode === "document") {
            setViewMode(savedViewMode)
          }
        }
      } catch (error) {
        console.error("Failed to fetch project:", error)
        toast.error("Failed to load project")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()

    // Poll for updates while workflow is in progress
    let pollCount = 0
    const maxPolls = 200 // Stop after 10 minutes (200 * 3 seconds)
    
    const pollInterval = setInterval(async () => {
      pollCount++
      
      // Stop polling after max attempts to prevent infinite loading
      if (pollCount > maxPolls) {
        console.warn("[polling] Stopped polling after max attempts - workflow may be stuck")
        clearInterval(pollInterval)
        return
      }
      
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data)
          
          const step2Status = data.workflowState?.stepStatuses?.step2
          
          // Show toast when step 2 transitions from in_progress to completed/failed
          if (
            previousStep2Status.current === "in_progress" &&
            (step2Status === "completed" || step2Status === "failed")
          ) {
            setViewingStep(2) // Update viewing step to match
            if (step2Status === "failed") {
              toast.error("SOA generation failed. Please check the error and try again.")
            } else {
              toast.success("SOA generation completed!")
            }
            clearInterval(pollInterval) // Stop polling when done
            return
          }
          
          previousStep2Status.current = step2Status ?? null
          
          // Stop polling if workflow is completed or failed
          if (step2Status === "completed" || step2Status === "failed") {
            // Force state update to ensure UI reflects completion
            setProject({ ...data })
            clearInterval(pollInterval)
            return
          }
          
          // If step2 has been in_progress for too long, warn user
          if (step2Status === "in_progress" && pollCount > 40) {
            // After 2 minutes, show a warning
            console.warn("[polling] Step 2 has been in_progress for a while - workflow may be stuck")
          }
        }
      } catch (error) {
        console.error("[polling] Error polling project status:", error)
        // Don't stop polling on network errors, but log them
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [projectId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete project")
      toast.success("Project deleted")
      router.push("/projects")
    } catch (error) {
      toast.error("Failed to delete project")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStartWorkflow = async () => {
    if (!project?.documents?.length) {
      toast.error("Please upload documents first")
      return
    }

    setIsStartingWorkflow(true)
    setViewingStep(2) // Switch to Generate step
    
    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to start workflow")
      toast.success("SOA generation started")
      // Refresh project data
      const updatedResponse = await fetch(`/api/projects/${projectId}`)
      if (updatedResponse.ok) {
        setProject(await updatedResponse.json())
      }
    } catch (error) {
      toast.error("Failed to start workflow")
    } finally {
      setIsStartingWorkflow(false)
    }
  }

  const refreshProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        setProject(await response.json())
      }
    } catch (error) {
      console.error("Failed to refresh project:", error)
    }
  }

  const handleSaveSection = async (sectionId: string, content: SectionContent) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, content }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast.success("Section saved")
      await refreshProject()
    } catch (error) {
      toast.error("Failed to save section")
      throw error
    }
  }

  const handleViewModeChange = (mode: "document" | "edit") => {
    setViewMode(mode)
    localStorage.setItem(`soa-view-mode-${projectId}`, mode)
  }

  const handleExportPDF = async () => {
    if (!project.sections || project.sections.length === 0) {
      toast.error("No sections available to export")
      return
    }

    setIsExportingPDF(true)
    
    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import("jspdf")

      toast.info("Generating PDF...", { duration: 3000 })

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = 210
      const pageHeight = 297
      const marginLeft = 15
      const marginRight = 15
      const marginTop = 20
      const marginBottom = 20
      const contentWidth = pageWidth - marginLeft - marginRight
      
      let y = marginTop

      // Helper to add new page if needed
      const checkNewPage = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - marginBottom) {
          pdf.addPage()
          y = marginTop
          return true
        }
        return false
      }

      // Helper to wrap text
      const addWrappedText = (text: string, x: number, fontSize: number, maxWidth: number, isBold = false) => {
        pdf.setFontSize(fontSize)
        pdf.setFont("helvetica", isBold ? "bold" : "normal")
        
        const lines = pdf.splitTextToSize(text, maxWidth)
        const lineHeight = fontSize * 0.4
        
        for (const line of lines) {
          checkNewPage(lineHeight)
          pdf.text(line, x, y)
          y += lineHeight
        }
        
        return lines.length * lineHeight
      }

      // Title
      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(17, 24, 39)
      pdf.text("Statement of Advice", marginLeft, y)
      y += 12

      // Date
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(107, 114, 128)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, y)
      y += 15

      // Deduplicate and sort sections
      const deduplicatedSections = project.sections.reduce((acc, section) => {
        if (!acc.some(s => s.sectionId === section.sectionId)) {
          acc.push(section)
        }
        return acc
      }, [] as SoaSection[])

      const sortedSections = [...deduplicatedSections].sort((a, b) => {
        const getParts = (id: string): number[] => {
          const parts: number[] = []
          const mainMatch = id.match(/^M(\d+)/)
          if (mainMatch) parts.push(parseInt(mainMatch[1]))
          const subMatch = id.match(/_S(\d+)/)
          if (subMatch) parts.push(parseInt(subMatch[1]))
          const subSubMatch = id.match(/_SS(\d+)/)
          if (subSubMatch) parts.push(parseInt(subSubMatch[1]))
          return parts
        }
        
        const aParts = getParts(a.sectionId)
        const bParts = getParts(b.sectionId)
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = aParts[i] ?? 0
          const bVal = bParts[i] ?? 0
          if (aVal !== bVal) return aVal - bVal
        }
        return aParts.length - bParts.length
      })

      const getSectionLevel = (sectionId: string): number => {
        if (sectionId.includes("_SS")) return 2
        if (sectionId.includes("_S")) return 1
        return 0
      }

      // Render ALL sections
      for (const section of sortedSections) {
        const level = getSectionLevel(section.sectionId)
        const indent = level * 8
        const fontSize = level === 0 ? 14 : level === 1 ? 11 : 10
        const effectiveWidth = contentWidth - indent
        
        checkNewPage(20)
        
        pdf.setTextColor(17, 24, 39)
        addWrappedText(section.title, marginLeft + indent, fontSize, effectiveWidth, true)
        y += 3

        if (level === 0) {
          pdf.setDrawColor(229, 231, 235)
          pdf.line(marginLeft, y, pageWidth - marginRight, y)
          y += 5
        } else {
          y += 2
        }

        pdf.setTextColor(31, 41, 55)
        
        if (section.content.text) {
          addWrappedText(section.content.text, marginLeft + indent, 10, effectiveWidth)
          y += 3
        }

        if (section.content.bullets && section.content.bullets.length > 0) {
          for (const bullet of section.content.bullets) {
            checkNewPage(5)
            addWrappedText(`• ${bullet}`, marginLeft + indent + 5, 10, effectiveWidth - 5)
          }
          y += 3
        }

        if (section.content.tables && section.content.tables.length > 0) {
          for (const table of section.content.tables) {
            checkNewPage(20)
            
            const tableWidth = effectiveWidth - 10
            const colWidth = tableWidth / Math.max(table.headers.length, 1)
            
            pdf.setFillColor(243, 244, 246)
            pdf.setTextColor(17, 24, 39)
            pdf.setFontSize(9)
            pdf.setFont("helvetica", "bold")
            
            const headerHeight = 8
            checkNewPage(headerHeight)
            pdf.rect(marginLeft + indent, y, tableWidth, headerHeight, "F")
            
            table.headers.forEach((header, i) => {
              pdf.text(header, marginLeft + indent + 2 + (i * colWidth), y + 5, { maxWidth: colWidth - 4 })
            })
            y += headerHeight

            pdf.setFont("helvetica", "normal")
            pdf.setTextColor(31, 41, 55)
            
            for (const row of table.rows) {
              const rowHeight = 7
              checkNewPage(rowHeight)
              
              pdf.setDrawColor(209, 213, 219)
              pdf.rect(marginLeft + indent, y, tableWidth, rowHeight)
              
              row.forEach((cell, i) => {
                pdf.text(String(cell), marginLeft + indent + 2 + (i * colWidth), y + 5, { maxWidth: colWidth - 4 })
              })
              y += rowHeight
            }
            y += 5
          }
        }

        y += level === 0 ? 8 : 5
      }

      // Save the PDF
      const date = new Date().toISOString().split("T")[0]
      const filename = `Statement_of_Advice_${date}.pdf`
      pdf.save(filename)
      
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF export error:", error)
      toast.error("Failed to export PDF. Please try again.")
    } finally {
      setIsExportingPDF(false)
    }
  }

  if (isLoading) {
    return <ProjectPageSkeleton />
  }

  if (!project) {
    return null
  }

  const workflowState = project.workflowState ?? {
    currentStep: 1,
    stepStatuses: {
      step1: "pending" as StepStatus,
      step2: "pending" as StepStatus,
      step3: "pending" as StepStatus,
      step4: "pending" as StepStatus,
      step5: "pending" as StepStatus,
      step6: "pending" as StepStatus,
    },
  }

  return (
    <>
      <Header
        customContent={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/projects")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{project.name}&quot;?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />
      <main className="flex-1 overflow-hidden bg-muted/10 p-4 lg:p-6">
        <div className="flex flex-col h-full space-y-6">
          {/* Workflow Stepper */}
          <div className="shrink-0">
            <WorkflowStepper
        currentStep={viewingStep}
        stepStatuses={workflowState.stepStatuses}
        onStepClick={(stepId) => {
          // Update viewing step and navigate to step-specific view
          setViewingStep(stepId)
          switch (stepId) {
            case 1:
              // Upload step → Go to upload page
              router.push(`/projects/${projectId}/upload`)
              break
            case 4:
            case 5:
              // Review steps → Go to review page
              router.push(`/projects/${projectId}/review`)
              break
            // Steps 2, 3, 6 stay on this page
          }
        }}
      />
          </div>

      {/* Main Content */}
      <Card className="flex flex-col min-h-0 flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>SOA Sections</CardTitle>
                <CardDescription>
                  Generated Statement of Advice content
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {project.sections?.length > 0 && (
                  <>
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 border rounded-md p-1">
                      <Button
                        variant={viewMode === "document" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleViewModeChange("document")}
                        className="h-8"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Document
                      </Button>
                      <Button
                        variant={viewMode === "edit" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleViewModeChange("edit")}
                        className="h-8"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      className="h-8"
                    >
                      {isExportingPDF ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {isExportingPDF ? "Exporting..." : "Download PDF"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleStartWorkflow}
                      disabled={isStartingWorkflow || workflowState.stepStatuses.step2 === "in_progress"}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {isStartingWorkflow || workflowState.stepStatuses.step2 === "in_progress"
                        ? "Regenerating..."
                        : "Regenerate"}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col">
              {workflowState.stepStatuses.step2 === "in_progress" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="mb-4 h-12 w-12 text-primary animate-spin" />
                  <p className="text-lg font-medium">Generating SOA...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyzing documents and creating Statement of Advice sections
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    This may take a few minutes. The page will update automatically.
                  </p>
                  {project.sections?.length === 0 && (
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/projects/${projectId}/workflow/reset`, {
                            method: "POST",
                          })
                          if (response.ok) {
                            toast.success("Workflow reset. You can try generating again.")
                            // Refresh project data
                            const updatedResponse = await fetch(`/api/projects/${projectId}`)
                            if (updatedResponse.ok) {
                              setProject(await updatedResponse.json())
                            }
                          } else {
                            const error = await response.json()
                            toast.error(`Failed to reset: ${error.error || "Unknown error"}`)
                          }
                        } catch (error) {
                          console.error("Reset error:", error)
                          toast.error("Failed to reset workflow")
                        }
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reset if Stuck
                    </Button>
                  )}
                </div>
              ) : workflowState.stepStatuses.step2 === "failed" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <XCircle className="mb-4 h-12 w-12 text-destructive" />
                  <p className="text-lg font-medium text-destructive">Generation Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The SOA generation encountered an error. Please try again.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={handleStartWorkflow}
                    disabled={isStartingWorkflow}
                  >
                    {isStartingWorkflow ? "Starting..." : "Retry Generation"}
                  </Button>
                </div>
              ) : project.sections?.length ? (
                viewMode === "document" ? (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <DocumentView sections={project.sections} />
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <EditModeView
                      sections={project.sections}
                      projectId={projectId}
                      onSave={handleSaveSection}
                      onRefresh={refreshProject}
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No sections generated yet</p>
                  <p className="text-sm text-muted-foreground">
                    Upload documents and click Generate SOA to get started
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href={`/projects/${projectId}/upload`}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </main>
  </>
  )
}

function ProjectStatusBadge({
  status,
}: {
  status: "draft" | "in_progress" | "review" | "completed"
}) {
  const config = {
    draft: { label: "Draft", variant: "secondary" as const },
    in_progress: { label: "In Progress", variant: "default" as const },
    review: { label: "Review", variant: "outline" as const },
    completed: { label: "Completed", variant: "default" as const },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

function ProjectPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}
