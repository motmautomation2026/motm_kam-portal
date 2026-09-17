"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STATUS_OPTIONS } from "@/constants"
import { useKAMNames } from "@/hooks/useKAMNames"
import { useSENames } from "@/hooks/useSENames"
import { useCreateClient } from "@/hooks/useClients"

export default function AddCompanyModal({ onClose }: { onClose: () => void }) {
  const { data: kamNames = [] } = useKAMNames()
  const { data: seNames = [] } = useSENames()
  const createClient = useCreateClient()

  const [form, setForm] = useState({
    clientId: "",
    company: "",
    industry: "",
    city: "",
    status: "New",
    kam: "",
    se: "",
    contact: "",
    phone: "",
    contractValue: "",
    monthlyValue: "",
    services: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setError(null)
    if (!form.clientId.trim() || !form.company.trim()) {
      setError("Client ID and Company are required")
      return
    }
    setSubmitting(true)
    try {
      const res = await createClient.mutateAsync(form)
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Client ID *">
            <Input value={form.clientId} onChange={(e) => set("clientId")(e.target.value)} placeholder="e.g. M593ABC" />
          </Field>
          <Field label="Company *">
            <Input value={form.company} onChange={(e) => set("company")(e.target.value)} />
          </Field>
          <Field label="Industry">
            <Input value={form.industry} onChange={(e) => set("industry")(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set("city")(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={set("status")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="KAM">
            <Select value={form.kam} onValueChange={set("kam")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {kamNames.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="SE">
            <Select value={form.se} onValueChange={set("se")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {seNames.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Contact Person">
            <Input value={form.contact} onChange={(e) => set("contact")(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
          </Field>
          <Field label="Contract Value">
            <Input value={form.contractValue} onChange={(e) => set("contractValue")(e.target.value)} />
          </Field>
          <Field label="Monthly Value">
            <Input value={form.monthlyValue} onChange={(e) => set("monthlyValue")(e.target.value)} />
          </Field>
          <Field label="Services">
            <Input value={form.services} onChange={(e) => set("services")(e.target.value)} />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Adding..." : "Add Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}
