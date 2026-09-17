import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import CSDashboard from "@/components/cs/CSDashboard"

export default async function CSPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "Customer Success") redirect("/dashboard")
  return <CSDashboard />
}
