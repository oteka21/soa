import { start } from "workflow/api";
import { buildSoa, type DocumentInput } from "@/app/workflows/soa";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { documents } = await request.json() as { documents: DocumentInput[] };

  if (!documents || documents.length === 0) {
    return NextResponse.json(
      { error: "No documents provided" },
      { status: 400 }
    );
  }

  // Executes asynchronously and doesn't block your app
  const run = await start(buildSoa, [documents]);

  return NextResponse.json({
    message: "SOA workflow started",
    workflowId: run.runId,
    documentsCount: documents.length,
  });
}