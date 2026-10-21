import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { KeywordInsert, KeywordRow, KeywordUpdate } from "@/lib/types";

export const KEYWORDS_KEY = ["kt_keywords"];

export type KeywordWithRefs = KeywordRow & {
  kt_topic_groups: { id: string; code: string; name: string } | null;
  kt_document_keywords: { count: number }[];
  kt_article_keywords: { count: number }[];
};

export type KeywordFilters = {
  search?: string;
  topicGroupId?: string;
  keywordType?: string;
  trendFlag?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function sanitizeTerm(term: string): string {
  return term.replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim();
}

export function documentCountOf(keyword: KeywordWithRefs): number {
  return keyword.kt_document_keywords?.[0]?.count ?? 0;
}

export function articleCountOf(keyword: KeywordWithRefs): number {
  return keyword.kt_article_keywords?.[0]?.count ?? 0;
}

export function useKeywords(filters: KeywordFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  return useQuery({
    queryKey: [...KEYWORDS_KEY, filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("kt_keywords")
        .select(
          "*, kt_topic_groups(id, code, name), kt_document_keywords(count), kt_article_keywords(count)",
          { count: "exact" },
        );

      const term = sanitizeTerm(filters.search ?? "");
      if (term) query = query.ilike("term", `%${term}%`);
      if (filters.topicGroupId) query = query.eq("topic_group_id", filters.topicGroupId);
      if (filters.keywordType) query = query.eq("keyword_type", filters.keywordType);
      if (filters.trendFlag) query = query.eq("trend_flag", filters.trendFlag);
      if (filters.status) query = query.eq("status", filters.status);

      const { data, error, count } = await query
        .order("priority", { ascending: true })
        .order("term", { ascending: true })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: (data ?? []) as unknown as KeywordWithRefs[],
        total: count ?? 0,
      };
    },
  });
}

/** Toàn bộ từ khóa đang hoạt động – dùng cho bộ chọn gắn thẻ */
export function useActiveKeywords() {
  return useQuery({
    queryKey: [...KEYWORDS_KEY, "active"],
    queryFn: async (): Promise<KeywordRow[]> => {
      const { data, error } = await supabase
        .from("kt_keywords")
        .select("*")
        .eq("status", "active")
        .order("term", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateKeyword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: KeywordInsert) => {
      const { error } = await supabase.from("kt_keywords").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEYWORDS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}

export function useUpdateKeyword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: KeywordUpdate }) => {
      const { error } = await supabase.from("kt_keywords").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEYWORDS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kt_keywords").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEYWORDS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_documents"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_articles"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}
