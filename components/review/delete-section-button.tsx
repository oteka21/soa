"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
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

interface DeleteSectionButtonProps {
  sectionId: string
  projectId: string
  hasChildren: boolean
  onDeleted: () => Promise<void>
}

export function DeleteSectionButton({
  sectionId,
  projectId,
  hasChildren,
  onDeleted,
}: DeleteSectionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    setIsOpen(false)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/sections/${sectionId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete section")
      }

      toast.success("Section deleted successfully")
      await onDeleted()
    } catch (error) {
      console.error("Failed to delete section:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to delete section"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Section</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren ? (
              <>
                This section has subsections. Deleting it will also delete all
                of its subsections. This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete section {sectionId}? This action
                cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
