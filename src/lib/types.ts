import type { Database } from "@/integrations/supabase/types";

export type DocTypeRow = Database["public"]["Tables"]["kt_doc_types"]["Row"];
export type TopicGroupRow = Database["public"]["Tables"]["kt_topic_groups"]["Row"];
export type SourceRow = Database["public"]["Tables"]["kt_sources"]["Row"];
export type KeywordRow = Database["public"]["Tables"]["kt_keywords"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["kt_documents"]["Row"];
export type ArticleRow = Database["public"]["Tables"]["kt_articles"]["Row"];

export type DocumentInsert =
  Database["public"]["Tables"]["kt_documents"]["Insert"];
export type DocumentUpdate =
  Database["public"]["Tables"]["kt_documents"]["Update"];
export type KeywordInsert =
  Database["public"]["Tables"]["kt_keywords"]["Insert"];
export type KeywordUpdate =
  Database["public"]["Tables"]["kt_keywords"]["Update"];
export type ArticleInsert =
  Database["public"]["Tables"]["kt_articles"]["Insert"];
export type ArticleUpdate =
  Database["public"]["Tables"]["kt_articles"]["Update"];
export type SourceInsert = Database["public"]["Tables"]["kt_sources"]["Insert"];
export type SourceUpdate = Database["public"]["Tables"]["kt_sources"]["Update"];
