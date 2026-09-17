import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetValues, batchUpdate, colToLetter, deleteRow } from "@/lib/sheets"
import { parseClient } from "@/lib/sheets-helpers"
import { SHEET_ID, SHEETS, COLS, TESTSHEET_ID, TEST_SHEETS } from "@/constants"
import { CS_HEADER_ROWS, CS_CLIENT_CODE_COL } from "@/constants/csActiveFields"
import { esc, nowIST } from "@/lib/utils"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const rows = await getSheetValues(SHEET_ID, SHEETS.CLIENT_MASTER)
  const rowIndex = rows.slice(1).findIndex((r) => r[COLS.CLIENT.ID] === id)
  if (rowIndex === -1) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const rowNum = rowIndex + 2
  const client = parseClient(rows[rowIndex + 1], rowNum)

  // SE cannot edit client master
  if (session.user.role === "SE" || session.user.role === "DR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const isUnrestricted = session.user.role === "Admin" || session.user.role === "Customer Success"

  // KAMs can only edit their own clients
  if (!isUnrestricted && client.kam !== session.user.kamName) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // Reassigning the KAM or SE on a client is Admin/Customer Success-only
  if ((body.kam !== undefined || body.se !== undefined) && !isUnrestricted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const c = COLS.CLIENT
  const updates: Array<{ range: string; values: unknown[][] }> = []

  const map: Record<string, number> = {
    status: c.STATUS + 1,
    health: c.HEALTH + 1,
    feedbackStatus: c.FEEDBACK_STATUS + 1,
    nextFollowup: c.NEXT_FOLLOWUP + 1,
    lastFeedbackDate: c.LAST_FEEDBACK_DATE + 1,
    kamNotes: c.KAM_NOTES + 1,
    kam: c.KAM + 1,
    se: c.SE + 1,
    // Full field-edit rights, Admin/Customer Success only
    ...(isUnrestricted
      ? {
          company: c.COMPANY + 1,
          industry: c.INDUSTRY + 1,
          city: c.CITY + 1,
          startDate: c.START_DATE + 1,
          contact: c.CONTACT + 1,
          phone: c.PHONE + 1,
          contractValue: c.CONTRACT_VALUE + 1,
          monthlyValue: c.MONTHLY_VALUE + 1,
          services: c.SERVICES + 1,
        }
      : {}),
  }

  for (const [key, col] of Object.entries(map)) {
    if (body[key] !== undefined) {
      const colLetter = colToLetter(col)
      updates.push({ range: `${SHEETS.CLIENT_MASTER}!${colLetter}${rowNum}`, values: [[esc(String(body[key]))]] })
    }
  }

  if (updates.length > 0) {
    await batchUpdate(SHEET_ID, updates)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "Admin" && session.user.role !== "Customer Success") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const rows = await getSheetValues(SHEET_ID, SHEETS.CLIENT_MASTER)
  const rowIndex = rows.slice(1).findIndex((r) => r[COLS.CLIENT.ID] === id)
  if (rowIndex === -1) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  await deleteRow(SHEET_ID, SHEETS.CLIENT_MASTER, rowIndex + 2)

  // Also remove the mirrored row from the Customer Success "Active" sheet, if one
  // exists there. Best-effort: the Client Master row above is already deleted, so
  // don't fail the whole request if this sheet is unreachable.
  try {
    const csRows = await getSheetValues(TESTSHEET_ID, TEST_SHEETS.ACTIVE)
    const csRowIndex = csRows.slice(CS_HEADER_ROWS).findIndex((r) => r[CS_CLIENT_CODE_COL] === id)
    if (csRowIndex !== -1) {
      await deleteRow(TESTSHEET_ID, TEST_SHEETS.ACTIVE, csRowIndex + CS_HEADER_ROWS + 1)
    }
  } catch (err) {
    console.error("[clients DELETE] failed to remove mirrored Active sheet row", err)
  }

  return NextResponse.json({ success: true })
}
