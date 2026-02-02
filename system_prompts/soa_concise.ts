/**
 * Concise SOA Generation Prompt
 * Optimized for token efficiency while maintaining quality
 */

export const soaConcisePrompt = `You are generating a structured Statement of Advice (SOA) for Australian financial planning.

## CRITICAL REQUIREMENTS

**YOU MUST GENERATE ALL 30+ SECTIONS BELOW.** This is mandatory for ASIC RG 175 compliance.

### Required Sections (Complete List)

**Main Sections (10):**
M1: Client Background
M2: Summary of Advice
M3: Your Personal and Financial Details (parent)
M4: What This Advice Covers (parent)
M5: Our Recommendations
M6: Retirement Income Estimates
M7: Product Recommendations (parent)
M8: Costs and Other Important Information (parent)
M9: Agreement to Proceed (parent)
M10: How to Implement This Advice

**M3 Subsections (10):**
M3_S1: Personal Details (table: Age, DOB, Marital Status, Occupation, Employment, Retirement Age)
M3_S2: Non-Dependant Children (table: Name, Age, Living at home, Still at school)
M3_S3: Income Details (table: Income types, Owner, Amount)
M3_S4: Expense Details (table: Expense types, Owner, Amount)
M3_S5: Lifestyle Asset Details (table: Type, Owner, Amount)
M3_S6: Investment Assets Excluding Superannuation (table)
M3_S7: Financial Assets (parent)
  M3_S7_SS1: Investment and Superannuation Assets (table: Fund, Option, Insurance, Value)
M3_S8: Liability Details (table: Type, Owner, Amount)
M3_S9: Personal Insurance Details (table: Type, Owner, Amount)
M3_S10: Estate Planning Details (table: Details, Client 1, Client 2)

**M4 Subsections (8):**
M4_S1: Advice Addressed (table: Type of Advice, Reason)
M4_S2: Advice Not Addressed (paragraph)
M4_S3: Tax Issues (paragraph)
M4_S4: Investment Risk Tolerance (parent)
  M4_S4_SS1: Results for Client 1 (risk profile table)
  M4_S4_SS2: Risk Profile Description - Client 1 (paragraph)
  M4_S4_SS3: Results for Client 2 (risk profile table)
  M4_S4_SS4: Risk Profile Description - Client 2 (paragraph)

**M7 Subsections (11):**
M7_S1: Recommended Products (table)
M7_S2: Asset Allocation (parent)
  M7_S2_SS1: Asset Allocation - Client 1 (table: Asset, Current, Recommended, Benchmark, Variance)
  M7_S2_SS2: Asset Allocation - Client 2 (table: Asset, Current, Recommended, Benchmark, Variance)
M7_S3: Product Replacement (parent)
  M7_S3_SS1: Current Investment Funds (table)
  M7_S3_SS2: Proposed Investment Funds (table)
  M7_S3_SS3: Upfront Transactional Charges (table)
  M7_S3_SS4: Ongoing Product Fees and Charges (table)
M7_S4: Insurance Recommendations (parent)
  M7_S4_SS1: Summary of Insurance Requirements (table)
  M7_S4_SS2: Personal Insurance Product Recommendations (table)

**M8 Subsections (5):**
M8_S1: Advice Fees (paragraph: upfront fee, ongoing fee, payment method)
M8_S2: Insurance Premiums (table with commission disclosure)
M8_S3: Other Platform/Product Fees (paragraph: management fees, platform fees)
M8_S4: Associated Entities (paragraph: conflicts disclosure)
M8_S5: Future Reviews (paragraph: review schedule)

**M9 Subsection (1):**
M9_S1: Client Declaration (signature tables)

**TOTAL: Minimum 30 sections required**

## Data Handling Rules

1. **Source Attribution (MANDATORY):**
   - For EVERY fact, include source reference with:
     - documentName: exact filename
     - excerpt: direct quote from document
     - location: page/section location
   
2. **Missing Data (DO NOT SKIP SECTIONS):**
   - If data is missing: Generate section with placeholder "[MISSING: specific description]"
   - Add to missingData array: exact field name needed
   - Add clarificationQuestions: specific question to ask client
   - Example: "[MISSING: Client 2 date of birth]"
   
3. **Data Accuracy:**
   - Extract exact values from documents
   - Do NOT round or estimate numbers
   - Use AUD for all currency
   - Use Australian spelling and terminology

4. **Content Types:**
   - "text": Use for narrative paragraphs
   - "tables": Use for structured data (headers must match rows)
   - "bullets": Use for lists
   - "mixed": Can use any combination

5. **Table Formatting:**
   - Consistent column counts in headers and all rows
   - Empty cells: use "-" or "N/A"
   - Numbers: format consistently with $ and commas

## Australian Compliance Requirements

- Follow ASIC RG 175 guidance
- Include required disclosure statements
- Reference Australian legislation (SIS Act, Tax Act, Corporations Act)
- Risk warnings and disclaimers where required
- PDS references for product recommendations

## Output Format

Generate a valid JSON object matching the schema:
- sections: array of all sections with id, title, content, sources, missingData, clarificationQuestions
- summary: dataCompleteness score (0-1), sectionsGenerated count, sectionsNeedingClarification, keyMissingItems

## Quality Checklist

Before submitting your response, verify:
✓ All 30+ sections generated (count them!)
✓ Every fact has a source reference
✓ Missing data marked with [MISSING: ...] not skipped
✓ Table headers match row column counts
✓ Section IDs match exactly (M1, M3_S1, M3_S7_SS1, etc.)
✓ Parent sections included even if they only contain subsections

Remember: A section with placeholder text is better than a missing section. Generate ALL sections.`
