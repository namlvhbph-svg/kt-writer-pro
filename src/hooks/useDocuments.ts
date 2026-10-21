import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DocumentInsert, DocumentRow, DocumentUpdate } from "@/lib/types";

export const DOCUMENTS_KEY = ["kt_documents"];

export type DocumentWithRefs = DocumentRow & {
  kt_doc_types: { id: string; code: string; name: string } | null;
  kt_topic_groups: { id: string; code: string; name: string } | null;
  kt_sources: { id: string; name: string } | null;
};

export type DocumentFilters = {
  search?: string;
  docTypeId?: string;
  topicGroupId?: string;
  legalStatus?: string;
  reviewStatus?: string;
  origin?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

/** Bỏ ký tự có thể phá vỡ cú pháp bộ lọc của PostgREST */
function sanitizeTerm(term: string): string {
  return term.replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim();
}

export const DOCUMENT_SELECT =
  "*, kt_doc_types(id, code, name), kt_topic_groups(id, code, name), kt_sources(id, name)";

export function useDocuments(filters: DocumentFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 15;

  return useQuery({
    queryKey: [...DOCUMENTS_KEY, filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("kt_documents")
        .select(DOCUMENT_SELECT, { count: "exact" });

      const term = sanitizeTerm(filters.search ?? "");
      if (term) {
        query = query.or(`title.ilike.%${term}%,doc_number.ilike.%${term}%`);
      }
      if (filters.docTypeId) query = query.eq("doc_type_id", filters.docTypeId);
      if (filters.topicGroupId) {
        query = query.eq("topic_group_id", filters.topicGroupId);
      }
      if (filters.legalStatus) query = query.eq("legal_status", filters.legalStatus);
      if (filters.reviewStatus) {
        query = query.eq("review_status", filters.reviewStatus);
      }
      if (filters.origin) query = query.eq("origin", filters.origin);
      if (filters.dateFrom) query = query.gte("discovered_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("discovered_at", `${filters.dateTo}T23:59:59`);

      const { data, error, count } = await query
        .order("discovered_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: (data ?? []) as unknown as DocumentWithRefs[],
        total: count ?? 0,
      };
    },
  });
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, "detail", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<DocumentWithRefs | null> => {
      const { data, error } = await supabase
        .from("kt_documents")
        .select(DOCUMENT_SELECT)
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as unknown as DocumentWithRefs) ?? null;
    },
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DocumentInsert) => {
      const { data, error } = await supabase
        .from("kt_documents")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: DocumentUpdate }) => {
      const { error } = await supabase
        .from("kt_documents")
        .update(patch)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kt_documents").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_stats"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_keywords"] });
    },
  });
}

/** Từ khóa đang gắn với một văn bản */
export function useDocumentKeywords(documentId?: string) {
  return useQuery({
    queryKey: ["kt_document_keywords", documentId],
    enabled: Boolean(documentId),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("kt_document_keywords")
        .select("keyword_id")
        .eq("document_id", documentId as string);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.keyword_id);
    },
  });
}

export function useSetDocumentKeywords() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      keywordIds,
    }: {
      documentId: string;
      keywordIds: string[];
    }) => {
      const { error: deleteError } = await supabase
        .from("kt_document_keywords")
        .delete()
        .eq("document_id", documentId);
      if (deleteError) throw new Error(deleteError.message);

      if (keywordIds.length === 0) return;

      const { error: insertError } = await supabase
        .from("kt_document_keywords")
        .insert(keywordIds.map((keywordId) => ({ document_id: documentId, keyword_id: keywordId })));
      if (insertError) throw new Error(insertError.message);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: ["kt_document_keywords", variables.documentId],
      });
      void queryClient.invalidateQueries({ queryKey: ["kt_keywords"] });
    },
  });
}
