"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getAvailableTemplates } from "@/lib/soa-renderer"

interface AddSectionDialogProps {
  projectId: string
  existingSectionIds: string[]
  onAdded: () => Promise<void>
}

export function AddSectionDialog({
  projectId,
  existingSectionIds,
  onAdded,
}: AddSectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [generateContent, setGenerateContent] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const availableTemplates = getAvailableTemplates(existingSectionIds)

  const handleAdd = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a section template")
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: selectedTemplateId,
          generateContent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add section")
      }

      toast.success("Section added successfully")
      setIsOpen(false)
      setSelectedTemplateId("")
      await onAdded()
    } catch (error) {
      console.error("Failed to add section:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to add section"
      )
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>
            Select a section template to add to the SOA document.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Section Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a section template" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available templates
                  </SelectItem>
                ) : (
                  availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.id}: {template.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="generate"
              checked={generateContent}
              onCheckedChange={(checked) =>
                setGenerateContent(checked === true)
              }
            />
            <Label
              htmlFor="generate"
              className="text-sm font-normal cursor-pointer"
            >
              Generate content using LLM (leave unchecked to create empty section)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedTemplateId || isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Section"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
