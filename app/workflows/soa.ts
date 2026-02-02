import { step1 } from "@/app/steps/soa"
// import { step2, step3, step4, step5 } from "@/app/steps/soa"
// import { sleep } from 'workflow';

export interface DocumentInput {
  url: string
  name: string
  content?: string
}

export interface DocumentWithContent extends DocumentInput {
  content: string
}

export async function buildSoa(documents: DocumentWithContent[]) {
  'use workflow'

  console.log("Starting SOA workflow with documents:", documents)

  const step1Result = await step1(documents)
  // await sleep('10s')
  // await step2()
  // await sleep('10s')
  // await step3()
  // await sleep('10s')
  // await step4()
  // await sleep('10s')
  // const finalresult = await step5()

  console.log("Workflow is complete!")
  return { llmResponse: step1Result.llmResponse, documentsProcessed: documents.length }
}