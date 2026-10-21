import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SourceRow } from "@/lib/types";

const SOURCES_KEY = ["kt_sources"];

export type CrawlResult = {
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
      const { data, error } = await supabase.functions.invoke("kt-crawl-sources", {
        body: { source_id: sourceId ?? null },
        headers: { "Content-Type": "application/json" },
      });
      if (error) throw new Error(error.message || "Không gọi được tiến trình cào dữ liệu.");
      if (data?.error) throw new Error(String(data.error));
      return data as CrawlResult;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SOURCES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_documents"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}
