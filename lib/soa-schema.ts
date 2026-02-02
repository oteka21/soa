/**
 * SOA (Statement of Advice) JSON Schema
 * This defines the structure for all SOA sections with source tracking
 */

// Content types for different section formats
export type SectionContentType = "paragraph" | "table" | "mixed" | "bullets"

// Table structure definition
export interface TableData {
  headers: string[]
  rows: string[][]
}

// Source reference - tracks where data came from in source documents
export interface SourceReference {
  documentId: string
  documentName: string
  excerpt: string // The relevant text from the source
  location?: string // Page number or section if available
  confidence?: number // 0-1 confidence score for AI-extracted data
}

// Content structure that can hold different types of content
export interface SectionContent {
  text?: string
  tables?: TableData[]
  bullets?: string[]
}

// Status for each section
export type SectionStatus = "pending" | "generated" | "reviewed" | "approved"

// Base section interface
export interface SOASection {
  id: string // e.g., "M1", "M3_S1", "M3_S7_SS1"
  title: string
  parentId: string | null
  contentType: SectionContentType
  content: SectionContent
  sources: SourceReference[]
  requiredFields: string[]
  status: SectionStatus
  generatedAt?: string
  reviewedAt?: string
  reviewedBy?: string
}

// Complete SOA document
export interface SOADocument {
  projectId: string
  version: number
  sections: SOASection[]
  createdAt: string
  updatedAt: string
}

/**
 * SOA Template Definition
 * Defines the structure and requirements for each section
 */
export interface SectionTemplate {
  id: string
  title: string
  parentId: string | null
  contentType: SectionContentType
  tableStructure?: {
    columns: number
    headers: string[]
    rowDescriptions?: string[]
  }
  requiredFields: string[]
  description: string
}

// All section templates
export const soaSectionTemplates: SectionTemplate[] = [
  // M1: Client Background
  {
    id: "M1",
    title: "Client Background",
    parentId: null,
    contentType: "mixed",
    tableStructure: {
      columns: 2,
      headers: ["Details", "Information"],
      rowDescriptions: ["Client 1 details", "Client 2 details", "Family structure"],
    },
    requiredFields: [
      "client1_full_name",
      "client1_dob",
      "client1_contact",
      "client1_employment",
      "client1_marital_status",
      "client2_full_name",
      "client2_dob",
      "client2_contact",
      "client2_employment",
      "client2_marital_status",
      "family_structure",
      "dependents",
      "reason_for_advice",
    ],
    description: "Overview of client personal details and reason for seeking advice",
  },

  // M2: Summary of Advice
  {
    id: "M2",
    title: "Summary of Advice",
    parentId: null,
    contentType: "bullets",
    requiredFields: ["recommendations_summary"],
    description: "High-level summary of all recommendations",
  },

  // M3: Personal and Financial Details (parent section)
  {
    id: "M3",
    title: "Your Personal and Financial Details",
    parentId: null,
    contentType: "paragraph",
    requiredFields: [],
    description: "Detailed personal and financial information",
  },

  // M3_S1: Personal Details
  {
    id: "M3_S1",
    title: "Personal Details",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Details", "Client 1", "Client 2"],
      rowDescriptions: ["Age", "Date of Birth", "Marital Status", "Occupation", "Employment Status", "Target Retirement Age"],
    },
    requiredFields: [
      "client1_age",
      "client1_dob",
      "client1_marital_status",
      "client1_occupation",
      "client1_employment_status",
      "client1_retirement_age",
      "client2_age",
      "client2_dob",
      "client2_marital_status",
      "client2_occupation",
      "client2_employment_status",
      "client2_retirement_age",
    ],
    description: "Personal details for both clients",
  },

  // M3_S2: Non-Dependant Children
  {
    id: "M3_S2",
    title: "Non-Dependant Children",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 4,
      headers: ["Name", "Age", "Living at home", "Still at school"],
    },
    requiredFields: ["children_details"],
    description: "Details of non-dependant children",
  },

  // M3_S3: Income Details
  {
    id: "M3_S3",
    title: "Income Details",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Income", "Owner", "Amount"],
      rowDescriptions: ["Gross Income", "Salary", "Bonus", "Investment Income", "Other Income", "TOTAL"],
    },
    requiredFields: ["client1_gross_income", "client2_gross_income", "total_income"],
    description: "Income breakdown for the household",
  },

  // M3_S4: Expense Details
  {
    id: "M3_S4",
    title: "Expense Details",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Expense", "Owner", "Amount"],
      rowDescriptions: ["Tax Payable", "Salary Sacrifice", "Living Expenses", "Home Loan Repayment", "Other Loan Repayments", "Discretionary Spending", "TOTAL"],
    },
    requiredFields: ["total_expenses", "living_expenses"],
    description: "Expense breakdown for the household",
  },

  // M3_S5: Lifestyle Asset Details
  {
    id: "M3_S5",
    title: "Lifestyle Asset Details",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Type", "Owner", "Amount"],
      rowDescriptions: ["Home (Owner Occupied)", "Home Contents", "Vehicle 1", "Vehicle 2", "Other Assets", "TOTAL"],
    },
    requiredFields: ["home_value", "total_lifestyle_assets"],
    description: "Non-investment assets owned by the clients",
  },

  // M3_S6: Investment Assets Excluding Superannuation
  {
    id: "M3_S6",
    title: "Investment Assets Excluding Superannuation",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Type", "Owner", "Amount"],
    },
    requiredFields: ["total_non_super_investments"],
    description: "Investment assets outside of superannuation",
  },

  // M3_S7: Financial Assets (parent)
  {
    id: "M3_S7",
    title: "Financial Assets",
    parentId: "M3",
    contentType: "paragraph",
    requiredFields: [],
    description: "Overview of financial assets",
  },

  // M3_S7_SS1: Investment and Superannuation Assets
  {
    id: "M3_S7_SS1",
    title: "Investment and Superannuation Assets",
    parentId: "M3_S7",
    contentType: "table",
    tableStructure: {
      columns: 4,
      headers: ["Fund Name", "Investment Option", "Insurance", "Market Value"],
    },
    requiredFields: ["client1_super_balance", "client2_super_balance", "total_super_balance"],
    description: "Superannuation fund details",
  },

  // M3_S8: Liability Details
  {
    id: "M3_S8",
    title: "Liability Details",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Type", "Owner", "Amount"],
      rowDescriptions: ["Mortgage", "Other Loans", "Credit Cards", "TOTAL"],
    },
    requiredFields: ["total_liabilities"],
    description: "All debts and liabilities",
  },

  // M3_S9: Personal Insurance Details
  {
    id: "M3_S9",
    title: "Personal Insurance Details",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Type", "Owner", "Amount"],
    },
    requiredFields: ["current_insurance_coverage"],
    description: "Existing personal insurance policies",
  },

  // M3_S10: Estate Planning Details
  {
    id: "M3_S10",
    title: "Estate Planning Details",
    parentId: "M3",
    contentType: "table",
    tableStructure: {
      columns: 3,
      headers: ["Details", "Client 1", "Client 2"],
      rowDescriptions: ["Will Status", "Testamentary Trust", "POA", "Enduring Guardian", "Beneficiary Details", "Executor Details"],
    },
    requiredFields: ["client1_will_status", "client2_will_status"],
    description: "Estate planning arrangements",
  },

  // M4: What This Advice Covers (parent)
  {
    id: "M4",
    title: "What This Advice Covers",
    parentId: null,
    contentType: "paragraph",
    requiredFields: [],
    description: "Scope of advice being provided",
  },

  // M4_S1: Advice Addressed
  {
    id: "M4_S1",
    title: "Advice Addressed",
    parentId: "M4",
    contentType: "table",
    tableStructure: {
      columns: 2,
      headers: ["Type of Advice", "Reason why this advice is important"],
    },
    requiredFields: ["goals_addressed"],
    description: "Goals and objectives being addressed",
  },

  // M4_S2: Advice Not Addressed
  {
    id: "M4_S2",
    title: "Advice Not Addressed",
    parentId: "M4",
    contentType: "paragraph",
    requiredFields: ["excluded_areas"],
    description: "Areas not covered by this advice",
  },

  // M4_S3: Tax Issues
  {
    id: "M4_S3",
    title: "Tax Issues",
    parentId: "M4",
    contentType: "paragraph",
    requiredFields: ["tax_considerations"],
    description: "Tax implications and considerations",
  },

  // M4_S4: Investment Risk Tolerance (parent)
  {
    id: "M4_S4",
    title: "Investment Risk Tolerance",
    parentId: "M4",
    contentType: "paragraph",
    requiredFields: [],
    description: "Risk tolerance assessment results",
  },

  // M4_S4_SS1: Results for Client 1
  {
    id: "M4_S4_SS1",
    title: "Results for Client 1",
    parentId: "M4_S4",
    contentType: "table",
    tableStructure: {
      columns: 7,
      headers: ["Risk Profile", "Defensive", "Conservative", "Moderate", "Balanced", "Growth", "High Growth"],
    },
    requiredFields: ["client1_risk_score", "client1_risk_profile"],
    description: "Client 1 risk profile assessment",
  },

  // M4_S4_SS2: Risk Profile Description - Client 1
  {
    id: "M4_S4_SS2",
    title: "Risk Profile Description - Client 1",
    parentId: "M4_S4",
    contentType: "paragraph",
    requiredFields: ["client1_profile_description"],
    description: "Detailed description of Client 1's risk profile",
  },

  // M4_S4_SS3: Results for Client 2
  {
    id: "M4_S4_SS3",
    title: "Results for Client 2",
    parentId: "M4_S4",
    contentType: "table",
    tableStructure: {
      columns: 7,
      headers: ["Risk Profile", "Defensive", "Conservative", "Moderate", "Balanced", "Growth", "High Growth"],
    },
    requiredFields: ["client2_risk_score", "client2_risk_profile"],
    description: "Client 2 risk profile assessment",
  },

  // M4_S4_SS4: Risk Profile Description - Client 2
  {
    id: "M4_S4_SS4",
    title: "Risk Profile Description - Client 2",
    parentId: "M4_S4",
    contentType: "paragraph",
    requiredFields: ["client2_profile_description"],
    description: "Detailed description of Client 2's risk profile",
  },

  // M5: Our Recommendations
  {
    id: "M5",
    title: "Our Recommendations",
    parentId: null,
    contentType: "mixed",
    requiredFields: ["recommendations"],
    description: "Detailed recommendations with rationale",
  },

  // M6: Retirement Income Estimates
  {
    id: "M6",
    title: "Retirement Income Estimates",
    parentId: null,
    contentType: "mixed",
    tableStructure: {
      columns: 6,
      headers: ["Year", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
    },
    requiredFields: ["retirement_projections"],
    description: "Projected retirement income scenarios",
  },

  // M7: Product Recommendations (parent)
  {
    id: "M7",
    title: "Product Recommendations",
    parentId: null,
    contentType: "paragraph",
    requiredFields: [],
    description: "Specific product recommendations",
  },

  // M7_S1: Recommended Products
  {
    id: "M7_S1",
    title: "Recommended Products",
    parentId: "M7",
    contentType: "table",
    tableStructure: {
      columns: 4,
      headers: ["Position", "Current Value", "Adjustment", "Proposed Value"],
    },
    requiredFields: ["product_recommendations"],
    description: "List of recommended products",
  },

  // M7_S2: Asset Allocation (parent)
  {
    id: "M7_S2",
    title: "Asset Allocation",
    parentId: "M7",
    contentType: "paragraph",
    requiredFields: [],
    description: "Asset allocation recommendations",
  },

  // M7_S2_SS1: Asset Allocation - Client 1
  {
    id: "M7_S2_SS1",
    title: "Your Current & Recommended Asset Allocation - Client 1",
    parentId: "M7_S2",
    contentType: "table",
    tableStructure: {
      columns: 5,
      headers: ["Asset", "Current", "Recommended", "Benchmark", "Variance"],
    },
    requiredFields: ["client1_current_allocation", "client1_recommended_allocation"],
    description: "Client 1 asset allocation comparison",
  },

  // M7_S2_SS2: Asset Allocation - Client 2
  {
    id: "M7_S2_SS2",
    title: "Your Current & Recommended Asset Allocation - Client 2",
    parentId: "M7_S2",
    contentType: "table",
    tableStructure: {
      columns: 5,
      headers: ["Asset", "Current", "Recommended", "Benchmark", "Variance"],
    },
    requiredFields: ["client2_current_allocation", "client2_recommended_allocation"],
    description: "Client 2 asset allocation comparison",
  },

  // M7_S3: Product Replacement (parent)
  {
    id: "M7_S3",
    title: "Product Replacement",
    parentId: "M7",
    contentType: "paragraph",
    requiredFields: [],
    description: "Product replacement recommendations",
  },

  // M7_S3_SS1: Current Investment Funds
  {
    id: "M7_S3_SS1",
    title: "Current Investment Funds",
    parentId: "M7_S3",
    contentType: "table",
    tableStructure: {
      columns: 2,
      headers: ["Product", "Balance"],
    },
    requiredFields: ["current_funds"],
    description: "Current investment fund holdings",
  },

  // M7_S3_SS2: Proposed Investment Funds
  {
    id: "M7_S3_SS2",
    title: "Proposed Investment Funds",
    parentId: "M7_S3",
    contentType: "table",
    tableStructure: {
      columns: 2,
      headers: ["Product", "Balance"],
    },
    requiredFields: ["proposed_funds"],
    description: "Recommended investment funds",
  },

  // M7_S3_SS3: Upfront Transactional Charges
  {
    id: "M7_S3_SS3",
    title: "Upfront Transactional Charges",
    parentId: "M7_S3",
    contentType: "table",
    tableStructure: {
      columns: 6,
      headers: ["Product", "Recommended Buys", "Recommended Sells", "Buy/Sell cost (%)", "Buy/Sell cost ($)", "Total"],
    },
    requiredFields: ["upfront_charges"],
    description: "One-time transaction costs",
  },

  // M7_S3_SS4: Ongoing Product Fees and Charges
  {
    id: "M7_S3_SS4",
    title: "Ongoing Product Fees and Charges",
    parentId: "M7_S3",
    contentType: "table",
    tableStructure: {
      columns: 6,
      headers: ["Management cost (%)", "Management cost ($)", "Admin Fees", "Other fees", "Less rebates", "Total ongoing fees"],
    },
    requiredFields: ["ongoing_fees"],
    description: "Recurring product fees",
  },

  // M7_S4: Insurance Recommendations (parent)
  {
    id: "M7_S4",
    title: "Insurance Recommendations",
    parentId: "M7",
    contentType: "paragraph",
    requiredFields: [],
    description: "Insurance recommendations",
  },

  // M7_S4_SS1: Summary of Insurance Requirements
  {
    id: "M7_S4_SS1",
    title: "Summary of Insurance Requirements",
    parentId: "M7_S4",
    contentType: "table",
    tableStructure: {
      columns: 4,
      headers: ["Client", "Life", "TPD", "IP (pa)"],
    },
    requiredFields: ["insurance_requirements"],
    description: "Insurance needs analysis summary",
  },

  // M7_S4_SS2: Personal Insurance Product Recommendations
  {
    id: "M7_S4_SS2",
    title: "Personal Insurance Product Recommendations",
    parentId: "M7_S4",
    contentType: "table",
    tableStructure: {
      columns: 6,
      headers: ["Insurance Policy", "Policy Owner", "Life Insured", "Cover", "Benefit", "Policy cost (p.a.)"],
    },
    requiredFields: ["insurance_product_recommendations"],
    description: "Specific insurance product recommendations",
  },

  // M8: Costs and Other Important Information (parent)
  {
    id: "M8",
    title: "Costs and Other Important Information",
    parentId: null,
    contentType: "paragraph",
    requiredFields: [],
    description: "Fee and cost disclosures",
  },

  // M8_S1: Advice Fees
  {
    id: "M8_S1",
    title: "Advice Fees",
    parentId: "M8",
    contentType: "paragraph",
    requiredFields: ["upfront_advice_fee", "ongoing_advice_fee"],
    description: "Adviser fees charged",
  },

  // M8_S2: Insurance Premiums
  {
    id: "M8_S2",
    title: "Insurance Premiums",
    parentId: "M8",
    contentType: "table",
    tableStructure: {
      columns: 5,
      headers: ["Upfront", "Payable by you %", "Payable by you $", "Amount Firm receives %", "Amount Firm receives $"],
    },
    requiredFields: ["insurance_premium_breakdown"],
    description: "Insurance premium details and commissions",
  },

  // M8_S3: Other Platform/Product Fees
  {
    id: "M8_S3",
    title: "Other Platform/Product Fees",
    parentId: "M8",
    contentType: "paragraph",
    requiredFields: ["platform_fees", "product_fees"],
    description: "Platform and product fees",
  },

  // M8_S4: Associated Entities
  {
    id: "M8_S4",
    title: "Associated Entities",
    parentId: "M8",
    contentType: "paragraph",
    requiredFields: ["conflicts_disclosure"],
    description: "Conflicts of interest and related parties",
  },

  // M8_S5: Future Reviews
  {
    id: "M8_S5",
    title: "Future Reviews",
    parentId: "M8",
    contentType: "paragraph",
    requiredFields: ["review_schedule"],
    description: "Ongoing review arrangements",
  },

  // M9: Agreement to Proceed (parent)
  {
    id: "M9",
    title: "Agreement to Proceed",
    parentId: null,
    contentType: "paragraph",
    requiredFields: [],
    description: "Client acknowledgment and consent",
  },

  // M9_S1: Client Declaration
  {
    id: "M9_S1",
    title: "Client Declaration",
    parentId: "M9",
    contentType: "mixed",
    requiredFields: ["client_acknowledgment", "signature_fields"],
    description: "Client declaration and signature section",
  },

  // M10: How to Implement This Advice
  {
    id: "M10",
    title: "How to Implement This Advice",
    parentId: null,
    contentType: "paragraph",
    requiredFields: ["implementation_steps"],
    description: "Step-by-step implementation guide",
  },
]

/**
 * Helper function to create an empty SOA document structure
 */
export function createEmptySoaDocument(projectId: string): SOADocument {
  const sections: SOASection[] = soaSectionTemplates.map((template) => ({
    id: template.id,
    title: template.title,
    parentId: template.parentId,
    contentType: template.contentType,
    content: {},
    sources: [],
    requiredFields: template.requiredFields,
    status: "pending",
  }))

  return {
    projectId,
    version: 1,
    sections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Get the section hierarchy (tree structure)
 */
export function getSectionHierarchy(sections: SOASection[]): Map<string | null, SOASection[]> {
  const hierarchy = new Map<string | null, SOASection[]>()

  for (const section of sections) {
    const children = hierarchy.get(section.parentId) ?? []
    children.push(section)
    hierarchy.set(section.parentId, children)
  }

  return hierarchy
}

/**
 * Get main sections (top-level sections)
 */
export function getMainSections(sections: SOASection[]): SOASection[] {
  return sections.filter((s) => s.parentId === null)
}

/**
 * Get subsections for a given parent section
 */
export function getSubsections(sections: SOASection[], parentId: string): SOASection[] {
  return sections.filter((s) => s.parentId === parentId)
}
