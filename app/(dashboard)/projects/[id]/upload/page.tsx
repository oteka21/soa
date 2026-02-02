"use client"

import { useForm, Controller } from "react-hook-form"
import { useState, use } from "react"
import { useRouter } from "next/navigation"

import { Dropzone, type FileWithPreview } from "@/components/ui/dropzone"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useUploadThing } from "@/lib/uploadthing"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

interface FormData {
  files: FileWithPreview[]
}

export default function ProjectUploadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<
    { url: string; name: string }[]
  >([])

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { files: [] },
  })

  const files = watch("files")

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: async (res) => {
      const documents = res.map((r) => ({ url: r.ufsUrl, name: r.name }))
      setUploadedFiles(documents)
      setUploadProgress(100)

      // Save documents to the project
      try {
        const response = await fetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents }),
        })

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          const message =
            (errBody as { error?: string }).error ?? "Failed to save documents"
          throw new Error(message)
        }

        toast.success("Documents uploaded successfully")
        reset({ files: [] })
        
        // Navigate to project page
        router.push(`/projects/${projectId}`)
        router.refresh()
      } catch (error) {
        console.error("Save documents error:", error)
        toast.error(
          error instanceof Error ? error.message : "Failed to save documents"
        )
      }

      setIsProcessing(false)
    },
    onUploadError: (error) => {
      console.error("Upload error:", error)
      setIsProcessing(false)
      toast.error(`Upload failed: ${error.message}`)
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress)
    },
  })

  const onSubmit = async (data: FormData) => {
    if (data.files.length === 0) return

    setIsProcessing(true)
    setUploadProgress(0)
    setUploadedFiles([])

    await startUpload(data.files)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
          <p className="text-muted-foreground">
            Upload client documents to start generating the SOA
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Documents</CardTitle>
          <CardDescription>
            Upload fact finds, existing statements, and other relevant documents.
            Supported formats: PDF, Word (.doc, .docx), and text files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Controller
              name="files"
              control={control}
              rules={{
                validate: (value) =>
                  value.length > 0 || "Please select at least one file",
              }}
              render={({ field }) => (
                <div className="space-y-2">
                  <Dropzone
                    {...field}
                    accept={{
                      "application/pdf": [".pdf"],
                      "application/msword": [".doc"],
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        [".docx"],
                      "text/plain": [".txt"],
                    }}
                    maxSize={16 * 1024 * 1024}
                    maxFiles={10}
                    disabled={isUploading || isProcessing}
                  />
                  {errors.files && (
                    <p className="text-sm text-destructive">
                      {errors.files.message}
                    </p>
                  )}
                </div>
              )}
            />

            {(isUploading || isProcessing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
                <h4 className="mb-2 font-medium text-green-800 dark:text-green-200">
                  Successfully uploaded {uploadedFiles.length} file(s)
                </h4>
                <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                  {uploadedFiles.map((file) => (
                    <li key={file.url}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href={`/projects/${projectId}`}>Skip for now</Link>
              </Button>
              <Button
                type="submit"
                disabled={files.length === 0 || isUploading || isProcessing}
              >
                {isUploading || isProcessing ? (
                  "Uploading..."
                ) : (
                  <>
                    Upload & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
