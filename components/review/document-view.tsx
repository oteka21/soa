"use client"

import { FileText, AlertCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

interface DocumentViewProps {
  sections: Section[]
}

export function DocumentView({ sections }: DocumentViewProps) {
  // Deduplicate sections by sectionId (keep the first one, which should be most recent)
  const deduplicatedSections = sections.reduce((acc, section) => {
    if (!acc.some(s => s.sectionId === section.sectionId)) {
      acc.push(section)
    }
    return acc
  }, [] as Section[])

  // Sort ALL sections by sectionId for proper document order
  // This handles M1, M2, M3_S1, M3_S2... M5, M6... properly
  const sortedSections = [...deduplicatedSections].sort((a, b) => {
    // Extract parts: M3_S1_SS2 -> [3, 1, 2]
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

  // Helper to determine section level from sectionId
  const getSectionLevel = (sectionId: string): number => {
    if (sectionId.includes("_SS")) return 2  // Sub-subsection
    if (sectionId.includes("_S")) return 1   // Subsection
    return 0  // Main section
  }


  const renderSectionContent = (section: Section) => {
    const { content } = section

    return (
      <div className="space-y-4">
        {/* Text content */}
        {content.text && (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{content.text}</p>
          </div>
        )}

        {/* Bullet points */}
        {content.bullets && content.bullets.length > 0 && (
          <ul className="ml-6 list-disc space-y-2">
            {content.bullets.map((bullet, i) => (
              <li key={i} className="leading-relaxed">
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {/* Tables */}
        {content.tables && content.tables.length > 0 && (
          <div className="space-y-4">
            {content.tables.map((table, i) => (
              <div key={i} className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      {table.headers.map((header, j) => (
                        <th
                          key={j}
                          className="border border-border px-4 py-3 text-left font-semibold"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, j) => (
                      <tr
                        key={j}
                        className={j % 2 === 0 ? "bg-background" : "bg-muted/30"}
                      >
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className="border border-border px-4 py-2"
                          >
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
        {!content.text &&
          (!content.bullets || content.bullets.length === 0) &&
          (!content.tables || content.tables.length === 0) && (
            <p className="text-sm italic text-muted-foreground">
              [No content generated yet]
            </p>
          )}
      </div>
    )
  }

  // Render a single section with appropriate styling based on level
  const renderSection = (section: Section) => {
    const level = getSectionLevel(section.sectionId)
    const hasMissingData = section.requiredFields && section.requiredFields.length > 0

    // Determine header level and styling
    const headerClass =
      level === 0
        ? "text-2xl font-bold mt-8 mb-4 pb-2 border-b print:break-after-avoid print:page-break-after-avoid"
        : level === 1
          ? "text-xl font-semibold mt-6 mb-3 print:break-after-avoid"
          : "text-lg font-medium mt-4 mb-2"

    const indentClass = level === 1 ? "ml-4" : level === 2 ? "ml-8" : ""
    
    return (
      <div key={section.id} className={indentClass}>
        {/* Section Header */}
        <div className="flex items-start gap-4 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <h2 className={headerClass}>
              {section.title}
            </h2>
            {hasMissingData && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Missing data: {(section.requiredFields as string[]).join(", ")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Section Content */}
        <div className="mb-6">{renderSectionContent(section)}</div>

        {/* Sources */}
        {section.sources && section.sources.length > 0 && (
          <div className="mb-6 border-t pt-4">
            <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <FileText className="h-3 w-3" />
              Sources
            </h4>
            <div className="space-y-2">
              {section.sources.map((source, i) => (
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
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div 
          className="max-w-4xl mx-auto px-8 py-6 print:max-w-full print:px-4"
          data-pdf-content="true"
        >
          {sortedSections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No sections available</p>
            </div>
          ) : (
            <div className="space-y-2 print:space-y-2">
              {sortedSections.map((section) => renderSection(section))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
