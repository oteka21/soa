"use client"

import { useEffect, useState, use, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { InlineEditor } from "@/components/review/inline-editor"
import { CommentThread } from "@/components/review/comment-thread"
import { ReviewActions } from "@/components/review/review-actions"
import { DocumentView } from "@/components/review/document-view"
import { EditModeView } from "@/components/review/edit-mode-view"
import { toast } from "sonner"
import { ArrowLeft, History, MessageSquare, FileText, Edit } from "lucide-react"
import { Header } from "@/components/dashboard/header"

interface SectionContent {
  text?: string
  tables?: Array<{ headers: string[]; rows: string[][] }>
  bullets?: string[]
}

interface Section {
  id: string
  sectionId: string
  title: string
  parentSectionId: string | null
  contentType: string
  content: SectionContent
  sources: Array<{
    documentId: string
    documentName: string
    excerpt: string
    location?: string
  }>
  requiredFields: string[]
  status: string
}

interface Comment {
  id: string
  sectionId: string
  authorId: string
  authorName: string | null
  authorEmail: string | null
  content: string
  status: "open" | "resolved"
  createdAt: string
}

interface WorkflowState {
  currentStep: number
  stepStatuses: Record<string, string>
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const [sections, setSections] = useState<Section[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"document" | "edit">("document")

  const fetchData = useCallback(async () => {
    try {
      const [sectionsRes, commentsRes, workflowRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/sections`),
        fetch(`/api/projects/${projectId}/comments`),
        fetch(`/api/projects/${projectId}/workflow`),
      ])

      if (sectionsRes.ok) {
        setSections(await sectionsRes.json())
      }
      if (commentsRes.ok) {
        setComments(await commentsRes.json())
      }
      if (workflowRes.ok) {
        const data = await workflowRes.json()
        setWorkflowState(data.workflowState)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load review data")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
    // Load view mode preference from localStorage
    const savedViewMode = localStorage.getItem(`soa-view-mode-${projectId}`)
    if (savedViewMode === "edit" || savedViewMode === "document") {
      setViewMode(savedViewMode)
    }
  }, [fetchData, projectId])

  const handleViewModeChange = (mode: "document" | "edit") => {
    setViewMode(mode)
    localStorage.setItem(`soa-view-mode-${projectId}`, mode)
  }

  const handleSaveSection = async (
    sectionId: string,
    content: SectionContent
  ) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, content }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast.success("Section saved")
      await fetchData()
    } catch (error) {
      toast.error("Failed to save section")
      throw error
    }
  }

  const handleAddComment = async (sectionId: string, content: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, content }),
      })

      if (!response.ok) throw new Error("Failed to add comment")

      toast.success("Comment added")
      await fetchData()
    } catch (error) {
      toast.error("Failed to add comment")
      throw error
    }
  }

  const handleResolveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, status: "resolved" }),
      })

      if (!response.ok) throw new Error("Failed to resolve")

      toast.success("Comment resolved")
      await fetchData()
    } catch (error) {
      toast.error("Failed to resolve comment")
    }
  }

  const handleApprove = async () => {
    const step = workflowState?.currentStep ?? 4
    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, action: "approve" }),
      })

      if (!response.ok) throw new Error("Failed to approve")

      toast.success("Approved successfully")
      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to approve")
    }
  }

  const handleReject = async (rejectComments: string) => {
    const step = workflowState?.currentStep ?? 4
    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, action: "reject", comments: rejectComments }),
      })

      if (!response.ok) throw new Error("Failed to reject")

      toast.success("Changes requested")
      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to request changes")
    }
  }

  // Group sections by parent
  const mainSections = sections.filter((s) => !s.parentSectionId)
  const getSubsections = (parentId: string) =>
    sections.filter((s) => s.parentSectionId === parentId)

  const filteredSections =
    activeTab === "all"
      ? mainSections
      : mainSections.filter((s) => {
          if (activeTab === "pending")
            return s.status === "pending" || s.status === "generated"
          if (activeTab === "reviewed") return s.status === "reviewed"
          if (activeTab === "approved") return s.status === "approved"
          return true
        })

  const currentStep = workflowState?.currentStep ?? 4
  const isAwaitingApproval =
    workflowState?.stepStatuses?.[`step${currentStep}`] === "awaiting_approval"

  if (isLoading) {
    return <ReviewPageSkeleton />
  }

  return (
    <>
      <Header />
      <main className="flex-1 overflow-hidden bg-muted/10">
        <div className="flex h-full flex-col p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Review SOA</h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep}:{" "}
              {currentStep === 4 ? "Paraplanner Review" : "Financial Planner Review"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "document" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("document")}
              className="h-8"
            >
              <FileText className="mr-2 h-4 w-4" />
              Document View
            </Button>
            <Button
              variant={viewMode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("edit")}
              className="h-8"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Mode
            </Button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="mr-2 h-4 w-4" />
                Version History
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Version History</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Version history coming soon...
                </p>
              </div>
            </SheetContent>
          </Sheet>
          {isAwaitingApproval && (
            <ReviewActions
              step={currentStep as 4 | 5}
              stepName={
                currentStep === 4 ? "Paraplanner Review" : "FP Review"
              }
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "document" ? (
        <div className="flex-1 overflow-hidden pt-4 min-h-0">
          <DocumentView sections={sections} />
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-hidden pt-4 min-h-0">
          {/* Edit Mode View */}
          <div className="flex-1 overflow-hidden">
            <EditModeView
              sections={sections}
              projectId={projectId}
              onSave={handleSaveSection}
              onRefresh={fetchData}
            />
          </div>

          {/* Comments Panel */}
          <div className="w-80 shrink-0">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                  <Badge variant="secondary" className="ml-auto">
                    {comments.filter((c) => c.status === "open").length} open
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-340px)]">
                  {sections.length > 0 ? (
                    <div className="space-y-4">
                      {sections
                        .filter((s) =>
                          comments.some((c) => c.sectionId === s.id)
                        )
                        .map((section) => (
                          <CommentThread
                            key={section.id}
                            sectionId={section.id}
                            sectionTitle={`${section.sectionId}: ${section.title}`}
                            comments={comments.filter(
                              (c) => c.sectionId === section.id
                            )}
                            onAddComment={(content) =>
                              handleAddComment(section.id, content)
                            }
                            onResolveComment={handleResolveComment}
                          />
                        ))}
                      {comments.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No comments yet. Click the comment icon on a section to
                          add one.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No sections to comment on
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
        </div>
      </main>
    </>
  )
}

function ReviewPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96 w-80" />
      </div>
    </div>
  )
}
