import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetValues } from "@/lib/sheets"
import { parseClient, parseEnquiry } from "@/lib/sheets-helpers"
import { SHEET_ID, ENQUIRY_SHEET_ID, SHEETS, COLS } from "@/constants"
import { daysSince, parseFlexDate } from "@/lib/utils"

const INACTIVE = ["Closed", "On Hold", "Uncountable"]
const ONBOARDING = ["New", "Pending"]
const ENQUIRIES_SINCE = new Date(2026, 5, 29) // 29 Jun 2026

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const rows = await getSheetValues(SHEET_ID, SHEETS.CLIENT_MASTER)
    const allRows = rows.slice(1).map((r, i) => parseClient(r, i + 2))

    // Same scoping rule as /api/clients: Admin sees everyone, SE sees their own,
    // everyone else (KAM, DR) sees the clients tied to their kamName.
    const scoped =
      session.user.role === "Admin"
        ? allRows
        : session.user.role === "SE"
        ? allRows.filter((c) => c.se === session.user.fullName)
        : allRows.filter((c) => c.kam === session.user.kamName)

    const inactiveExcluded = ["Closed", "Uncountable"]
    const clients = scoped.filter((c) => !inactiveExcluded.includes(c.status))
    const inactiveClients = scoped.filter((c) => INACTIVE.includes(c.status))

    const stats = {
      total: clients.length,
      green: clients.filter((c) => c.health === "Green").length,
      orange: clients.filter((c) => c.health === "Orange").length,
      red: clients.filter((c) => c.health === "Red").length,
      planningToLeave: clients.filter((c) => c.feedbackStatus === "Planning to Leave").length,
      intentToLeave: clients.filter((c) => c.feedbackStatus === "Intent to Leave").length,
      overdueFollowup: clients.filter((c) => {
        const d = daysSince(c.lastFeedbackDate)
        return d !== null && d > 7
      }).length,
      monthRevenue: clients.reduce((sum, c) => sum + (parseFloat(c.monthlyValue) || 0), 0),
    }

    const criticalClients = clients
      .filter((c) => c.health === "Red" || c.feedbackStatus === "Intent to Leave" || c.feedbackStatus === "Planning to Leave")
      .map((c) => ({
        clientId: c.clientId, company: c.company, kam: c.kam, health: c.health,
        feedbackStatus: c.feedbackStatus, lastFeedbackDate: c.lastFeedbackDate,
        daysSince: daysSince(c.lastFeedbackDate),
      }))
      .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0))
      .slice(0, 20)

    const otherClients = INACTIVE.map((status) => ({
      status,
      clients: inactiveClients
        .filter((c) => c.status === status)
        .map((c) => ({ clientId: c.clientId, company: c.company, kam: c.kam })),
    })).filter((g) => g.clients.length > 0)

    const onboardingClients = ONBOARDING.map((status) => ({
      status,
      clients: clients
        .filter((c) => c.status === status)
        .map((c) => ({ clientId: c.clientId, company: c.company, kam: c.kam })),
    })).filter((g) => g.clients.length > 0)

    let enquiriesSince: number | null = null
    if (session.user.role !== "DR") {
      const [enquiryRows, userRows] = await Promise.all([
        getSheetValues(ENQUIRY_SHEET_ID, "Form responses 1"),
        getSheetValues(SHEET_ID, SHEETS.USERS).catch(() => [] as string[][]),
      ])

      const seByEmail: Record<string, string> = {}
      userRows.slice(1).forEach((r) => {
        const email = (r[COLS.USER.EMAIL] ?? "").toLowerCase().trim()
        const role = (r[COLS.USER.ROLE] ?? "").trim()
        const name = (r[COLS.USER.FULL_NAME] ?? "").trim()
        if ((role === "SE" || role === "DR") && email && name) seByEmail[email] = name
      })

      let enquiries = enquiryRows.slice(1)
        .filter((row) => row[COLS.ENQUIRY.CLIENT_CODE])
        .map((row) => {
          const key = `${row[COLS.ENQUIRY.CLIENT_CODE]}-${row[COLS.ENQUIRY.TIMESTAMP]}`
          const base = parseEnquiry(row, key)
          const seEmail = (row[COLS.ENQUIRY.EMAIL] ?? "").toLowerCase().trim()
          return { ...base, seName: seByEmail[seEmail] || seEmail }
        })

      if (session.user.role === "SE") {
        const seName = (session.user.fullName ?? "").trim().toLowerCase()
        enquiries = enquiries.filter((e) => (e.seName ?? "").trim().toLowerCase() === seName)
      } else if (session.user.role !== "Admin") {
        const kamName = (session.user.kamName ?? "").trim().toLowerCase()
        enquiries = enquiries.filter((e) => (e.teamName ?? "").trim().toLowerCase() === kamName)
      }

      enquiriesSince = enquiries.filter((e) => {
        const d = parseFlexDate(e.enquiryDate)
        return d !== null && d >= ENQUIRIES_SINCE
      }).length
    }

    return NextResponse.json({ stats, criticalClients, otherClients, onboardingClients, enquiriesSince })
  } catch (err) {
    console.error("[overview GET]", err)
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 })
  }
}
