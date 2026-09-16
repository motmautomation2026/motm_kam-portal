"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTasks } from "@/hooks/useTasks"
import { useMeetings } from "@/hooks/useMeetings"
import { Badge } from "@/components/ui/badge"
import { FeedbackBadge, HealthBadge, MeetingStatusBadge, PriorityBadge } from "@/components/shared/StatusBadge"
import { PageSpinner } from "@/components/shared/Spinner"
import { formatDate, cn } from "@/lib/utils"
import type { FeedbackEntry } from "@/types/feedback"
import type { Enquiry } from "@/types/guidance"

const TABS = ["Feedback", "Enquiries", "Tasks", "Meetings"] as const
type Tab = (typeof TABS)[number]

export default function KamActivityView({ kamName }: { kamName: string }) {
  const [tab, setTab] = useState<Tab>("Feedback")

  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Feedback" && <FeedbackTab kamName={kamName} />}
      {tab === "Enquiries" && <EnquiriesTab kamName={kamName} />}
      {tab === "Tasks" && <TasksTab kamName={kamName} />}
      {tab === "Meetings" && <MeetingsTab kamName={kamName} />}
    </div>
  )
}

function FeedbackTab({ kamName }: { kamName: string }) {
  const { data: allFeedback, isLoading } = useQuery<FeedbackEntry[]>({
    queryKey: ["feedback"],
    queryFn: () => fetch("/api/feedback").then((r) => r.json()),
  })
  if (isLoading) return <PageSpinner />
  const rows = (Array.isArray(allFeedback) ? allFeedback : []).filter((f) => f.kam === kamName)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">
        Last 30 days · {rows.length} entries
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {["Date", "Company", "SE", "Health", "Feedback Status", "Discussed"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-sm">No feedback in the last 30 days</td></tr>
          )}
          {rows.map((f) => (
            <tr key={f.rowNum} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(f.date)}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{f.company}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{f.seName || "—"}</td>
              <td className="px-3 py-2">{f.healthUpdate ? <HealthBadge health={f.healthUpdate} /> : "—"}</td>
              <td className="px-3 py-2">{f.feedbackStatus ? <FeedbackBadge status={f.feedbackStatus} /> : "—"}</td>
              <td className="px-3 py-2 text-xs text-slate-600 max-w-[280px] truncate">{f.whatDiscussed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EnquiriesTab({ kamName }: { kamName: string }) {
  const { data: allEnquiries, isLoading } = useQuery<Enquiry[]>({
    queryKey: ["enquiries"],
    queryFn: () => fetch("/api/enquiries").then((r) => r.json()),
  })
  if (isLoading) return <PageSpinner />
  const kam = kamName.trim().toLowerCase()
  const rows = (Array.isArray(allEnquiries) ? allEnquiries : []).filter(
    (e) => (e.teamName ?? "").trim().toLowerCase() === kam,
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">{rows.length} enquiries</div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {["Date", "Company", "SE", "Person", "Type", "Status"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-sm">No enquiries found</td></tr>
          )}
          {rows.map((e) => (
            <tr key={e.key} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(e.enquiryDate || e.timestamp)}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{e.company}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{e.seName || "—"}</td>
              <td className="px-3 py-2 text-xs text-slate-700">{e.personName}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{e.enquiryType}</td>
              <td className="px-3 py-2"><Badge variant="gray">{e.status ?? "New"}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TasksTab({ kamName }: { kamName: string }) {
  const { data: tasks = [], isLoading } = useTasks({ kam: kamName, all: "true" })
  if (isLoading) return <PageSpinner />

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">{tasks.length} tasks</div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {["Title", "Company", "Assigned To", "Priority", "Status", "Due Date"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-sm">No tasks found</td></tr>
          )}
          {tasks.map((t) => (
            <tr key={t.taskId} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-medium text-slate-800">{t.title}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{t.company || "—"}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{t.assignedTo || "—"}</td>
              <td className="px-3 py-2"><PriorityBadge priority={t.priority} /></td>
              <td className="px-3 py-2">
                <Badge variant={t.overdue === "YES" ? "red" : "gray"}>{t.status}</Badge>
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">{formatDate(t.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MeetingsTab({ kamName }: { kamName: string }) {
  const { data: meetings = [], isLoading } = useMeetings({ kam: kamName })
  if (isLoading) return <PageSpinner />

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">{meetings.length} meetings</div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {["Date", "Title", "Company", "Type", "Status"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {meetings.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400 text-sm">No meetings found</td></tr>
          )}
          {meetings.map((m) => (
            <tr key={m.meetingId} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(m.date)}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{m.title}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{m.company || "—"}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{m.meetingType || "—"}</td>
              <td className="px-3 py-2"><MeetingStatusBadge status={m.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
