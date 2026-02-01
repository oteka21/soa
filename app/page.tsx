"use client"

import { useForm, Controller } from "react-hook-form"
import { useState } from "react"

import { Dropzone, type FileWithPreview } from "@/components/ui/dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useUploadThing } from "@/lib/uploadthing"

interface FormData {
  files: FileWithPreview[]
}

export default function Home() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string }[]>([])
  const [workflowStatus, setWorkflowStatus] = useState<{
    started: boolean
    workflowId?: string
    error?: string
  } | null>(null)

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { files: [] },
  })

  const files = watch("files")

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: async (res) => {
      console.log("Upload complete:", res)
      const documents = res.map((r) => ({ url: r.ufsUrl, name: r.name }))
      setUploadedFiles(documents)
      setUploadProgress(100)

      // Trigger the workflow with uploaded document URLs
      try {
        const response = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents }),
        })

        if (!response.ok) {
          throw new Error("Failed to start workflow")
        }

        const data = await response.json()
        setWorkflowStatus({ started: true, workflowId: data.workflowId })
      } catch (error) {
        console.error("Workflow error:", error)
        setWorkflowStatus({ started: false, error: "Failed to start workflow" })
      }

      setIsProcessing(false)
      reset({ files: [] })
    },
    onUploadError: (error) => {
      console.error("Upload error:", error)
      setIsProcessing(false)
      alert(`Upload failed: ${error.message}`)
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
    setWorkflowStatus(null)

    await startUpload(data.files)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Statement Of Advice Generator</CardTitle>
          <CardDescription>
            Upload your documents (PDF, Word, or text files) to process them.
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
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
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
                    <li key={file.url}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        {file.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {workflowStatus?.started && (
              <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Workflow Started
                </h4>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Your documents are being processed.
                  {workflowStatus.workflowId && (
                    <span className="block mt-1 font-mono text-xs">
                      ID: {workflowStatus.workflowId}
                    </span>
                  )}
                </p>
              </div>
            )}

            {workflowStatus?.error && (
              <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/20">
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Workflow Error
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {workflowStatus.error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={files.length === 0 || isUploading || isProcessing}
            >
              {isUploading || isProcessing ? "Processing..." : "Process Documents"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
