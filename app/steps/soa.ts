import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { main } from "@/system_prompts/main"
import { soaTemplate } from "@/system_prompts/soa_template"

export interface DocumentWithContent {
  url: string
  name: string
  content: string
}

const systemPrompt = `${main}\n\n${soaTemplate}`

function buildUserMessage(documents: DocumentWithContent[]): string {
  const parts = [
    "Use the attached client documents and the SOA template (in the system prompt) to produce draft advice content. Do not fabricate section content; ask clarifying questions for missing data.",
    "",
    "--- Client documents ---",
  ]
  for (const doc of documents) {
    parts.push("")
    parts.push(`Document: ${doc.name}`)
    parts.push(doc.content)
  }
  return parts.join("\n")
}

export async function step1(documents: DocumentWithContent[]) {
  "use step"

  const openai = createOpenAI({
    baseURL: "https://ai-gateway.vercel.sh/v1",
    apiKey: process.env.AI_GATEWAY_API_KEY,
  })

  const { text } = await generateText({
    model: openai("openai/gpt-4o"),
    system: systemPrompt,
    prompt: buildUserMessage(documents),
  })

  return { llmResponse: text }
}

export async function step2() {
  "use step"
  return "Step 2 complete"
}

export async function step3() {
  "use step"
  return "Step 3 complete"
}

export async function step4() {
  "use step"
  return "Step 4 complete"
}

export async function step5() {
  "use step"
  return "Step 5 complete"
}
