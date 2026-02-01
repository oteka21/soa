import { step1, step2, step3, step4, step5 } from "@/app/steps/soa"
import { sleep } from 'workflow';

export interface DocumentInput {
  url: string
  name: string
}

export async function buildSoa(documents: DocumentInput[]) {
  'use workflow'

  console.log("Starting SOA workflow with documents:", documents)

  await step1()
  await sleep('10s')
  
  await step2()
  await sleep('10s')
  
  await step3()
  await sleep('10s')
  
  await step4()
  await sleep('10s')
  
  const finalresult = await step5()
  
  console.log("Workflow is complete!")
  return { finalresult, documentsProcessed: documents.length }
}