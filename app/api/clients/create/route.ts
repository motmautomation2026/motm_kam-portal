import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetValues, appendRow } from "@/lib/sheets"
import { SHEET_ID, SHEETS, COLS, STATUS_OPTIONS } from "@/constants"
import { esc, nowIST } from "@/lib/utils"

const STATUS_SET = new Set<string>(STATUS_OPTIONS)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "Admin" && session.user.role !== "Customer Success")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const clientId = (body.clientId ?? "").trim()
  const company = (body.company ?? "").trim()
  const status = (body.status ?? "New").trim() || "New"

  if (!clientId) return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
  if (!company) return NextResponse.json({ error: "Company is required" }, { status: 400 })
  if (!STATUS_SET.has(status)) {
    return NextResponse.json({ error: `Invalid status "${status}"` }, { status: 400 })
  }

  const existingRows = await getSheetValues(SHEET_ID, SHEETS.CLIENT_MASTER)
  const exists = existingRows
    .slice(1)
    .some((r) => r[COLS.CLIENT.ID]?.trim().toLowerCase() === clientId.toLowerCase())
  if (exists) return NextResponse.json({ error: "Client ID already exists" }, { status: 400 })

  const today = new Date().toISOString().split("T")[0]
  const addedBy = session.user.fullName || session.user.email

  await appendRow(SHEET_ID, SHEETS.CLIENT_MASTER, [
    esc(clientId),                                    // A Client ID
    esc(company),                                     // B Company
    esc(body.industry ?? ""),                         // C Industry
    esc(body.city ?? ""),                             // D City
    esc(body.startDate?.trim() || today),             // E Start Date
    "",                                                // F Duration Days (auto-calc)
    esc(status),                                       // G Status
    esc(body.kam ?? ""),                              // H KAM
    esc(body.se ?? ""),                               // I SE
    esc(body.contact ?? ""),                          // J Contact Person
    esc(body.phone ?? ""),                            // K Phone
    "Unset",                                           // L Health
    "Neutral",                                         // M Feedback Status
    "",                                                // N AI Priority
    "",                                                // O Last Feedback Date
    "",                                                // P Days Since Feedback
    "",                                                // Q Next Followup
    "",                                                // R Overdue
    esc(body.contractValue ?? ""),                    // S Contract Value
    esc(body.monthlyValue ?? ""),                     // T Monthly Value
    esc(body.services ?? ""),                         // U Services
    "",                                                // V KAM Notes
    `Added by ${addedBy} (Customer Success) ${nowIST()}`, // W Assign Log
    "",                                                // X Sheet ID
    "",                                                // Y Dashboard ID
  ])

  return NextResponse.json({ success: true })
}
