"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

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

interface DocumentToolbarProps {
  documentTitle?: string
  sections?: Section[]
}

export function DocumentToolbar({ documentTitle = "Statement_of_Advice", sections = [] }: DocumentToolbarProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    if (!sections || sections.length === 0) {
      toast.error("No sections available to export")
      return
    }

    setIsExporting(true)
    
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
      pdf.setTextColor(17, 24, 39) // #111827
      pdf.text("Statement of Advice", marginLeft, y)
      y += 12

      // Date
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(107, 114, 128) // #6b7280
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, y)
      y += 15

      // Deduplicate sections by sectionId (keep the first one)
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
          // Match M number
          const mainMatch = id.match(/^M(\d+)/)
          if (mainMatch) parts.push(parseInt(mainMatch[1]))
          // Match S number
          const subMatch = id.match(/_S(\d+)/)
          if (subMatch) parts.push(parseInt(subMatch[1]))
          // Match SS number
          const subSubMatch = id.match(/_SS(\d+)/)
          if (subSubMatch) parts.push(parseInt(subSubMatch[1]))
          return parts
        }
        
        const aParts = getParts(a.sectionId)
        const bParts = getParts(b.sectionId)
        
        // Compare part by part
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = aParts[i] ?? 0
          const bVal = bParts[i] ?? 0
          if (aVal !== bVal) return aVal - bVal
        }
        // Shorter IDs come first (M3 before M3_S1)
        return aParts.length - bParts.length
      })

      // Helper to determine section level
      const getSectionLevel = (sectionId: string): number => {
        if (sectionId.includes("_SS")) return 2  // Sub-subsection
        if (sectionId.includes("_S")) return 1   // Subsection
        return 0  // Main section
      }

      // Render ALL sections
      for (const section of sortedSections) {
        const level = getSectionLevel(section.sectionId)
        const indent = level * 8  // 0, 8, or 16mm indent
        const fontSize = level === 0 ? 14 : level === 1 ? 11 : 10
        const effectiveWidth = contentWidth - indent
        
        checkNewPage(20)
        
        // Section header
        pdf.setTextColor(17, 24, 39)
        addWrappedText(section.title, marginLeft + indent, fontSize, effectiveWidth, true)
        y += 3

        // Draw underline for main sections only
        if (level === 0) {
          pdf.setDrawColor(229, 231, 235)
          pdf.line(marginLeft, y, pageWidth - marginRight, y)
          y += 5
        } else {
          y += 2
        }

        // Section content
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
            
            // Table headers
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

            // Table rows
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
      const filename = `${documentTitle.replace(/\s+/g, "_")}_${date}.pdf`
      pdf.save(filename)
      
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF export error:", error)
      toast.error("Failed to export PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mb-4 print:hidden">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportPDF}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isExporting ? "Exporting..." : "Download PDF"}
      </Button>
    </div>
  )
}
