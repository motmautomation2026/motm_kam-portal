"use client"
import { useState } from "react"
import MyClientsView from "@/components/clients/MyClientsView"
import KamActivityView from "./KamActivityView"
import { cn } from "@/lib/utils"

const SECTIONS = ["Clients", "Activity"] as const
type Section = (typeof SECTIONS)[number]

export default function KamDashboard({ kamName }: { kamName: string }) {
  const [section, setSection] = useState<Section>("Clients")

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              section === s
                ? "bg-[#1e3a5f] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {section === "Clients" && <MyClientsView kamName={kamName} />}
      {section === "Activity" && <KamActivityView kamName={kamName} />}
    </div>
  )
}
