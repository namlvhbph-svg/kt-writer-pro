import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SourceRow } from "@/lib/types";

const SOURCES_KEY = ["kt_sources"];

export type CrawlResult = {
  duplicates?: number;
  rejected?: number;
  source_name?: string;
  next_cursor?: { sourceId: string; indexUrl: string; offset: number; links: { url: string; hint: string }[] } | null;
  fetched: number;
  inserted: number;
  skipped: number;
  truncated?: boolean;
  errors?: string[];
};

export function useSources(options?: { activeOnly?: boolean }) {
  const activeOnly = options?.activeOnly ?? false;
  return useQuery({
    queryKey: [...SOURCES_KEY, { activeOnly }],
    queryFn: async (): Promise<SourceRow[]> => {
      let query = supabase.from("kt_sources").select("*");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCrawlSources() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId?: string): Promise<CrawlResult> => {
      const { data: session } = await supabase.auth.getSession();
      const cursorKey = `kt-crawl-v2:${session.session?.user.id ?? "anonymous"}:${sourceId ?? "all"}`;
      let cursor: CrawlResult["next_cursor"] = null;
      try { cursor = JSON.parse(sessionStorage.getItem(cursorKey) ?? "null"); } catch { /* Start a new snapshot. */ }
      const { data, error } = await supabase.functions.invoke("kt-crawl-sources", {
        body: { source_id: sourceId ?? null, cursor },
        headers: { "Content-Type": "application/json" },
      });
      if (error) {
        let message = error.message || "Không gọi được tiến trình quét dữ liệu.";
        if (error.context instanceof Response) {
          const payload = await error.context.json().catch(() => null);
          if (typeof payload?.error === "string") message = payload.error;
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(String(data.error));
      try {
        if (data?.next_cursor) sessionStorage.setItem(cursorKey, JSON.stringify(data.next_cursor));
        else sessionStorage.removeItem(cursorKey);
      } catch { /* Storage unavailable: the next run safely starts over and deduplicates. */ }
      return data as CrawlResult;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SOURCES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_documents"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_topic_groups"] });
    },
  });
}
