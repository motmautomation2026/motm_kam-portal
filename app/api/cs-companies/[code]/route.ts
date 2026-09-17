import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetValues, batchUpdate, colToLetter, deleteRow } from "@/lib/sheets"
import { TESTSHEET_ID, TEST_SHEETS, STATUS_OPTIONS } from "@/constants"
import { CS_ACTIVE_FIELDS, CS_HEADER_ROWS, CS_CLIENT_CODE_COL } from "@/constants/csActiveFields"
import { esc } from "@/lib/utils"

const STATUS_SET = new Set<string>(STATUS_OPTIONS)

function isAllowed(role: string) {
  return role === "Customer Success" || role === "Admin"
}

async function findRowNum(code: string): Promise<number | null> {
  const rows = await getSheetValues(TESTSHEET_ID, TEST_SHEETS.ACTIVE)
  const rowIndex = rows.slice(CS_HEADER_ROWS).findIndex((r) => r[CS_CLIENT_CODE_COL] === code)
  if (rowIndex === -1) return null
  return rowIndex + CS_HEADER_ROWS + 1
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || !isAllowed(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { code } = await params
  const body = await req.json()

  if (body.status !== undefined && !STATUS_SET.has(body.status)) {
    return NextResponse.json({ error: `Invalid status "${body.status}"` }, { status: 400 })
  }

  const rowNum = await findRowNum(decodeURIComponent(code))
  if (!rowNum) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  const updates: Array<{ range: string; values: unknown[][] }> = []
  for (const f of CS_ACTIVE_FIELDS) {
    if (f.key === "clientCode") continue // join key — not editable after creation
    if (body[f.key] !== undefined) {
      const colLetter = colToLetter(f.col + 1)
      updates.push({ range: `${TEST_SHEETS.ACTIVE}!${colLetter}${rowNum}`, values: [[esc(String(body[f.key]))]] })
    }
  }

  if (updates.length > 0) {
    await batchUpdate(TESTSHEET_ID, updates)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || !isAllowed(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { code } = await params
  const rowNum = await findRowNum(decodeURIComponent(code))
  if (!rowNum) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  await deleteRow(TESTSHEET_ID, TEST_SHEETS.ACTIVE, rowNum)

  return NextResponse.json({ success: true })
}
