import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetValues } from "@/lib/sheets"
import { SHEET_ID, SHEETS, COLS } from "@/constants"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await getSheetValues(SHEET_ID, SHEETS.USERS)
  const names = rows
    .slice(1)
    .filter((r) => r[COLS.USER.ROLE] === "SE" && r[COLS.USER.ACTIVE]?.toLowerCase() === "yes" && r[COLS.USER.FULL_NAME])
    .map((r) => r[COLS.USER.FULL_NAME].trim())
    .filter(Boolean)

  return NextResponse.json([...new Set(names)])
}
