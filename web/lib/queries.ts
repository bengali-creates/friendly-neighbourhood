import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = "/api";
const AGENT = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8000";

const get = (url: string) => fetch(url).then((r) => r.json());
const post = (url: string, body: object) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => get(`${API}/alerts`),
    refetchInterval: 30_000,
  });
}

export function useCollectors() {
  return useQuery({
    queryKey: ["collectors"],
    queryFn: () => get(`${API}/collectors`),
    refetchInterval: 60_000,
  });
}

export function useSources(alertId: number | null) {
  return useQuery({
    queryKey: ["sources", alertId],
    queryFn: () => get(`${API}/sources?alert_id=${alertId}`),
    enabled: !!alertId,
  });
}

export function useSnapshots(collectorId: string | null) {
  return useQuery({
    queryKey: ["snapshots", collectorId],
    queryFn: () => get(`${API}/snapshots?collector_id=${collectorId}`),
    enabled: !!collectorId,
  });
}

export function useKeywordSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyword: string) =>
      post(`${AGENT}/search/unified-position`, { keyword }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useWatchUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      url: string;
      name: string;
      source_type: string;
      prompt: string;
    }) => post(`${AGENT}/watch`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collectors"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}


export function useRunAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      collector_id: string;
      url: string;
      source_type: string;
    }) => post(`${AGENT}/run`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useHealAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      collector_id: string;
      url: string;
      issue_description: string;
    }) => post(`${AGENT}/scraper/heal`, { ...body, auto_approve: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collectors"] });
      qc.invalidateQueries({ queryKey: ["heals"] });
    },
  });
}

export function useDeleteCollector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (collectorId: string) =>
      fetch(`${API}/collectors/${collectorId}`, { method: "DELETE" }).then(
        (r) => r.json(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collectors"] }),
  });
}

export function useHeals() {
  return useQuery({
    queryKey: ["heals"],
    queryFn: () => get(`${API}/heals`),
    refetchInterval: 15_000,
  });
}
