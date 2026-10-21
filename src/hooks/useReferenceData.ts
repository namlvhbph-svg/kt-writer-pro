import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DocTypeRow, TopicGroupRow } from "@/lib/types";

const DOC_TYPES_KEY = ["kt_doc_types"];
const TOPIC_GROUPS_KEY = ["kt_topic_groups"];

export function useDocTypes() {
  return useQuery({
    queryKey: DOC_TYPES_KEY,
    queryFn: async (): Promise<DocTypeRow[]> => {
      const { data, error } = await supabase
        .from("kt_doc_types")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useTopicGroups() {
  return useQuery({
    queryKey: TOPIC_GROUPS_KEY,
    queryFn: async (): Promise<TopicGroupRow[]> => {
      const { data, error } = await supabase
        .from("kt_topic_groups")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useSaveDocType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      code: string;
      name: string;
      doc_group: string;
      sort_order: number;
      is_active: boolean;
    }) => {
      const { id, ...payload } = input;
      const { error } = id
        ? await supabase.from("kt_doc_types").update(payload).eq("id", id)
        : await supabase.from("kt_doc_types").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DOC_TYPES_KEY });
    },
  });
}

export function useDeleteDocType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kt_doc_types").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DOC_TYPES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_documents"] });
    },
  });
}

export function useSaveTopicGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      code: string;
      name: string;
      description?: string | null;
      sort_order: number;
    }) => {
      const { id, ...payload } = input;
      const { error } = id
        ? await supabase.from("kt_topic_groups").update(payload).eq("id", id)
        : await supabase.from("kt_topic_groups").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TOPIC_GROUPS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_documents"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_keywords"] });
    },
  });
}

export function useDeleteTopicGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kt_topic_groups").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TOPIC_GROUPS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["kt_documents"] });
      void queryClient.invalidateQueries({ queryKey: ["kt_keywords"] });
    },
  });
}

export function useSaveSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      base_url?: string | null;
      index_url?: string | null;
      link_filter?: string | null;
      doc_group: string;
      is_active: boolean;
      notes?: string | null;
    }) => {
      const { id, ...payload } = input;
      const { error } = id
        ? await supabase.from("kt_sources").update(payload).eq("id", id)
        : await supabase.from("kt_sources").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kt_sources"] });
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kt_sources").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kt_sources"] });
    },
  });
}
