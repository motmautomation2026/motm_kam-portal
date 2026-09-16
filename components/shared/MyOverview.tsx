"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FeedbackBadge, HealthBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { PageSpinner } from "@/components/shared/Spinner"
import { formatDate, daysSince, parseFlexDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, ChevronRight } from "lucide-react"
import { FeedbackHistoryModal } from "@/components/shared/FeedbackHistoryModal"
import { useClients } from "@/hooks/useClients"
import type { Client } from "@/types/client"
import type { Enquiry } from "@/types/guidance"

const ENQUIRIES_SINCE = new Date(2026, 5, 29) // 29 Jun 2026

interface OverviewData {
  stats: {
    total: number; green: number; orange: number; red: number
    planningToLeave: number; intentToLeave: number; overdueFollowup: number; monthRevenue: number
  }
  criticalClients: Array<{ clientId: string; company: string; kam: string; health: string; feedbackStatus: string; lastFeedbackDate: string; daysSince: number | null }>
  otherClients: Array<{ status: string; clients: Array<{ clientId: string; company: string; kam: string }> }>
  onboardingClients: Array<{ status: string; clients: Array<{ clientId: string; company: string; kam: string }> }>
  enquiriesSince: number | null
}

export default function MyOverview({ title = "Overview" }: { title?: string }) {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["overview"],
    queryFn: () => fetch("/api/overview").then((r) => r.json()),
  })
  const [feedbackClient, setFeedbackClient] = useState<{ clientId: string; company: string } | null>(null)
  const [clientFilter, setClientFilter] = useState<{ title: string; fn: (c: Client) => boolean } | null>(null)
  const [showEnquiries, setShowEnquiries] = useState(false)
  const [open, setOpen] = useState({ critical: true, onboarding: false, other: false })
  const toggle = (key: keyof typeof open) => setOpen((s) => ({ ...s, [key]: !s[key] }))

  const openFilter = (t: string, fn: (c: Client) => boolean) => setClientFilter({ title: t, fn })

  if (isLoading) return <PageSpinner />
  if (!data?.stats) return (
    <div className="text-center py-20 text-slate-400 text-sm">
      Failed to load overview data.{" "}
      <button className="underline" onClick={() => window.location.reload()}>Refresh</button>
    </div>
  )

  const { stats, criticalClients, otherClients = [], onboardingClients = [], enquiriesSince } = data

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">{title}</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Clients" value={stats.total} onClick={() => openFilter("All Active Clients", () => true)} />
        <StatCard label="Green" value={stats.green} color="text-green-600" onClick={() => openFilter("Green Clients", (c) => c.health === "Green")} />
        <StatCard label="Orange" value={stats.orange} color="text-orange-500" onClick={() => openFilter("Orange Clients", (c) => c.health === "Orange")} />
        <StatCard label="Red" value={stats.red} color="text-red-600" onClick={() => openFilter("Red Clients", (c) => c.health === "Red")} />
        <StatCard label="Planning to Leave" value={stats.planningToLeave} warn onClick={() => openFilter("Planning to Leave", (c) => c.feedbackStatus === "Planning to Leave")} />
        <StatCard label="Intent to Leave" value={stats.intentToLeave} danger onClick={() => openFilter("Intent to Leave", (c) => c.feedbackStatus === "Intent to Leave")} />
        <StatCard label="Overdue Follow-up" value={stats.overdueFollowup} warn={stats.overdueFollowup > 0} onClick={() => openFilter("Overdue Follow-up (>7 days)", (c) => { const d = daysSince(c.lastFeedbackDate); return d !== null && d > 7 })} />
        <StatCard label="Month Revenue" value={`₹${(stats.monthRevenue / 100000).toFixed(1)}L`} />
        {enquiriesSince !== null && (
          <StatCard label="Enquiries (since 29 Jun 2026)" value={enquiriesSince} onClick={() => setShowEnquiries(true)} />
        )}
      </div>

      {/* Critical Clients */}
      <div>
        <button onClick={() => toggle("critical")} className="flex items-center gap-2 mb-3 w-full text-left group">
          {open.critical ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <h2 className="text-lg font-semibold text-[#1e3a5f] group-hover:underline">Critical Clients</h2>
          <span className="text-xs text-slate-400">({criticalClients.length} clients)</span>
        </button>
        {open.critical && <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Company", "Health", "Feedback Status", "Last Feedback", "Days"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criticalClients.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-slate-400">No critical clients</td></tr>
              )}
              {criticalClients.map((c) => (
                <tr key={c.clientId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <button onClick={() => setFeedbackClient(c)} className="font-medium text-slate-800 hover:text-[#0369a1] hover:underline text-left">
                      {c.company}
                    </button>
                  </td>
                  <td className="px-3 py-2.5"><HealthBadge health={c.health} /></td>
                  <td className="px-3 py-2.5"><FeedbackBadge status={c.feedbackStatus} /></td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{formatDate(c.lastFeedbackDate)}</td>
                  <td className={`px-3 py-2.5 text-xs font-medium ${(c.daysSince ?? 0) > 14 ? "text-red-600" : "text-orange-500"}`}>
                    {c.daysSince !== null ? `${c.daysSince}d` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      {/* Onboarding Clients */}
      {onboardingClients.length > 0 && (
        <div>
          <button onClick={() => toggle("onboarding")} className="flex items-center gap-2 mb-3 w-full text-left group">
            {open.onboarding ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            <h2 className="text-lg font-semibold text-[#1e3a5f] group-hover:underline">Onboarding Clients</h2>
            <span className="text-xs text-slate-400">({onboardingClients.reduce((s, g) => s + g.clients.length, 0)} clients)</span>
          </button>
          {open.onboarding && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onboardingClients.map((group) => (
              <div key={group.status} className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-700">{group.status}</span>
                  <Badge variant="blue">{group.clients.length}</Badge>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.clients.map((c) => (
                    <div key={c.clientId} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <span className="text-slate-800 font-medium">{c.company}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* Other Clients — Closed / On Hold / On Notice */}
      {otherClients.length > 0 && (
        <div>
          <button onClick={() => toggle("other")} className="flex items-center gap-2 mb-3 w-full text-left group">
            {open.other ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            <h2 className="text-lg font-semibold text-[#1e3a5f] group-hover:underline">Other Clients</h2>
            <span className="text-xs text-slate-400">({otherClients.reduce((s, g) => s + g.clients.length, 0)} clients)</span>
          </button>
          {open.other && <div className="grid grid-cols-1 gap-3">
            {otherClients.map((group) => (
              <div key={group.status} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{group.status}</span>
                  <Badge variant="gray">{group.clients.length}</Badge>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.clients.map((c) => (
                    <div key={c.clientId} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <span className="text-slate-800 font-medium">{c.company}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {feedbackClient && (
        <FeedbackHistoryModal
          clientId={feedbackClient.clientId}
          company={feedbackClient.company}
          onClose={() => setFeedbackClient(null)}
        />
      )}
      {clientFilter && (
        <FilteredClientsModal
          title={clientFilter.title}
          fn={clientFilter.fn}
          onClose={() => setClientFilter(null)}
        />
      )}
      {showEnquiries && <EnquiriesModal onClose={() => setShowEnquiries(false)} />}
    </div>
  )
}

function StatCard({ label, value, color, warn, danger, onClick }: { label: string; value: number | string; color?: string; warn?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${danger ? "border-red-200 bg-red-50" : warn ? "border-yellow-200 bg-yellow-50" : "border-slate-200 bg-white"}`}>
      <div
        className={`text-2xl font-bold ${danger ? "text-red-600" : warn ? "text-yellow-700" : color ?? "text-[#1e3a5f]"} ${onClick ? "cursor-pointer hover:underline" : ""}`}
        onClick={onClick}
      >{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function FilteredClientsModal({ title, fn, onClose }: { title: string; fn: (c: Client) => boolean; onClose: () => void }) {
  const { data: allClients = [] } = useClients()
  const [feedbackClient, setFeedbackClient] = useState<{ clientId: string; company: string } | null>(null)
  const clients = allClients.filter(fn)

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title} <span className="text-slate-400 font-normal text-sm">({clients.length})</span></DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto">
            {clients.length === 0 && <div className="text-sm text-slate-400 py-6 text-center">No clients found.</div>}
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  {["Company", "Health", "Feedback Status", "Days"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const d = daysSince(c.lastFeedbackDate)
                  return (
                    <tr key={c.clientId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <button onClick={() => setFeedbackClient(c)} className="font-medium text-slate-800 hover:text-[#0369a1] hover:underline text-left">
                          {c.company}
                        </button>
                        <div className="text-[10px] text-slate-400">{c.clientId}</div>
                      </td>
                      <td className="px-3 py-2"><HealthBadge health={c.health} /></td>
                      <td className="px-3 py-2"><FeedbackBadge status={c.feedbackStatus} /></td>
                      <td className={`px-3 py-2 text-xs font-medium ${d !== null && d > 7 ? "text-red-600" : "text-slate-500"}`}>
                        {d !== null ? `${d}d` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      {feedbackClient && (
        <FeedbackHistoryModal
          clientId={feedbackClient.clientId}
          company={feedbackClient.company}
          onClose={() => setFeedbackClient(null)}
        />
      )}
    </>
  )
}

function EnquiriesModal({ onClose }: { onClose: () => void }) {
  const { data: allEnquiries = [], isLoading } = useQuery<Enquiry[]>({
    queryKey: ["enquiries"],
    queryFn: () => fetch("/api/enquiries").then((r) => r.json()),
  })
  const enquiries = allEnquiries.filter((e) => {
    const d = parseFlexDate(e.enquiryDate)
    return d !== null && d >= ENQUIRIES_SINCE
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Enquiries since 29 Jun 2026 <span className="text-slate-400 font-normal text-sm">({enquiries.length})</span></DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto">
          {isLoading && <div className="text-sm text-slate-400 py-6 text-center">Loading...</div>}
          {!isLoading && enquiries.length === 0 && <div className="text-sm text-slate-400 py-6 text-center">No enquiries found.</div>}
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                {["Date", "Company", "SE", "Person", "Type", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(e.enquiryDate || e.timestamp)}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{e.company}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{e.seName || e.teamName || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{e.personName}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{e.enquiryType}</td>
                  <td className="px-3 py-2"><Badge variant="gray">{e.status ?? "New"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
