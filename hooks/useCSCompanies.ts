"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CSCompany } from "@/types/csCompany"

export function useCSCompanies() {
  return useQuery<CSCompany[]>({
    queryKey: ["cs-companies"],
    queryFn: () => fetch("/api/cs-companies").then((r) => r.json()),
    refetchInterval: 20_000,
  })
}

export function useCreateCSCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, string>) =>
      fetch("/api/cs-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-companies"] }),
  })
}

export function useUpdateCSCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clientCode, ...data }: { clientCode: string } & Record<string, string>) =>
      fetch(`/api/cs-companies/${encodeURIComponent(clientCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-companies"] }),
  })
}

export function useDeleteCSCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clientCode: string) =>
      fetch(`/api/cs-companies/${encodeURIComponent(clientCode)}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cs-companies"] }),
  })
}
