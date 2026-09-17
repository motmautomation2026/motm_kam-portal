// Column map for the "Active" tab of the separate Customer Success spreadsheet (TESTSHEET_ID).
// This is the single source of truth: the API routes, the row parser, and the dashboard's
// edit form are all generated from this list, so a column never needs to be re-typed by hand
// in more than one place.

export interface CSField {
  key: string
  label: string
  col: number // 0-indexed column in the "Active" tab
  section: string
  options?: readonly string[]
}

// Row 4 (1-indexed) holds the column headers; data starts at row 5.
export const CS_HEADER_ROWS = 4

const DOMESTIC_INTERNATIONAL_OPTIONS = ["Domestic", "Domestic/International", "International"] as const
const LINKEDIN_NETWORKING_OPTIONS = ["Yes", "No", "Calling"] as const

export const CS_ACTIVE_FIELDS: CSField[] = [
  { key: "status", label: "Status", col: 0, section: "Core" },
  { key: "clientCode", label: "Client Code", col: 1, section: "Core" },
  { key: "clientName", label: "Client Name", col: 2, section: "Core" },
  { key: "name", label: "Name", col: 3, section: "Core" },

  { key: "simCard", label: "Sim Card", col: 4, section: "Acquisition" },
  { key: "sampleCatalogueAssets", label: "Sample/Catalogue/Assets", col: 5, section: "Acquisition" },
  { key: "strategyReportMeeting", label: "Strategy Report / Meeting", col: 6, section: "Acquisition" },
  { key: "lqc", label: "LQC", col: 7, section: "Acquisition" },
  { key: "digitalLinkedin", label: "Digital / LinkedIn", col: 8, section: "Acquisition" },
  { key: "clientType", label: "Client Type", col: 9, section: "Acquisition" },

  { key: "introMeeting", label: "Introductory Meeting", col: 11, section: "Customer Onboarding" },
  { key: "onboardingForm", label: "OnBoarding Form", col: 12, section: "Customer Onboarding" },
  { key: "kpiSent", label: "KPI Sent", col: 13, section: "Customer Onboarding" },
  { key: "kpiApproved", label: "KPI Approved", col: 14, section: "Customer Onboarding" },
  { key: "mktMaterial", label: "Mkt. Material rcv'd.", col: 15, section: "Customer Onboarding" },
  { key: "domainHost", label: "Domain Host", col: 16, section: "Customer Onboarding" },
  { key: "emails", label: "EMails", col: 17, section: "Customer Onboarding" },

  { key: "emailCredentials", label: "Email Credentials", col: 18, section: "Phase Two" },
  { key: "sampleData", label: "Sample Data", col: 19, section: "Phase Two" },
  { key: "emailTemplate", label: "Email Template", col: 20, section: "Phase Two" },
  { key: "emailingStarted", label: "Emailing Started", col: 21, section: "Phase Two" },
  { key: "firstMisDate", label: "First MIS Date", col: 22, section: "Phase Two" },
  { key: "duration", label: "Duration", col: 23, section: "Phase Two" },
  { key: "firstReviewMeeting", label: "1st Review Meeting", col: 24, section: "Phase Two" },
  { key: "trainingSession", label: "Training Session", col: 25, section: "Phase Two" },
  { key: "clientType2", label: "Client Type", col: 26, section: "Phase Two" },
  { key: "dataResearch", label: "Data Research", col: 27, section: "Phase Two" },
  { key: "intSalesTeam", label: "Int Sales Team", col: 28, section: "Phase Two" },
  { key: "linkedinTeam", label: "LinkedIn Team", col: 29, section: "Phase Two" },
  { key: "telecalling", label: "Telecalling", col: 30, section: "Phase Two" },

  { key: "teamLead", label: "Team Lead", col: 31, section: "Phase Three — Allocation" },
  { key: "domesticInternational", label: "Domestic/International", col: 32, section: "Phase Three — Allocation", options: DOMESTIC_INTERNATIONAL_OPTIONS },
  { key: "fieldVisits", label: "Field Visits", col: 33, section: "Phase Three — Allocation" },
  { key: "fieldSalesEngineer", label: "Field Sales Engineer", col: 34, section: "Phase Three — Allocation" },
  { key: "linkedinNetworking", label: "Linkedin Networking", col: 35, section: "Phase Three — Allocation", options: LINKEDIN_NETWORKING_OPTIONS },
  { key: "posters", label: "Posters", col: 36, section: "Phase Three — Allocation" },

  { key: "website", label: "Website", col: 37, section: "Digital & Marketing" },
  { key: "targets", label: "Targets", col: 38, section: "Digital & Marketing" },
  { key: "target", label: "Target", col: 39, section: "Digital & Marketing" },
  { key: "extraTarget", label: "Extra Target", col: 40, section: "Digital & Marketing" },
  { key: "feedback", label: "Feedback", col: 41, section: "Digital & Marketing" },
  { key: "seo", label: "SEO", col: 42, section: "Digital & Marketing" },
  { key: "linkedinExc", label: "LinkedIn Exc", col: 43, section: "Digital & Marketing" },

  { key: "noticeReceivedDate", label: "Notice Received Date", col: 45, section: "Notice & Closure" },
  { key: "reasonOfNotice", label: "Reason of Notice", col: 46, section: "Notice & Closure" },
  { key: "noticeReceivedVia", label: "Notice Received Via (Email / Call / WhatsApp / Meeting)", col: 47, section: "Notice & Closure" },
  { key: "closeDate", label: "Close Date", col: 48, section: "Notice & Closure" },
  { key: "reasonForClosure", label: "Reason for Closure", col: 49, section: "Notice & Closure" },
  { key: "nextAction", label: "Next Action (Need to Continue/Not)", col: 50, section: "Notice & Closure" },

  { key: "intSalesTeamTarget", label: "Int Sales Team Target", col: 52, section: "Targets & Assignment" },
  { key: "linkedinTeamTarget", label: "LinkedIn Team Target", col: 53, section: "Targets & Assignment" },
  { key: "kamAssigned", label: "KAM Assigned", col: 54, section: "Targets & Assignment" },
]

export const CS_FIELD_BY_KEY: Record<string, CSField> = Object.fromEntries(
  CS_ACTIVE_FIELDS.map((f) => [f.key, f]),
)

export const CS_CLIENT_CODE_COL = CS_FIELD_BY_KEY.clientCode.col
