import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import MyClientsView from "@/components/clients/MyClientsView"

export default async function AdminKamDashboardPage({ params }: { params: Promise<{ kam: string }> }) {
  const { kam } = await params
  const kamName = decodeURIComponent(kam)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-[#0369a1] hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Overview
        </Link>
      </div>
      <h1 className="text-xl font-bold text-[#1e3a5f]">{kamName}'s Dashboard</h1>
      <MyClientsView kamName={kamName} />
    </div>
  )
}
