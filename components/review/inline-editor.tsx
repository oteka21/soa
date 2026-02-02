"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertCircle,
} from "lucide-react"

interface SectionContent {
  text?: string
  tables?: Array<{
    headers: string[]
    rows: string[][]
  }>
  bullets?: string[]
}

interface SourceReference {
  documentId: string
  documentName: string
  excerpt: string
  location?: string
}

interface Section {
  id: string
  sectionId: string
  title: string
  contentType: string
  content: SectionContent
  sources: SourceReference[]
  requiredFields: string[]
  status: string
}

interface InlineEditorProps {
  section: Section
  onSave: (sectionId: string, content: SectionContent) => Promise<void>
  isLoading?: boolean
}

export function InlineEditor({ section, onSave, isLoading }: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<SectionContent>(
    section.content
  )
  const [isOpen, setIsOpen] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditedContent(section.content)
  }, [section.content])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(section.sectionId, editedContent)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(section.content)
    setIsEditing(false)
  }

  const statusConfig = {
    pending: { label: "Pending", variant: "secondary" as const },
    generated: { label: "Generated", variant: "default" as const },
    reviewed: { label: "Reviewed", variant: "outline" as const },
    approved: { label: "Approved", variant: "default" as const },
  }

  const statusInfo = statusConfig[section.status as keyof typeof statusConfig] ?? {
    label: section.status,
    variant: "secondary" as const,
  }

  const hasMissingData = section.requiredFields && section.requiredFields.length > 0

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer p-4" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CardTitle className="text-base font-semibold">
                {section.title}
              </CardTitle>
              {hasMissingData && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Missing data: {(section.requiredFields as string[]).join(", ")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                  disabled={isLoading}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 p-4 pt-0">
            {/* Content Editor/Display */}
            {isEditing ? (
              <div className="space-y-4">
                {section.contentType === "paragraph" ||
                section.contentType === "mixed" ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Content
                    </label>
                    <Textarea
                      value={editedContent.text ?? ""}
                      onChange={(e) =>
                        setEditedContent({ ...editedContent, text: e.target.value })
                      }
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                ) : null}

                {section.contentType === "bullets" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Bullet Points (one per line)
                    </label>
                    <Textarea
                      value={(editedContent.bullets ?? []).join("\n")}
                      onChange={(e) =>
                        setEditedContent({
                          ...editedContent,
                          bullets: e.target.value.split("\n").filter(Boolean),
                        })
                      }
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-1 h-3 w-3" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Text content */}
                {section.content.text && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <pre className="whitespace-pre-wrap text-sm">
                      {section.content.text}
                    </pre>
                  </div>
                )}

                {/* Bullet points */}
                {section.content.bullets && section.content.bullets.length > 0 && (
                  <ul className="ml-4 list-disc space-y-1">
                    {section.content.bullets.map((bullet, i) => (
                      <li key={i} className="text-sm">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Tables */}
                {section.content.tables && section.content.tables.length > 0 && (
                  <div className="space-y-2">
                    {section.content.tables.map((table, i) => (
                      <div key={i} className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                          <thead>
                            <tr>
                              {table.headers.map((header, j) => (
                                <th
                                  key={j}
                                  className="bg-muted px-3 py-2 text-left font-medium"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {table.rows.map((row, j) => (
                              <tr key={j}>
                                {row.map((cell, k) => (
                                  <td key={k} className="px-3 py-2">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!section.content.text &&
                  (!section.content.bullets || section.content.bullets.length === 0) &&
                  (!section.content.tables || section.content.tables.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">
                      No content generated yet
                    </p>
                  )}
              </div>
            )}

            {/* Sources */}
            {section.sources && section.sources.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Sources
                </h4>
                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {(section.sources as SourceReference[]).map((source, i) => (
                      <div
                        key={i}
                        className="rounded-md bg-muted/30 p-2 text-xs"
                      >
                        <p className="font-medium">{source.documentName}</p>
                        <p className="text-muted-foreground line-clamp-2">
                          &ldquo;{source.excerpt}&rdquo;
                        </p>
                        {source.location && (
                          <p className="text-muted-foreground">
                            Location: {source.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
