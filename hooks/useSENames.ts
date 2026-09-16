"use client"
import { useQuery } from "@tanstack/react-query"

export function useSENames() {
  return useQuery<string[]>({
    queryKey: ["se-names"],
    queryFn: () => fetch("/api/se-names").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  })
}
