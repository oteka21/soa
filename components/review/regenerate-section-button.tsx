"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
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

interface RegenerateSectionButtonProps {
  sectionId: string
  projectId: string
  onRegenerated: () => Promise<void>
}

export function RegenerateSectionButton({
  sectionId,
  projectId,
  onRegenerated,
}: RegenerateSectionButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setIsOpen(false)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/sections/${sectionId}/regenerate`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to regenerate section")
      }

      toast.success("Section regenerated successfully")
      await onRegenerated()
    } catch (error) {
      console.error("Failed to regenerate section:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to regenerate section"
      )
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isRegenerating}
          className="h-8 w-8 p-0"
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate Section</AlertDialogTitle>
          <AlertDialogDescription>
            This will regenerate section {sectionId} using the LLM. Any manual
            edits you've made will be overwritten. Are you sure you want to
            continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRegenerate}>
            Regenerate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
