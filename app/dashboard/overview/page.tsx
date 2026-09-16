import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import MyOverview from "@/components/shared/MyOverview"

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const title =
    session.user.role === "SE" ? "My Overview" :
    session.user.role === "DR" ? "Team Overview" :
    "My Overview"

  return <MyOverview title={title} />
}
