import { step1, step2, step3, step4, step5 } from "@/app/steps/soa"
import { sleep } from 'workflow';
export async function buildSoa () {
  'use workflow'

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
  return { finalresult }
}