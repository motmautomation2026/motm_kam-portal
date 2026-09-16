import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetValues } from "@/lib/sheets"
import { parseClient } from "@/lib/sheets-helpers"
import { SHEET_ID, SHEETS } from "@/constants"
import { daysSince } from "@/lib/utils"

const INACTIVE = ["Closed", "On Hold", "Uncountable"]
const ONBOARDING = ["New", "Pending"]

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

    return NextResponse.json({ stats, criticalClients, otherClients, onboardingClients })
  } catch (err) {
    console.error("[overview GET]", err)
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 })
  }
}
