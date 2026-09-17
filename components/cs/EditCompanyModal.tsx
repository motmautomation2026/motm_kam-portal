"use client"
import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STATUS_OPTIONS } from "@/constants"
import { CS_ACTIVE_FIELDS } from "@/constants/csActiveFields"
import { useUpdateCSCompany } from "@/hooks/useCSCompanies"
import type { CSCompany } from "@/types/csCompany"

export default function EditCompanyModal({ company, onClose }: { company: CSCompany; onClose: () => void }) {
  const updateCompany = useUpdateCSCompany()
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of CS_ACTIVE_FIELDS) init[f.key] = String(company[f.key] ?? "")
    return init
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const sections = useMemo(() => {
    const bySection = new Map<string, typeof CS_ACTIVE_FIELDS>()
    for (const f of CS_ACTIVE_FIELDS) {
      if (f.key === "clientCode") continue // join key — not editable
      if (!bySection.has(f.section)) bySection.set(f.section, [])
      bySection.get(f.section)!.push(f)
    }
    return [...bySection.entries()]
  }, [])

  const set = (key: string) => (value: string) => setValues((v) => ({ ...v, [key]: value }))

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const res = await updateCompany.mutateAsync({ clientCode: company.clientCode, ...values })
      if (res?.error) {
        setError(res.error)
        return
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company.clientName} <span className="text-slate-400 font-normal text-sm">({company.clientCode})</span></DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {sections.map(([section, fields]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{section}</h3>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => (
                  <label key={f.key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">{f.label}</span>
                    {f.key === "status" ? (
                      <Select value={values.status} onValueChange={set("status")}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : f.options ? (
                      <Select value={values[f.key]} onValueChange={set(f.key)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={values[f.key]} onChange={(e) => set(f.key)(e.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
