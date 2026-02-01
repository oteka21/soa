import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

// Fake auth function - replace with your actual auth
const auth = (req: Request) => ({ id: "user_123" })

export const ourFileRouter = {
  // Document uploader for processing
  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 10,
    },
    text: { maxFileSize: "4MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const user = auth(req)
      if (!user) throw new UploadThingError("Unauthorized")
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId)
      console.log("file url", file.ufsUrl)
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  // Generic image uploader
  // imageUploader: f({
  //   image: { maxFileSize: "4MB", maxFileCount: 4 },
  // })
  //   .middleware(async ({ req }) => {
  //     const user = auth(req)
  //     if (!user) throw new UploadThingError("Unauthorized")
  //     return { userId: user.id }
  //   })
  //   .onUploadComplete(async ({ metadata, file }) => {
  //     console.log("Upload complete for userId:", metadata.userId)
  //     return { uploadedBy: metadata.userId, url: file.ufsUrl }
  //   }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
