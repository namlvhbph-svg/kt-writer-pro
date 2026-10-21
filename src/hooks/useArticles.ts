import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ArticleInsert, ArticleRow, ArticleUpdate } from "@/lib/types";

export const ARTICLES_KEY = ["kt_articles"];

export type ArticleWithRefs = ArticleRow & {
  kt_documents: { id: string; title: string; doc_number: string | null } | null;
  kt_article_keywords: {
    keyword_id: string;
    kt_keywords: { id: string; term: string } | null;
  }[];
};

export type ArticleFilters = {
  search?: string;
  status?: string;
  articleType?: string;
  documentId?: string;
  page?: number;
  pageSize?: number;
};

const ARTICLE_SELECT =
  "*, kt_documents(id, title, doc_number), kt_article_keywords(keyword_id, kt_keywords(id, term))";

function sanitizeTerm(term: string): string {
  return term.replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim();
}

export function keywordTermsOf(article: ArticleWithRefs): string {
  return (article.kt_article_keywords ?? [])
    .map((link) => link.kt_keywords?.term)
    .filter(Boolean)
    .join(", ");
}

export function useArticles(filters: ArticleFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 15;

  return useQuery({
    queryKey: [...ARTICLES_KEY, filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from("kt_articles").select(ARTICLE_SELECT, { count: "exact" });

      const term = sanitizeTerm(filters.search ?? "");
      if (term) query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.articleType) query = query.eq("article_type", filters.articleType);
      if (filters.documentId) query = query.eq("document_id", filters.documentId);

      const { data, error, count } = await query
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: (data ?? []) as unknown as ArticleWithRefs[],
        total: count ?? 0,
      };
    },
  });
}

export function useArticle(id?: string) {
  return useQuery({
    queryKey: [...ARTICLES_KEY, "detail", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ArticleWithRefs | null> => {
      const { data, error } = await supabase
        .from("kt_articles")
        .select(ARTICLE_SELECT)
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as unknown as ArticleWithRefs) ?? null;
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ArticleInsert) => {
      const { data, error } = await supabase
        .from("kt_articles")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ARTICLES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ArticleUpdate }) => {
      const { error } = await supabase.from("kt_articles").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ARTICLES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kt_articles").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ARTICLES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}

export function useSetArticleKeywords() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      articleId,
      keywordIds,
    }: {
      articleId: string;
      keywordIds: string[];
    }) => {
      const { error: deleteError } = await supabase
        .from("kt_article_keywords")
        .delete()
        .eq("article_id", articleId);
      if (deleteError) throw new Error(deleteError.message);

      if (keywordIds.length === 0) return;

      const { error: insertError } = await supabase
        .from("kt_article_keywords")
        .insert(keywordIds.map((keywordId) => ({ article_id: articleId, keyword_id: keywordId })));
      if (insertError) throw new Error(insertError.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ARTICLES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_keywords"] });
    },
  });
}
