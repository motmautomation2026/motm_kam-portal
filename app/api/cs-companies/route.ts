import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetValues, appendRow } from "@/lib/sheets"
import { parseCSCompany } from "@/lib/sheets-helpers"
import { TESTSHEET_ID, TEST_SHEETS, STATUS_OPTIONS } from "@/constants"
import { CS_ACTIVE_FIELDS, CS_HEADER_ROWS, CS_CLIENT_CODE_COL } from "@/constants/csActiveFields"
import { esc } from "@/lib/utils"

const STATUS_SET = new Set<string>(STATUS_OPTIONS)

function isAllowed(role: string) {
  return role === "Customer Success" || role === "Admin"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !isAllowed(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const rows = await getSheetValues(TESTSHEET_ID, TEST_SHEETS.ACTIVE)
    const data = rows
      .slice(CS_HEADER_ROWS)
      .map((row, i) => parseCSCompany(row, i + CS_HEADER_ROWS + 1))
      .filter((c) => c.clientCode)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[cs-companies GET]", err)
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAllowed(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const clientCode = (body.clientCode ?? "").trim()
  const clientName = (body.clientName ?? "").trim()
  const status = (body.status ?? "New").trim() || "New"

  if (!clientCode) return NextResponse.json({ error: "Client Code is required" }, { status: 400 })
  if (!clientName) return NextResponse.json({ error: "Client Name is required" }, { status: 400 })
  if (!STATUS_SET.has(status)) {
    return NextResponse.json({ error: `Invalid status "${status}"` }, { status: 400 })
  }

  const existingRows = await getSheetValues(TESTSHEET_ID, TEST_SHEETS.ACTIVE)
  const exists = existingRows
    .slice(CS_HEADER_ROWS)
    .some((r) => r[CS_CLIENT_CODE_COL]?.trim().toLowerCase() === clientCode.toLowerCase())
  if (exists) return NextResponse.json({ error: "Client Code already exists" }, { status: 400 })

  const maxCol = Math.max(...CS_ACTIVE_FIELDS.map((f) => f.col))
  const rowValues: string[] = new Array(maxCol + 1).fill("")
  for (const f of CS_ACTIVE_FIELDS) {
    if (f.key === "status") rowValues[f.col] = esc(status)
    else if (f.key === "clientCode") rowValues[f.col] = esc(clientCode)
    else if (f.key === "clientName") rowValues[f.col] = esc(clientName)
    else if (body[f.key] !== undefined) rowValues[f.col] = esc(String(body[f.key]))
  }

  await appendRow(TESTSHEET_ID, TEST_SHEETS.ACTIVE, rowValues)

  return NextResponse.json({ success: true })
}
