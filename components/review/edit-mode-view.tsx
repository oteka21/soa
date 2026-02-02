"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InlineEditor } from "@/components/review/inline-editor"
import { RegenerateSectionButton } from "@/components/review/regenerate-section-button"
import { DeleteSectionButton } from "@/components/review/delete-section-button"
import { AddSectionDialog } from "@/components/review/add-section-dialog"
import { Plus } from "lucide-react"

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

interface EditModeViewProps {
  sections: Section[]
  projectId: string
  onSave: (sectionId: string, content: SectionContent) => Promise<void>
  onRefresh: () => Promise<void>
}

export function EditModeView({
  sections,
  projectId,
  onSave,
  onRefresh,
}: EditModeViewProps) {
  const [activeTab, setActiveTab] = useState("all")

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({mainSections.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending (
              {
                mainSections.filter(
                  (s) => s.status === "pending" || s.status === "generated"
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({mainSections.filter((s) => s.status === "reviewed").length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({mainSections.filter((s) => s.status === "approved").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <AddSectionDialog
          projectId={projectId}
          existingSectionIds={sections.map((s) => s.sectionId)}
          onAdded={onRefresh}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-4 pr-4">
          {filteredSections.map((section) => (
            <div key={section.id} className="relative">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <InlineEditor section={section} onSave={onSave} />
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <RegenerateSectionButton
                    sectionId={section.sectionId}
                    projectId={projectId}
                    onRegenerated={onRefresh}
                  />
                  <DeleteSectionButton
                    sectionId={section.sectionId}
                    projectId={projectId}
                    hasChildren={getSubsections(section.sectionId).length > 0}
                    onDeleted={onRefresh}
                  />
                </div>
              </div>
              {/* Subsections */}
              {getSubsections(section.sectionId).length > 0 && (
                <div className="ml-4 mt-2 space-y-2 border-l-2 pl-4">
                  {getSubsections(section.sectionId).map((sub) => (
                    <div key={sub.id} className="relative">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <InlineEditor section={sub} onSave={onSave} />
                        </div>
                        <div className="flex flex-col gap-2 pt-4">
                          <RegenerateSectionButton
                            sectionId={sub.sectionId}
                            projectId={projectId}
                            onRegenerated={onRefresh}
                          />
                          <DeleteSectionButton
                            sectionId={sub.sectionId}
                            projectId={projectId}
                            hasChildren={false}
                            onDeleted={onRefresh}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filteredSections.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">
                  No sections in this category
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
