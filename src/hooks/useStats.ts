import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { EXPIRY_WARNING_DAYS, NEW_DOCUMENT_DAYS } from "@/lib/constants";
import { useTopicGroups } from "./useReferenceData";

export type MonthBucket = { key: string; label: string; count: number };
export type TopicBucket = { id: string; name: string; count: number };
export type ExpiringDocument = {
  id: string;
  title: string;
  expiry_date: string | null;
  daysLeft: number;
};
export type RecentDocument = {
  id: string;
  title: string;
  discovered_at: string | null;
  origin: string;
  groupName: string | null;
};
export type RecentArticle = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

export type DashboardStats = {
  documentsTotal: number;
  documentsNew: number;
  documentsPending: number;
  documentsInForce: number;
  keywordsTotal: number;
  keywordsHot: number;
  articlesTotal: number;
  articlesByStatus: Record<string, number>;
  byMonth: MonthBucket[];
  byTopic: TopicBucket[];
  expiringSoon: ExpiringDocument[];
  recentDocuments: RecentDocument[];
  recentArticles: RecentArticle[];
};

type CountedTable = "kt_documents" | "kt_keywords" | "kt_articles";

type CountFilter = {
  op: "eq" | "gte" | "lt";
  column: string;
  value: string;
};

async function countOf(table: CountedTable, filters: CountFilter[] = []): Promise<number> {
  // Select each concrete table before sharing filters to avoid recursive union inference.
  type CountQuery = PromiseLike<{ count: number | null; error: { message: string } | null }> & {
    eq: (column: string, value: string) => CountQuery;
    gte: (column: string, value: string) => CountQuery;
    lt: (column: string, value: string) => CountQuery;
  };
  const options = { count: "exact" as const, head: true };
  let query = (table === "kt_documents"
    ? supabase.from("kt_documents").select("id", options)
    : table === "kt_keywords"
      ? supabase.from("kt_keywords").select("id", options)
      : supabase.from("kt_articles").select("id", options)) as unknown as CountQuery;
  for (const filter of filters) {
    if (filter.op === "eq") {
      query = query.eq(filter.column, filter.value);
    } else if (filter.op === "gte") {
      query = query.gte(filter.column, filter.value);
    } else {
      query = query.lt(filter.column, filter.value);
    }
  }
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

type RecentDocumentQueryRow = {
  id: string;
  title: string;
  discovered_at: string | null;
  origin: string;
  kt_topic_groups: { name: string } | null;
};

function daysBetween(target: string, today: Date): number {
  const date = new Date(`${target}T00:00:00`);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export function useDashboardStats() {
  const { data: topicGroups } = useTopicGroups();
  const topicGroupIds = (topicGroups ?? []).map((group) => group.id).join(",");

  return useQuery({
    queryKey: ["kt_stats", topicGroupIds],
    enabled: Boolean(topicGroups),
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const newSince = new Date(now.getTime() - NEW_DOCUMENT_DAYS * 86400000).toISOString();
      const todayIso = format(now, "yyyy-MM-dd");
      const expiryLimit = format(
        new Date(now.getTime() + EXPIRY_WARNING_DAYS * 86400000),
        "yyyy-MM-dd",
      );

      const monthStarts = Array.from({ length: 12 }, (_, index) =>
        startOfMonth(subMonths(now, 11 - index)),
      );

      const [
        documentsTotal,
        documentsNew,
        documentsPending,
        documentsInForce,
        keywordsTotal,
        keywordsHot,
        articlesTotal,
        articleStatusRows,
        monthCounts,
        topicCounts,
        expiringResult,
        recentDocumentsResult,
        recentArticlesResult,
      ] = await Promise.all([
        countOf("kt_documents"),
        countOf("kt_documents", [
          { op: "gte", column: "discovered_at", value: newSince },
        ]),
        countOf("kt_documents", [
          { op: "eq", column: "review_status", value: "moi" },
        ]),
        countOf("kt_documents", [
          { op: "eq", column: "legal_status", value: "con_hieu_luc" },
        ]),
        countOf("kt_keywords"),
        countOf("kt_keywords", [{ op: "eq", column: "trend_flag", value: "hot" }]),
        countOf("kt_articles"),
        supabase.from("kt_articles").select("status"),
        Promise.all(
          monthStarts.map((start) => {
            const end = startOfMonth(subMonths(start, -1));
            return countOf("kt_documents", [
              { op: "gte", column: "discovered_at", value: start.toISOString() },
              { op: "lt", column: "discovered_at", value: end.toISOString() },
            ]);
          }),
        ),
        Promise.all(
          (topicGroups ?? []).map((group) =>
            countOf("kt_documents", [
              { op: "eq", column: "topic_group_id", value: group.id },
            ]),
          ),
        ),
        supabase
          .from("kt_documents")
          .select("id, title, expiry_date")
          .not("expiry_date", "is", null)
          .gte("expiry_date", todayIso)
          .lte("expiry_date", expiryLimit)
          .order("expiry_date", { ascending: true })
          .limit(5),
        supabase
          .from("kt_documents")
          .select("id, title, discovered_at, origin, kt_topic_groups(name)")
          .order("discovered_at", { ascending: false })
          .limit(5),
        supabase
          .from("kt_articles")
          .select("id, title, status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

      const articlesByStatus: Record<string, number> = {};
      for (const row of articleStatusRows.data ?? []) {
        articlesByStatus[row.status] = (articlesByStatus[row.status] ?? 0) + 1;
      }

      const recentDocumentRows =
        (recentDocumentsResult.data ?? []) as unknown as RecentDocumentQueryRow[];

      return {
        documentsTotal,
        documentsNew,
        documentsPending,
        documentsInForce,
        keywordsTotal,
        keywordsHot,
        articlesTotal,
        articlesByStatus,
        byMonth: monthStarts.map((start, index) => ({
          key: format(start, "yyyy-MM"),
          label: format(start, "MM/yy", { locale: vi }),
          count: monthCounts[index],
        })),
        byTopic: (topicGroups ?? []).map((group, index) => ({
          id: group.id,
          name: group.name,
          count: topicCounts[index],
        })),
        expiringSoon: (expiringResult.data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          expiry_date: row.expiry_date,
          daysLeft: row.expiry_date ? daysBetween(row.expiry_date, now) : 0,
        })),
        recentDocuments: recentDocumentRows.map((row) => ({
          id: row.id,
          title: row.title,
          discovered_at: row.discovered_at,
          origin: row.origin,
          groupName: row.kt_topic_groups?.name ?? null,
        })),
        recentArticles: (recentArticlesResult.data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          updated_at: row.updated_at,
        })),
      };
    },
  });
}
