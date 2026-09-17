"use client"
import { useMemo, useState } from "react"
import { useClients, useUpdateClient, useDeleteClient } from "@/hooks/useClients"
import { ClientStatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageSpinner } from "@/components/shared/Spinner"
import { STATUS_OPTIONS } from "@/constants"
import { useKAMNames } from "@/hooks/useKAMNames"
import { useSENames } from "@/hooks/useSENames"
import { Plus, Pencil, Trash2, Check, X, FileText } from "lucide-react"
import AddCompanyModal from "./AddCompanyModal"
import EditCompanyModal from "./EditCompanyModal"
import { useCSCompanies, useCreateCSCompany } from "@/hooks/useCSCompanies"
import { CS_ACTIVE_FIELDS } from "@/constants/csActiveFields"
import type { Client } from "@/types/client"
import type { CSCompany } from "@/types/csCompany"

type EditField = "company" | "status" | "kam" | "se" | "industry" | "city" | "contact" | "phone"

function blankCSCompany(base: { clientCode: string; clientName: string; status: string }): CSCompany {
  const obj: Record<string, string> = {}
  for (const f of CS_ACTIVE_FIELDS) obj[f.key] = ""
  return { rowNum: 0, ...obj, ...base } as CSCompany
}

export default function CSDashboard() {
  const { data: clients, isLoading } = useClients()
  const { data: kamNames = [] } = useKAMNames()
  const { data: seNames = [] } = useSENames()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const { data: csCompanies } = useCSCompanies()
  const createCSCompany = useCreateCSCompany()

  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null)
  const [editingCell, setEditingCell] = useState<{ clientId: string; field: EditField } | null>(null)
  const [draftValue, setDraftValue] = useState("")
  const [csEditTarget, setCsEditTarget] = useState<CSCompany | null>(null)

  const csByCode = useMemo(() => {
    const m = new Map<string, CSCompany>()
    csCompanies?.forEach((c) => m.set(c.clientCode, c))
    return m
  }, [csCompanies])

  // Opens the full "Active" sheet form for a company. If it isn't mirrored into that
  // sheet yet (e.g. it was created before this sheet existed), create it there first.
  const openActiveSheetForm = async (c: Client) => {
    const existing = csByCode.get(c.clientId)
    if (existing) {
      setCsEditTarget(existing)
      return
    }
    await createCSCompany.mutateAsync({ status: c.status, clientCode: c.clientId, clientName: c.company })
    setCsEditTarget(blankCSCompany({ clientCode: c.clientId, clientName: c.company, status: c.status }))
  }

  const filtered = useMemo(() => {
    if (!clients) return []
    if (!search) return clients
    const q = search.toLowerCase()
    return clients.filter((c) => c.company.toLowerCase().includes(q) || c.clientId.toLowerCase().includes(q))
  }, [clients, search])

  const startEdit = (clientId: string, field: EditField, value: string) => {
    setEditingCell({ clientId, field })
    setDraftValue(value)
  }

  const commitEdit = async () => {
    if (!editingCell) return
    await updateClient.mutateAsync({ id: editingCell.clientId, [editingCell.field]: draftValue })
    setEditingCell(null)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteClient.mutateAsync(confirmDelete.clientId)
    setConfirmDelete(null)
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Customer Success — Companies</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Company
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2">
        <Input placeholder="Search company or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-64 text-xs" />
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} companies</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Company/ID", "Industry", "City", "KAM", "SE", "Status", "Contact", "Phone", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400">No companies found</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.clientId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <EditableText
                      value={c.company}
                      editing={editingCell?.clientId === c.clientId && editingCell.field === "company"}
                      draftValue={draftValue}
                      onDraftChange={setDraftValue}
                      onEdit={() => startEdit(c.clientId, "company", c.company)}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                      render={() => (
                        <div>
                          <div className="font-medium text-slate-800">{c.company}</div>
                          <div className="text-[10px] text-slate-400">{c.clientId}</div>
                        </div>
                      )}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <EditableText
                      value={c.industry}
                      editing={editingCell?.clientId === c.clientId && editingCell.field === "industry"}
                      draftValue={draftValue}
                      onDraftChange={setDraftValue}
                      onEdit={() => startEdit(c.clientId, "industry", c.industry)}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <EditableText
                      value={c.city}
                      editing={editingCell?.clientId === c.clientId && editingCell.field === "city"}
                      draftValue={draftValue}
                      onDraftChange={setDraftValue}
                      onEdit={() => startEdit(c.clientId, "city", c.city)}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <EditableSelect
                      value={c.kam}
                      options={kamNames}
                      editing={editingCell?.clientId === c.clientId && editingCell.field === "kam"}
                      onEdit={() => setEditingCell({ clientId: c.clientId, field: "kam" })}
                      onCancel={() => setEditingCell(null)}
                      onChange={(v) => updateClient.mutateAsync({ id: c.clientId, kam: v }).then(() => setEditingCell(null))}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    <EditableSelect
                      value={c.se}
                      options={seNames}
                      editing={editingCell?.clientId === c.clientId && editingCell.field === "se"}
                      onEdit={() => setEditingCell({ clientId: c.clientId, field: "se" })}
                      onCancel={() => setEditingCell(null)}
                      onChange={(v) => updateClient.mutateAsync({ id: c.clientId, se: v }).then(() => setEditingCell(null))}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {editingCell?.clientId === c.clientId && editingCell.field === "status" ? (
                      <Select
                        defaultOpen
                        value={c.status}
                        onValueChange={(v) => updateClient.mutateAsync({ id: c.clientId, status: v }).then(() => setEditingCell(null))}
                        onOpenChange={(open) => { if (!open) setEditingCell(null) }}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent position="item-aligned" className="max-h-[11rem] overflow-y-auto scrollbar-visible">
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1 group">
                        <ClientStatusBadge status={c.status} />
                        <button
                          onClick={() => setEditingCell({ clientId: c.clientId, field: "status" })}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-[#1e3a5f] transition-opacity shrink-0"
                          title="Change status"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    <EditableText
                      value={c.contact}
                      editing={editingCell?.clientId === c.clientId && editingCell.field === "contact"}
                      draftValue={draftValue}
                      onDraftChange={setDraftValue}
                      onEdit={() => startEdit(c.clientId, "contact", c.contact)}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    <EditableText
                      value={c.phone}
                      editing={editingCell?.clientId === c.clientId && editingCell.field === "phone"}
                      draftValue={draftValue}
                      onDraftChange={setDraftValue}
                      onEdit={() => startEdit(c.clientId, "phone", c.phone)}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openActiveSheetForm(c)} title="Fill full details in the Active sheet">
                        <FileText className="h-3.5 w-3.5 mr-1" /> Active Sheet
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => setConfirmDelete(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <AddCompanyModal
          onClose={() => setAddOpen(false)}
          onCreated={(data) => setCsEditTarget(blankCSCompany(data))}
        />
      )}

      {csEditTarget && <EditCompanyModal company={csEditTarget} onClose={() => setCsEditTarget(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h3 className="font-semibold text-slate-800">Delete company?</h3>
            <p className="text-sm text-slate-500">
              This will permanently remove <span className="font-medium">{confirmDelete.company}</span> ({confirmDelete.clientId}) from Client Master. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditableText({
  value, editing, draftValue, onDraftChange, onEdit, onCommit, onCancel, render,
}: {
  value: string
  editing: boolean
  draftValue: string
  onDraftChange: (v: string) => void
  onEdit: () => void
  onCommit: () => void
  onCancel: () => void
  render?: () => React.ReactNode
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={draftValue}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onCommit(); if (e.key === "Escape") onCancel() }}
          className="h-7 w-32 text-xs"
        />
        <button onClick={onCommit} className="text-green-600"><Check className="h-3.5 w-3.5" /></button>
        <button onClick={onCancel} className="text-slate-400"><X className="h-3.5 w-3.5" /></button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 group">
      {render ? render() : <span>{value || "—"}</span>}
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-[#1e3a5f] transition-opacity shrink-0"
        title="Edit"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}

function EditableSelect({
  value, options, editing, onEdit, onCancel, onChange,
}: {
  value: string
  options: string[]
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onChange: (v: string) => void
}) {
  if (editing) {
    return (
      <Select defaultOpen value={value} onValueChange={onChange} onOpenChange={(open) => { if (!open) onCancel() }}>
        <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent position="item-aligned" className="max-h-[11rem] overflow-y-auto scrollbar-visible">
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    )
  }
  return (
    <div className="flex items-center gap-1 group">
      <span>{value || "—"}</span>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-[#1e3a5f] transition-opacity shrink-0"
        title="Change assignment"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}
