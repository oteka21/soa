import { start } from "workflow/api";
import { buildSoa } from "@/app/workflows/soa";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
//  const { email } = await request.json();
 // Executes asynchronously and doesn't block your app
 await start(buildSoa, []);
 return NextResponse.json({
  message: "User signup workflow started",
 });
}