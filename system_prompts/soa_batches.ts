/**
 * SOA Batch Generation Prompts
 * 
 * Split the 30+ section generation into 5 smaller batches to avoid AI Gateway timeouts.
 * Each batch generates 7-11 sections and completes within 1-2 minutes.
 */

export interface BatchConfig {
  id: string
  name: string
  prompt: string
  sectionIds: string[]
}

/**
 * Batch 1: Main Sections (10 sections)
 * M1 through M10 - High-level overview and summary sections
 */
export const batch1Prompt = `You are generating BATCH 1 of 5 for a Statement of Advice (SOA).

## BATCH 1: Main Sections (10 sections)

Generate these main sections:
- M1: Client Background
- M2: Summary of Advice
- M3: Your Personal and Financial Details (parent section only - subsections come in Batch 2)
- M4: What This Advice Covers (parent section only - subsections come in Batch 3)
- M5: Our Recommendations
- M6: Retirement Income Estimates
- M7: Product Recommendations (parent section only - subsections come in Batch 4)
- M8: Costs and Other Important Information (parent section only - subsections come in Batch 5)
- M9: Agreement to Proceed (parent section only - subsections come in Batch 5)
- M10: How to Implement This Advice

**Parent sections (M3, M4, M7, M8, M9):** Generate brief introductory text explaining what will be covered in their subsections.

## Data Handling Rules

1. **Source Attribution (MANDATORY):**
   - For EVERY fact, include source reference with documentName, excerpt, and location

2. **Missing Data:**
   - If data is missing: Generate section with placeholder "[MISSING: specific description]"
   - Add to missingData array and clarificationQuestions array

3. **Content Types:**
   - "text": Use for narrative paragraphs
   - "tables": Use for structured data
   - "bullets": Use for lists

## Output Format

Generate a valid JSON object with:
- sections: array of 10 sections with id, title, content, sources, missingData, clarificationQuestions
- summary: dataCompleteness score (0-1), sectionsGenerated count (should be 10)

Remember: This is BATCH 1 of 5. Only generate the 10 main sections listed above.`

/**
 * Batch 2: M3 Subsections (10 sections)
 * Personal and financial details tables
 */
export const batch2Prompt = `You are generating BATCH 2 of 5 for a Statement of Advice (SOA).

## BATCH 2: M3 Subsections (10 sections)

Generate these M3 subsections for "Your Personal and Financial Details":

- M3_S1: Personal Details (table: Age, DOB, Marital Status, Occupation, Employment, Retirement Age)
- M3_S2: Non-Dependant Children (table: Name, Age, Living at home, Still at school)
- M3_S3: Income Details (table: Income types, Owner, Amount)
- M3_S4: Expense Details (table: Expense types, Owner, Amount)
- M3_S5: Lifestyle Asset Details (table: Type, Owner, Amount)
- M3_S6: Investment Assets Excluding Superannuation (table)
- M3_S7: Financial Assets (parent)
- M3_S7_SS1: Investment and Superannuation Assets (table: Fund, Option, Insurance, Value)
- M3_S8: Liability Details (table: Type, Owner, Amount)
- M3_S9: Personal Insurance Details (table: Type, Owner, Amount)
- M3_S10: Estate Planning Details (table: Details, Client 1, Client 2)

**Focus on tables:** Most of these sections contain tables. Ensure:
- Consistent column counts in headers and rows
- Empty cells use "-" or "N/A"
- Numbers formatted with $ and commas

## Data Handling Rules

1. **Source Attribution (MANDATORY):**
   - For EVERY data point in tables, include source reference

2. **Missing Data:**
   - If entire table is missing: Generate table structure with "[MISSING]" in cells
   - Add specific clarification questions for each missing field

3. **Table Formatting:**
   - headers: Array of column names
   - rows: Array of arrays (each row must have same length as headers)

## Output Format

Generate a valid JSON object with:
- sections: array of 10 sections with id, title, content (mostly tables), sources, missingData, clarificationQuestions
- summary: dataCompleteness score (0-1), sectionsGenerated count (should be 10)

Remember: This is BATCH 2 of 5. Only generate the M3 subsections listed above.`

/**
 * Batch 3: M4 Subsections (8 sections)
 * Advice scope and risk tolerance
 */
export const batch3Prompt = `You are generating BATCH 3 of 5 for a Statement of Advice (SOA).

## BATCH 3: M4 Subsections (8 sections)

Generate these M4 subsections for "What This Advice Covers":

- M4_S1: Advice Addressed (table: Type of Advice, Reason)
- M4_S2: Advice Not Addressed (paragraph)
- M4_S3: Tax Issues (paragraph)
- M4_S4: Investment Risk Tolerance (parent)
- M4_S4_SS1: Results for Client 1 (risk profile table)
- M4_S4_SS2: Risk Profile Description - Client 1 (paragraph)
- M4_S4_SS3: Results for Client 2 (risk profile table)
- M4_S4_SS4: Risk Profile Description - Client 2 (paragraph)

**Risk profile sections:** Extract risk questionnaire results and risk tolerance classifications from documents.

## Data Handling Rules

1. **Source Attribution (MANDATORY):**
   - For risk scores and classifications, cite the risk profile document

2. **Missing Data:**
   - If risk profile missing for Client 2: Still generate structure with "[MISSING]"
   - Add clarification questions for missing risk data

3. **Content Types:**
   - M4_S1: Table format
   - M4_S2, M4_S3: Paragraph format
   - M4_S4_SS1, M4_S4_SS3: Table format
   - M4_S4_SS2, M4_S4_SS4: Paragraph format

## Output Format

Generate a valid JSON object with:
- sections: array of 8 sections with id, title, content (mixed tables and text), sources, missingData, clarificationQuestions
- summary: dataCompleteness score (0-1), sectionsGenerated count (should be 8)

Remember: This is BATCH 3 of 5. Only generate the M4 subsections listed above.`

/**
 * Batch 4: M7 Subsections (11 sections)
 * Product recommendations and asset allocation
 */
export const batch4Prompt = `You are generating BATCH 4 of 5 for a Statement of Advice (SOA).

## BATCH 4: M7 Subsections (11 sections)

Generate these M7 subsections for "Product Recommendations":

- M7_S1: Recommended Products (table)
- M7_S2: Asset Allocation (parent)
- M7_S2_SS1: Asset Allocation - Client 1 (table: Asset, Current, Recommended, Benchmark, Variance)
- M7_S2_SS2: Asset Allocation - Client 2 (table: Asset, Current, Recommended, Benchmark, Variance)
- M7_S3: Product Replacement (parent)
- M7_S3_SS1: Current Investment Funds (table)
- M7_S3_SS2: Proposed Investment Funds (table)
- M7_S3_SS3: Upfront Transactional Charges (table)
- M7_S3_SS4: Ongoing Product Fees and Charges (table)
- M7_S4: Insurance Recommendations (parent)
- M7_S4_SS1: Summary of Insurance Requirements (table)
- M7_S4_SS2: Personal Insurance Product Recommendations (table)

**Product details:** Extract specific product names, APLs, fees, and insurance coverage from documents.

## Data Handling Rules

1. **Source Attribution (MANDATORY):**
   - Cite product names, fund names, and fee amounts to specific documents

2. **Missing Data:**
   - If product recommendations not finalized: Generate tables with "[PENDING: Product selection]"
   - If asset allocation not specified: Use "[MISSING: Asset allocation strategy]"

3. **Table Formatting:**
   - Asset allocation tables must include percentages
   - Fee tables must show dollar amounts
   - Product tables must include provider names

## Output Format

Generate a valid JSON object with:
- sections: array of 11 sections with id, title, content (mostly tables), sources, missingData, clarificationQuestions
- summary: dataCompleteness score (0-1), sectionsGenerated count (should be 11)

Remember: This is BATCH 4 of 5. Only generate the M7 subsections listed above.`

/**
 * Batch 5: M8 & M9 Subsections (7 sections)
 * Costs, fees, and agreement
 */
export const batch5Prompt = `You are generating BATCH 5 of 5 for a Statement of Advice (SOA).

## BATCH 5: M8 & M9 Subsections (7 sections)

Generate these final subsections:

**M8 Subsections (6 sections):**
- M8_S1: Advice Fees (paragraph: upfront fee, ongoing fee, payment method)
- M8_S2: Insurance Premiums (table with commission disclosure)
- M8_S3: Other Platform/Product Fees (paragraph: management fees, platform fees)
- M8_S4: Associated Entities (paragraph: conflicts disclosure)
- M8_S5: Future Reviews (paragraph: review schedule)
- M8_S6: Disclaimers and Important Information (paragraph)

**M9 Subsection (1 section):**
- M9_S1: Client Declaration (signature tables)

**Fee disclosure:** Extract all fee amounts, commission percentages, and payment terms.

## Data Handling Rules

1. **Source Attribution (MANDATORY):**
   - Cite fee amounts and commission disclosures to working papers

2. **Missing Data:**
   - If fees not finalized: Use "[PENDING: Fee agreement]"
   - If commission rates unknown: Use "[MISSING: Commission percentage]"

3. **Compliance:**
   - M8_S4 (Associated Entities): Must include conflicts of interest disclosure
   - M8_S6 (Disclaimers): Must include required regulatory disclaimers

## Output Format

Generate a valid JSON object with:
- sections: array of 7 sections with id, title, content (mixed text and tables), sources, missingData, clarificationQuestions
- summary: dataCompleteness score (0-1), sectionsGenerated count (should be 7)

Remember: This is BATCH 5 of 5. This completes the SOA generation.`

/**
 * Batch configurations for iteration
 */
export const batches: BatchConfig[] = [
  {
    id: 'batch1',
    name: 'Main Sections',
    prompt: batch1Prompt,
    sectionIds: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'],
  },
  {
    id: 'batch2',
    name: 'M3 Subsections (Personal & Financial Details)',
    prompt: batch2Prompt,
    sectionIds: ['M3_S1', 'M3_S2', 'M3_S3', 'M3_S4', 'M3_S5', 'M3_S6', 'M3_S7', 'M3_S7_SS1', 'M3_S8', 'M3_S9', 'M3_S10'],
  },
  {
    id: 'batch3',
    name: 'M4 Subsections (Advice Scope & Risk)',
    prompt: batch3Prompt,
    sectionIds: ['M4_S1', 'M4_S2', 'M4_S3', 'M4_S4', 'M4_S4_SS1', 'M4_S4_SS2', 'M4_S4_SS3', 'M4_S4_SS4'],
  },
  {
    id: 'batch4',
    name: 'M7 Subsections (Product Recommendations)',
    prompt: batch4Prompt,
    sectionIds: ['M7_S1', 'M7_S2', 'M7_S2_SS1', 'M7_S2_SS2', 'M7_S3', 'M7_S3_SS1', 'M7_S3_SS2', 'M7_S3_SS3', 'M7_S3_SS4', 'M7_S4', 'M7_S4_SS1', 'M7_S4_SS2'],
  },
  {
    id: 'batch5',
    name: 'M8 & M9 Subsections (Costs & Agreement)',
    prompt: batch5Prompt,
    sectionIds: ['M8_S1', 'M8_S2', 'M8_S3', 'M8_S4', 'M8_S5', 'M8_S6', 'M9_S1'],
  },
]
