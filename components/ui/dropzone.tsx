"use client"

import * as React from "react"
import {
  useDropzone,
  type DropzoneOptions,
  type FileRejection,
} from "react-dropzone"
import { cva, type VariantProps } from "class-variance-authority"
import { Upload, X, File, Image, FileText, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const dropzoneVariants = cva(
  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50 hover:bg-muted",
        active: "border-primary bg-primary/10",
        accept: "border-green-500 bg-green-500/10",
        reject: "border-destructive bg-destructive/10",
        disabled: "cursor-not-allowed opacity-50",
      },
      size: {
        default: "min-h-[200px] p-6",
        sm: "min-h-[120px] p-4",
        lg: "min-h-[300px] p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// File type with preview
export interface FileWithPreview extends File {
  preview?: string
  id: string
}

// Upload state for each file
export interface FileUploadState {
  file: FileWithPreview
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export interface DropzoneProps
  extends Omit<DropzoneOptions, "onDrop" | "onDropAccepted" | "onDropRejected">,
    VariantProps<typeof dropzoneVariants> {
  className?: string
  children?: React.ReactNode
  // Custom content when empty
  emptyContent?: React.ReactNode
  // Called with accepted files
  onFilesAccepted?: (files: FileWithPreview[]) => void
  // Called with rejected files
  onFilesRejected?: (rejections: FileRejection[]) => void
  // Show file list below dropzone
  showFileList?: boolean
  // File list with upload states (controlled)
  files?: FileUploadState[]
  // Remove file callback
  onRemoveFile?: (fileId: string) => void
  // Show preview for images
  showPreview?: boolean
  // React Hook Form compatible props
  value?: FileWithPreview[]
  onChange?: (files: FileWithPreview[]) => void
  onBlur?: () => void
  name?: string
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) {
    return <Image className="size-4" />
  }
  if (
    file.type === "application/pdf" ||
    file.type.startsWith("text/") ||
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx")
  ) {
    return <FileText className="size-4" />
  }
  return <File className="size-4" />
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  (
    {
      className,
      variant,
      size,
      children,
      emptyContent,
      onFilesAccepted,
      onFilesRejected,
      showFileList = true,
      files,
      onRemoveFile,
      showPreview = true,
      disabled,
      accept,
      maxSize,
      maxFiles,
      multiple = true,
      // RHF props
      value,
      onChange,
      onBlur,
      name,
      ...dropzoneOptions
    },
    ref
  ) => {
    const [internalFiles, setInternalFiles] = React.useState<FileUploadState[]>(
      []
    )
    const [rejectedFiles, setRejectedFiles] = React.useState<FileRejection[]>(
      []
    )

    // RHF mode: convert value to FileUploadState format
    const rhfFiles = React.useMemo(() => {
      if (!value) return null
      return value.map((file) => ({
        file,
        progress: 100,
        status: "success" as const,
      }))
    }, [value])

    const displayFiles = files ?? rhfFiles ?? internalFiles
    const isRHFMode = onChange !== undefined

    const onDrop = React.useCallback(
      (acceptedFiles: File[], rejections: FileRejection[]) => {
        const filesWithPreview: FileWithPreview[] = acceptedFiles.map(
          (file) => {
            const fileWithPreview = file as FileWithPreview
            fileWithPreview.id = generateId()
            if (showPreview && file.type.startsWith("image/")) {
              fileWithPreview.preview = URL.createObjectURL(file)
            }
            return fileWithPreview
          }
        )

        if (isRHFMode) {
          // React Hook Form mode - call onChange with new file array
          const existingFiles = value ?? []
          onChange?.([...existingFiles, ...filesWithPreview])
        } else if (onFilesAccepted) {
          onFilesAccepted(filesWithPreview)
        } else {
          // Internal state management
          const newFileStates: FileUploadState[] = filesWithPreview.map(
            (file) => ({
              file,
              progress: 0,
              status: "pending" as const,
            })
          )
          setInternalFiles((prev) => [...prev, ...newFileStates])
        }

        if (rejections.length > 0) {
          setRejectedFiles(rejections)
          onFilesRejected?.(rejections)
        } else {
          setRejectedFiles([])
        }
      },
      [isRHFMode, value, onChange, onFilesAccepted, onFilesRejected, showPreview]
    )

    const handleRemoveFile = React.useCallback(
      (fileId: string) => {
        if (isRHFMode) {
          // React Hook Form mode
          const fileToRemove = value?.find((f) => f.id === fileId)
          if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview)
          }
          onChange?.(value?.filter((f) => f.id !== fileId) ?? [])
        } else if (onRemoveFile) {
          onRemoveFile(fileId)
        } else {
          setInternalFiles((prev) => {
            const file = prev.find((f) => f.file.id === fileId)
            if (file?.file.preview) {
              URL.revokeObjectURL(file.file.preview)
            }
            return prev.filter((f) => f.file.id !== fileId)
          })
        }
      },
      [isRHFMode, value, onChange, onRemoveFile]
    )

    // Cleanup previews on unmount
    React.useEffect(() => {
      return () => {
        displayFiles.forEach((f) => {
          if (f.file.preview) {
            URL.revokeObjectURL(f.file.preview)
          }
        })
      }
    }, []) // Only run on unmount

    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragAccept,
      isDragReject,
      open,
    } = useDropzone({
      onDrop,
      disabled,
      accept,
      maxSize,
      maxFiles,
      multiple,
      noClick: false,
      noKeyboard: false,
      ...dropzoneOptions,
    })

    // Handle blur for RHF
    const inputProps = getInputProps()
    const mergedInputProps = {
      ...inputProps,
      name,
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        inputProps.onBlur?.(e)
        onBlur?.()
      },
    }

    const currentVariant = disabled
      ? "disabled"
      : isDragReject
        ? "reject"
        : isDragAccept
          ? "accept"
          : isDragActive
            ? "active"
            : variant

    const defaultEmptyContent = (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-full bg-muted p-3">
          <Upload className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragActive
              ? isDragReject
                ? "Some files will be rejected"
                : "Drop files here"
              : "Drag & drop files here"}
          </p>
          <p className="text-xs text-muted-foreground">
            or click to browse
            {maxSize && ` (max ${formatFileSize(maxSize)})`}
            {maxFiles && ` • Up to ${maxFiles} files`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={(e) => {
            e.stopPropagation()
            open()
          }}
          disabled={disabled}
        >
          Select Files
        </Button>
      </div>
    )

    return (
      <div className="space-y-4">
        <div
          ref={ref}
          {...getRootProps({
            className: cn(
              dropzoneVariants({ variant: currentVariant, size }),
              className
            ),
          })}
        >
          <input {...mergedInputProps} />
          {children ?? emptyContent ?? defaultEmptyContent}
        </div>

        {/* Rejected files warning */}
        {rejectedFiles.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="size-4" />
              {rejectedFiles.length} file(s) rejected
            </div>
            <ul className="mt-2 space-y-1 text-xs text-destructive">
              {rejectedFiles.map(({ file, errors }) => (
                <li key={file.name}>
                  <span className="font-medium">{file.name}</span>:{" "}
                  {errors.map((e) => e.message).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* File list */}
        {showFileList && displayFiles.length > 0 && (
          <div className="space-y-2">
            {displayFiles.map(({ file, progress, status, error }) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                {/* Preview or icon */}
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {showPreview && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="size-full object-cover"
                      onLoad={() => {
                        // Preview URL is revoked on unmount or removal
                      }}
                    />
                  ) : (
                    getFileIcon(file)
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                    {status === "error" && error && (
                      <span className="ml-2 text-destructive">{error}</span>
                    )}
                    {status === "success" && (
                      <span className="ml-2 text-green-600">Uploaded</span>
                    )}
                  </p>
                  {/* Progress bar */}
                  {status === "uploading" && (
                    <Progress value={progress} className="mt-1.5 h-1" />
                  )}
                </div>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  onClick={() => handleRemoveFile(file.id)}
                >
                  <X className="size-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
Dropzone.displayName = "Dropzone"

// Hook for external control
function useDropzoneState(initialFiles: FileUploadState[] = []) {
  const [files, setFiles] = React.useState<FileUploadState[]>(initialFiles)

  const addFiles = React.useCallback((newFiles: FileWithPreview[]) => {
    const newStates: FileUploadState[] = newFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }))
    setFiles((prev) => [...prev, ...newStates])
  }, [])

  const removeFile = React.useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.file.id === fileId)
      if (file?.file.preview) {
        URL.revokeObjectURL(file.file.preview)
      }
      return prev.filter((f) => f.file.id !== fileId)
    })
  }, [])

  const updateFileProgress = React.useCallback(
    (fileId: string, progress: number) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.id === fileId
            ? { ...f, progress, status: "uploading" as const }
            : f
        )
      )
    },
    []
  )

  const setFileStatus = React.useCallback(
    (
      fileId: string,
      status: FileUploadState["status"],
      error?: string
    ) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.id === fileId
            ? { ...f, status, error, progress: status === "success" ? 100 : f.progress }
            : f
        )
      )
    },
    []
  )

  const clearFiles = React.useCallback(() => {
    files.forEach((f) => {
      if (f.file.preview) {
        URL.revokeObjectURL(f.file.preview)
      }
    })
    setFiles([])
  }, [files])

  const pendingFiles = React.useMemo(
    () => files.filter((f) => f.status === "pending"),
    [files]
  )

  const uploadingFiles = React.useMemo(
    () => files.filter((f) => f.status === "uploading"),
    [files]
  )

  const completedFiles = React.useMemo(
    () => files.filter((f) => f.status === "success"),
    [files]
  )

  const failedFiles = React.useMemo(
    () => files.filter((f) => f.status === "error"),
    [files]
  )

  return {
    files,
    setFiles,
    addFiles,
    removeFile,
    updateFileProgress,
    setFileStatus,
    clearFiles,
    pendingFiles,
    uploadingFiles,
    completedFiles,
    failedFiles,
  }
}

export { Dropzone, dropzoneVariants, useDropzoneState }
