import { start, getRun } from "workflow/api"
import { buildSoa, type DocumentInput, type DocumentWithContent } from "@/app/workflows/soa"
import { NextResponse } from "next/server"
import mammoth from "mammoth"

function isDocx(name: string): boolean {
  return name.toLowerCase().endsWith(".docx")
}

function isTxt(name: string): boolean {
  return name.toLowerCase().endsWith(".txt")
}

async function extractDocumentContent(
  url: string,
  name: string
): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${name}: ${res.status} ${res.statusText}`)
  }

  if (isDocx(name)) {
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await mammoth.extractRawText({ buffer })
    if (result.messages.length > 0) {
      console.log(`[docx parse] ${name} messages:`, result.messages)
    }
    return result.value
  }

  if (isTxt(name)) {
    return res.text()
  }

  throw new Error(
    `Unsupported file type for ${name}. Supported: .txt, .docx`
  )
}

export async function POST(request: Request) {
  const { documents } = (await request.json()) as {
    documents: DocumentInput[]
  }

  if (!documents || documents.length === 0) {
    return NextResponse.json(
      { error: "No documents provided" },
      { status: 400 }
    )
  }

  const documentsWithContent: DocumentWithContent[] = []
  const parsedLogs: {
    name: string
    contentLength: number
    preview: string
    content: string
  }[] = []
  const previewLen = 300

  for (const doc of documents) {
    try {
      const content = await extractDocumentContent(doc.url, doc.name)
      documentsWithContent.push({ ...doc, content })
      const preview =
        content.length <= previewLen
          ? content
          : content.slice(0, previewLen) + "..."
      parsedLogs.push({
        name: doc.name,
        contentLength: content.length,
        preview,
        content,
      })
      console.log(
        `[parsed input] ${doc.name} | length=${content.length} | preview:\n${preview}`
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: `Document extraction failed: ${message}` },
        { status: 400 }
      )
    }
  }

  const run = await start(buildSoa, [documentsWithContent])

  return NextResponse.json({
    message: "SOA workflow started",
    workflowId: run.runId,
    documentsCount: documentsWithContent.length,
    parsedDocuments: parsedLogs,
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const workflowId = searchParams.get("workflowId")

  if (!workflowId) {
    return NextResponse.json(
      { error: "Missing workflowId query parameter" },
      { status: 400 }
    )
  }

  try {
    const run = getRun<{ llmResponse: string; documentsProcessed: number }>(
      workflowId
    )
    const status = await run.status
    if (status === "completed") {
      const result = await run.returnValue
      return NextResponse.json({
        status: "completed",
        result,
      })
    }
    return NextResponse.json({
      status: status === "running" ? "running" : status,
    })
  } catch {
    return NextResponse.json(
      { error: "Run not found" },
      { status: 404 }
    )
  }
}
