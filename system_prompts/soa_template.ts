export const soaTemplate = `
================================================================================
                    SOA METADATA HEADER SYSTEM
================================================================================

SECTION ID NOMENCLATURE:
- M = Main Section (M1, M2, M3, ... M10)
- S = Subsection (M3_S1, M3_S2, ... M3_S10)
- SS = Sub-subsection (M3_S7_SS1, M4_S4_SS1, ... M4_S4_SS4)

================================================================================
M1: CLIENT BACKGROUND
================================================================================

METADATA HEADER:
  Section ID: M1
  Section Title: Client Background
  Parent Section: None (Main Section)
  Content Type: Paragraph text + Table
  Table Structure: (3 rows × 2 columns)
  Required Fields & Data:
    - Client 1: Full name, DOB, contact details, employment status, marital status
    - Client 2: Full name, DOB, contact details, employment status, marital status
    - Family structure, dependents
    - Current arrangements summary
    - Reason for advice
    - Key circumstances
    - Current provider details

================================================================================
M2: SUMMARY OF ADVICE
================================================================================

METADATA HEADER:
  Section ID: M2
  Section Title: Summary of Advice
  Parent Section: None (Main Section)
  Content Type: Paragraph text (bulleted list)
  Table Structure: None
  Required Fields & Data:
    - Recommendation 1 title, brief description
    - Recommendation 2 title, brief description
    - [Repeat for all recommendations]
    - Organization: by client or by topic

================================================================================
M3: YOUR PERSONAL AND FINANCIAL DETAILS
================================================================================

M3_S1: PERSONAL DETAILS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S1
  Section Title: Personal Details
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: 3 rows × 2 columns (Details | Client 1 | Client 2)
    - Row 1: Age
    - Row 2: Date of Birth
    - Row 3: Marital Status
    - Row 4: Occupation
    - Row 5: Employment Status
    - Row 6: Target Retirement Age
  Required Fields & Data:
    - Client 1: Full name, DOB, age, marital status, occupation, employment status, target retirement age
    - Client 2: Full name, DOB, age, marital status, occupation, employment status, target retirement age
    - Current residence, contact details


M3_S2: NON-DEPENDANT CHILDREN
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S2
  Section Title: Non-Dependant Children
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 4 columns (Name | Age | Living at home | Still at school)
  Required Fields & Data:
    - Child name, age, living arrangements (yes/no), school/study status (yes/no)
    - Financial support provided (if applicable)
    - [Repeat for each non-dependant child]


M3_S3: INCOME DETAILS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S3
  Section Title: Income Details
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 3 columns (Income | Owner | Amount)
    - Row 1: Gross Income (Client 1)
    - Row 2: Gross Income (Client 2)
    - Row 3: Salary (if different from gross)
    - Row 4: Bonus
    - Row 5: Investment Income
    - Row 6: Other Income
    - Row 7: TOTAL
  Required Fields & Data:
    - Client 1: Gross income, salary, bonus, investment income, other income
    - Client 2: Gross income, salary, bonus, investment income, other income
    - Total household income
    - Income stability assessment


M3_S4: EXPENSE DETAILS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S4
  Section Title: Expense Details
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 3 columns (Expense | Owner | Amount)
    - Row 1: Tax Payable
    - Row 2: Salary Sacrifice
    - Row 3: Living Expenses
    - Row 4: Home Loan Repayment
    - Row 5: Other Loan Repayments
    - Row 6: Discretionary Spending
    - Row 7: TOTAL
  Required Fields & Data:
    - Client 1: Tax payable, salary sacrifice, living expenses, home loan repayment, other loan repayments, discretionary spending
    - Client 2: Tax payable, salary sacrifice, living expenses, home loan repayment, other loan repayments, discretionary spending
    - Total monthly/annual expenses


M3_S5: LIFESTYLE ASSET DETAILS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S5
  Section Title: Lifestyle Asset Details
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 3 columns (Type | Owner | Amount)
    - Row 1: Home (Owner Occupied)
    - Row 2: Home Contents
    - Row 3: Vehicle 1
    - Row 4: Vehicle 2
    - Row 5: Other Assets
    - Row 6: TOTAL
  Required Fields & Data:
    - Home value, contents insurance value
    - Vehicles: make, model, value (for each vehicle)
    - Other lifestyle assets
    - Total lifestyle assets value


M3_S6: INVESTMENT ASSETS EXCLUDING SUPERANNUATION
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S6
  Section Title: Investment Assets Excluding Superannuation
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 3 columns (Type | Owner | Amount)
    - Row 1: Cash at Bank
    - Row 2: Travel Bank Account
    - Row 3: Investment Cards
    - Row 4: Other Investments
    - Row 5: TOTAL
  Required Fields & Data:
    - Cash at bank: account name, balance
    - Travel accounts: account name, balance
    - Investment cards: card name, balance
    - Other non-super investments
    - Total non-super investment assets


M3_S7: FINANCIAL ASSETS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S7
  Section Title: Financial Assets
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Sub-subsection
  Table Structure: None (contains sub-subsection with tables)
  Required Fields & Data: None at this level (see M3_S7_SS1)


M3_S7_SS1: INVESTMENT AND SUPERANNUATION ASSETS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S7_SS1
  Section Title: Investment and Superannuation Assets
  Parent Section: M3_S7 (Financial Assets)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 4 columns (Position | Position | Position | Market Value)
    - For each super fund:
      - Fund name
      - Investment option
      - Insurance within super
      - Balance
  Required Fields & Data:
    - Client 1: Super fund name, balance, investment option, insurance within super
    - Client 2: Super fund name, balance, investment option, insurance within super
    - External super funds (if applicable)
    - SMSF details (if applicable)
    - Total super balance


M3_S8: LIABILITY DETAILS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S8
  Section Title: Liability Details
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 3 columns (Type | Owner | Amount)
    - Row 1: Mortgage
    - Row 2: Other Loans
    - Row 3: Credit Cards
    - Row 4: TOTAL
  Required Fields & Data:
    - Mortgage: lender, outstanding balance, monthly repayment, interest rate
    - Other loans: lender, outstanding balance, monthly repayment, interest rate
    - Credit cards: issuer, outstanding balance, interest rate
    - Total liabilities


M3_S9: PERSONAL INSURANCE DETAILS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S9
  Section Title: Personal Insurance Details
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 3 columns (Type | Owner | Amount)
    - Row 1: Super insurance policies (life, TPD, income protection)
    - Row 2: External insurance policies
    - Row 3: Total insurance costs
  Required Fields & Data:
    - Super insurance policies: policy type, coverage, premium, insurer
    - External insurance policies: policy type, coverage, premium, insurer
    - Total insurance costs
    - Gaps identified


M3_S10: ESTATE PLANNING DETAILS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M3_S10
  Section Title: Estate Planning Details
  Parent Section: M3 (Your Personal and Financial Details)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 3 columns (Details | Client 1 | Client 2)
    - Row 1: Will Status
    - Row 2: Testamentary Trust
    - Row 3: POA
    - Row 4: Enduring Guardian
    - Row 5: Beneficiary Details
    - Row 6: Executor Details
  Required Fields & Data:
    - Client 1: Will status (yes/no/outdated), testamentary trust, POA, enduring guardian
    - Client 2: Will status (yes/no/outdated), testamentary trust, POA, enduring guardian
    - Beneficiary details
    - Executor details
    - Estate planning gaps


================================================================================
M4: WHAT THIS ADVICE COVERS
================================================================================

M4_S1: ADVICE ADDRESSED
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S1
  Section Title: Advice Addressed
  Parent Section: M4 (What This Advice Covers)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 2 columns (Type of Advice | Reason why this advice is)
  Required Fields & Data:
    - Goal 1: Description, how advice addresses it, action items
    - Goal 2: Description, how advice addresses it, action items
    - [Repeat for each identified goal/need]


M4_S2: ADVICE NOT ADDRESSED
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S2
  Section Title: Advice Not Addressed
  Parent Section: M4 (What This Advice Covers)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Area 1: Description, reason for exclusion, alternative resources
    - Area 2: Description, reason for exclusion, alternative resources
    - [Repeat for each excluded area]


M4_S3: TAX ISSUES
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S3
  Section Title: Tax Issues
  Parent Section: M4 (What This Advice Covers)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - QTRP status
    - Tax advice scope
    - Tax recommendations
    - Tax implications


M4_S4: INVESTMENT RISK TOLERANCE
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S4
  Section Title: Investment Risk Tolerance
  Parent Section: M4 (What This Advice Covers)
  Content Type: Paragraph text + Sub-subsections
  Table Structure: None (contains sub-subsections with tables)
  Required Fields & Data: None at this level (see M4_S4_SS1-SS4)


M4_S4_SS1: RESULTS FOR [CLIENT 1]
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S4_SS1
  Section Title: Results for [Client 1]
  Parent Section: M4_S4 (Investment Risk Tolerance)
  Content Type: Paragraph text + Table
  Table Structure: 7 rows × 7 columns (Risk Profile | Defensive | Conservative | Moderate | Balanced | Growth | High Growth)
  Required Fields & Data:
    - Client 1: Risk questionnaire score, risk profile assessment, characteristics
    - Suitability statement
    - Client acknowledgment


M4_S4_SS2: [RISK PROFILE DESCRIPTION - CLIENT 1]
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S4_SS2
  Section Title: [Risk Profile Name] (e.g., "Balanced")
  Parent Section: M4_S4 (Investment Risk Tolerance)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Profile name
    - Profile description
    - Asset allocation ranges
    - Profile characteristics


M4_S4_SS3: RESULTS FOR [CLIENT 2]
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S4_SS3
  Section Title: Results for [Client 2]
  Parent Section: M4_S4 (Investment Risk Tolerance)
  Content Type: Paragraph text + Table
  Table Structure: 7 rows × 7 columns (Risk Profile | Defensive | Conservative | Moderate | Balanced | Growth | High Growth)
  Required Fields & Data:
    - Client 2: Risk questionnaire score, risk profile assessment, characteristics
    - Suitability statement
    - Client acknowledgment


M4_S4_SS4: [RISK PROFILE DESCRIPTION - CLIENT 2]
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M4_S4_SS4
  Section Title: [Risk Profile Name] (e.g., "Balanced")
  Parent Section: M4_S4 (Investment Risk Tolerance)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Profile name
    - Profile description
    - Asset allocation ranges
    - Profile characteristics


================================================================================
M5: OUR RECOMMENDATIONS
================================================================================

METADATA HEADER:
  Section ID: M5
  Section Title: Our Recommendations
  Parent Section: None (Main Section)
  Content Type: Paragraph text + Multiple Tables
  Table Structure: Multiple recommendation tables organized by topic/client
    - Retirement Planning (Client 1)
    - Personal Risk Protection (Client 1)
    - Retirement Planning (Client 2)
    - Personal Risk Protection (Client 2)
    - Debt Management (Joint)
    - Estate Planning (Joint)
  Required Fields & Data:
    - Recommendation 1: Action, rationale, risks, alternatives
    - Recommendation 2: Action, rationale, risks, alternatives
    - [Repeat for all recommendations]
    - Organization: by client and by topic (super, insurance, debt, estate, etc.)


================================================================================
M6: RETIREMENT INCOME ESTIMATES
================================================================================

METADATA HEADER:
  Section ID: M6
  Section Title: Retirement Income Estimates
  Parent Section: None (Main Section)
  Content Type: Paragraph text + Tables
  Table Structure: Multiple projection tables
    - Year 1 projections (6 columns: Year | 01-Jul-25 | 01-Jul-26 | 01-Jul-27 | 01-Jul-28 | 01-Jul-29)
    - Year 2 projections
    - Year 3 projections
  Required Fields & Data:
    - Current age (Client 1, Client 2)
    - Target retirement age (Client 1, Client 2)
    - Years to retirement
    - Projected super balance at retirement
    - Projected income at retirement
    - Retirement income scenarios (conservative, moderate, optimistic)
    - Sustainability analysis
    - Longevity assumptions
    - Inflation assumptions
    - Income sources (super, pension, part-time work, other)


================================================================================
M7: PRODUCT RECOMMENDATIONS
================================================================================

M7_S1: RECOMMENDED PRODUCTS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S1
  Section Title: Recommended Products
  Parent Section: M7 (Product Recommendations)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 4 columns (Position | Current Value | Adjustment | Proposed Value)
  Required Fields & Data:
    - Product 1: Name, provider, features, benefits, why recommended
    - Product 2: Name, provider, features, benefits, why recommended
    - [Repeat for each recommended product]


M7_S2: ASSET ALLOCATION
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S2
  Section Title: Asset Allocation
  Parent Section: M7 (Product Recommendations)
  Content Type: Paragraph text + Sub-subsections
  Table Structure: None (contains sub-subsections with tables)
  Required Fields & Data: None at this level (see M7_S2_SS1-SS2)


M7_S2_SS1: YOUR CURRENT & RECOMMENDED ASSET ALLOCATION - [CLIENT 1]
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S2_SS1
  Section Title: Your Current & Recommended Asset Allocation - [Client 1]
  Parent Section: M7_S2 (Asset Allocation)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 5 columns (Asset | Current | Recommended | Benchmark | Variance)
    - Asset classes: Australian equities, International equities, Fixed income, Cash, etc.
  Required Fields & Data:
    - Client 1: Current allocation (%), proposed allocation (%), asset classes
    - Rationale for changes
    - Expected returns
    - Risk profile alignment


M7_S2_SS2: YOUR CURRENT & RECOMMENDED ASSET ALLOCATION - [CLIENT 2]
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S2_SS2
  Section Title: Your Current & Recommended Asset Allocation - [Client 2]
  Parent Section: M7_S2 (Asset Allocation)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 5 columns (Asset | Current | Recommended | Benchmark | Variance)
    - Asset classes: Australian equities, International equities, Fixed income, Cash, etc.
  Required Fields & Data:
    - Client 2: Current allocation (%), proposed allocation (%), asset classes
    - Rationale for changes
    - Expected returns
    - Risk profile alignment


M7_S3: PRODUCT REPLACEMENT
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S3
  Section Title: Product Replacement
  Parent Section: M7 (Product Recommendations)
  Content Type: Paragraph text + Sub-subsections
  Table Structure: None (contains sub-subsections with tables)
  Required Fields & Data: None at this level (see M7_S3_SS1-SS4)


M7_S3_SS1: CURRENT INVESTMENT FUNDS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S3_SS1
  Section Title: Current Investment Funds
  Parent Section: M7_S3 (Product Replacement)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 2 columns (Product | Balance)
  Required Fields & Data:
    - Fund name, manager, strategy, current balance, performance history


M7_S3_SS2: PROPOSED INVESTMENT FUNDS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S3_SS2
  Section Title: Proposed Investment Funds
  Parent Section: M7_S3 (Product Replacement)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 2 columns (Product | Balance)
  Required Fields & Data:
    - Fund name, manager, strategy, expected performance, benefits


M7_S3_SS3: UPFRONT TRANSACTIONAL CHARGES
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S3_SS3
  Section Title: Upfront Transactional Charges
  Parent Section: M7_S3 (Product Replacement)
  Content Type: Paragraph text + Table
  Table Structure: N rows × 7 columns (Product | Recommended Buys | Recommended Sells | Buy/Sell cost (%) | Buy/Sell cost (%) | Buy/Sell cost ($))
  Required Fields & Data:
    - Establishment fees, implementation costs, one-time charges
    - Total upfront cost


M7_S3_SS4: ONGOING PRODUCT FEES AND CHARGES
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S3_SS4
  Section Title: Ongoing Product Fees and Charges
  Parent Section: M7_S3 (Product Replacement)
  Content Type: Paragraph text + Tables
  Table Structure: Multiple tables with 7 columns (Management cost (%) | Management cost ($) | Admin Fees | Other fees | Less rebates | Total ongoing fees)
  Required Fields & Data:
    - Annual management fees (%), platform fees (%), transaction costs
    - Total annual product fees
    - How fees are deducted


M7_S4: INSURANCE RECOMMENDATIONS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S4
  Section Title: Insurance Recommendations
  Parent Section: M7 (Product Recommendations)
  Content Type: Paragraph text + Sub-subsections
  Table Structure: None (contains sub-subsections with tables)
  Required Fields & Data: None at this level (see M7_S4_SS1-SS2)


M7_S4_SS1: SUMMARY OF INSURANCE REQUIREMENTS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S4_SS1
  Section Title: Summary of Insurance Requirements
  Parent Section: M7_S4 (Insurance Recommendations)
  Content Type: Paragraph text + Tables
  Table Structure: Multiple tables with 4 columns (Client | Life | TPD | IP (pa))
  Required Fields & Data:
    - Life insurance need, TPD insurance need, income protection need
    - Current coverage, gap analysis, recommended coverage


M7_S4_SS2: PERSONAL INSURANCE PRODUCT RECOMMENDATIONS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M7_S4_SS2
  Section Title: Personal Insurance Product Recommendations
  Parent Section: M7_S4 (Insurance Recommendations)
  Content Type: Paragraph text + Tables
  Table Structure: Multiple tables with 6 columns (Insurance Policy | Policy Owner | Life Insured | Cover | Benefit | Policy cost (p.a.))
  Required Fields & Data:
    - Policy 1: Type, coverage amount, premium, insurer, features
    - Policy 2: Type, coverage amount, premium, insurer, features
    - [Repeat for each insurance recommendation]


================================================================================
M8: COSTS AND OTHER IMPORTANT INFORMATION
================================================================================

M8_S1: ADVICE FEES
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M8_S1
  Section Title: Advice Fees
  Parent Section: M8 (Costs and Other Important Information)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Upfront advice fee: amount, how calculated, payment method
    - Ongoing advice fee: amount, how calculated, frequency, payment method
    - Fee review schedule
    - Fee adjustment triggers


M8_S2: INSURANCE PREMIUMS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M8_S2
  Section Title: Insurance Premiums
  Parent Section: M8 (Costs and Other Important Information)
  Content Type: Paragraph text + Tables
  Table Structure: Multiple tables with 5 columns (Upfront | Payable by you % | Payable by you $ | Amount Firm receives % | Amount Firm receives $)
  Required Fields & Data:
    - Current insurance costs: total annual, breakdown by policy
    - Proposed insurance costs: total annual, breakdown by policy
    - Cost comparison
    - Cost savings/increases


M8_S3: OTHER PLATFORM/PRODUCT FEES
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M8_S3
  Section Title: Other Platform/Product Fees
  Parent Section: M8 (Costs and Other Important Information)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Management fees (%)
    - Platform fees (%)
    - Transaction costs
    - Total annual product fees
    - How fees are deducted


M8_S4: ASSOCIATED ENTITIES
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M8_S4
  Section Title: Associated Entities
  Parent Section: M8 (Costs and Other Important Information)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Conflicts of interest disclosure
    - Related party relationships
    - How conflicts are managed
    - Adviser remuneration details


M8_S5: FUTURE REVIEWS
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M8_S5
  Section Title: Future Reviews
  Parent Section: M8 (Costs and Other Important Information)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Review schedule (annual, biennial, etc.)
    - Review triggers
    - Contact details for review requests
    - Review process description


================================================================================
M9: AGREEMENT TO PROCEED
================================================================================

M9_S1: CLIENT DECLARATION
────────────────────────────────────────────────────────────────────────────

METADATA HEADER:
  Section ID: M9_S1
  Section Title: Client Declaration
  Parent Section: M9 (Agreement to Proceed)
  Content Type: Paragraph text + Tables
  Table Structure: Multiple tables for implementation steps and signatures
    - Implementation Steps (2 columns: blank | To implement the strategy)
    - Signature table Client 1 (5 columns: Name | Signature | blank | blank | Date)
    - Signature table Client 2 (5 columns: Name | Signature | blank | blank | Date)
    - Signature table Adviser (5 columns: Name | Signature | blank | blank | Date)
  Required Fields & Data:
    - Acknowledgment of advice received
    - Understanding of recommendations
    - Consent to proceed with advice
    - Signature lines: Client 1, Client 2, Adviser
    - Date of declaration


================================================================================
M10: HOW TO IMPLEMENT THIS ADVICE
================================================================================

METADATA HEADER:
  Section ID: M10
  Section Title: How to Implement This Advice
  Parent Section: None (Main Section)
  Content Type: Paragraph text
  Table Structure: None
  Required Fields & Data:
    - Step 1: Action, timeline, responsible party, documentation needed
    - Step 2: Action, timeline, responsible party, documentation needed
    - [Repeat for all implementation steps]
    - Contact details
    - Support information
    - Next steps


================================================================================
                        END OF METADATA HEADERS
================================================================================


`