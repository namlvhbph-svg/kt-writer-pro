import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  FileText,
  Flame,
  Inbox,
  Library,
  Tags,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import KpiCard from "@/components/dashboard/KpiCard";
import { DocumentsTrendChart, TopicDistributionChart } from "@/components/dashboard/Charts";
import CrawlNowButton from "@/components/documents/CrawlNowButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ARTICLE_STATUSES,
  DOC_ORIGINS,
  EXPIRY_WARNING_DAYS,
  NEW_DOCUMENT_DAYS,
  labelOf,
  toneOf,
} from "@/lib/constants";
import { formatDate, formatRelative, truncate } from "@/lib/format";
import { useDashboardStats } from "@/hooks/useStats";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, error } = useDashboardStats();

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Tổng quan" icon={BarChart3} />
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Không tải được số liệu tổng quan:{" "}
          {error instanceof Error ? error.message : "lỗi không xác định"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan kho dữ liệu"
        description="Bức tranh nhanh về văn bản pháp luật, từ khóa chủ đề và bài viết đang được đội ngũ nội dung khai thác."
        icon={BarChart3}
      >
        <CrawlNowButton label="Quét nguồn tự động" variant="outline" />
        <Button asChild>
          <Link to="/documents">
            <Library className="mr-1.5 h-4 w-4" />
            Vào kho văn bản
          </Link>
        </Button>
      </PageHeader>

      {isLoading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Văn bản trong kho"
              value={stats.documentsTotal.toLocaleString("vi-VN")}
              hint={`${stats.documentsInForce.toLocaleString("vi-VN")} đang còn hiệu lực`}
              icon={Library}
            />
            <KpiCard
              label={`Văn bản mới ${NEW_DOCUMENT_DAYS} ngày`}
              value={stats.documentsNew.toLocaleString("vi-VN")}
              hint={`${stats.documentsPending.toLocaleString("vi-VN")} văn bản chờ xử lý`}
              icon={CalendarClock}
              tone="info"
            />
            <KpiCard
              label="Từ khóa đang theo dõi"
              value={stats.keywordsTotal.toLocaleString("vi-VN")}
              hint={`${stats.keywordsHot.toLocaleString("vi-VN")} từ khóa đang hot`}
              icon={Tags}
              tone="warning"
            />
            <KpiCard
              label="Bài viết trong kho"
              value={stats.articlesTotal.toLocaleString("vi-VN")}
              hint={`${(stats.articlesByStatus.nhap ?? 0).toLocaleString("vi-VN")} bản nháp cần hoàn thiện`}
              icon={FileText}
              tone="success"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-base">
                  Văn bản được đưa vào kho theo tháng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentsTrendChart data={stats.byMonth} />
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-base">Phân bố theo nhóm chủ đề</CardTitle>
              </CardHeader>
              <CardContent>
                <TopicDistributionChart data={stats.byTopic} />
              </CardContent>
            </Card>
          </div>

          {stats.expiringSoon.length > 0 ? (
            <Card className="border-warning/30 card-shadow">
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <CardTitle className="text-base">
                  Văn bản sắp hết hiệu lực trong {EXPIRY_WARNING_DAYS} ngày tới
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.expiringSoon.map((item) => (
                  <Link
                    key={item.id}
                    to={`/documents/${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <span className="truncate text-sm text-foreground">{truncate(item.title, 90)}</span>
                    <span className="shrink-0 text-xs text-warning">
                      {formatDate(item.expiry_date)} · còn {item.daysLeft} ngày
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="card-shadow">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Văn bản mới nhất</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate("/documents")}
                >
                  Xem tất cả
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.recentDocuments.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-6 text-sm text-muted-foreground">
                    <Inbox className="h-4 w-4" />
                    Kho văn bản chưa có dữ liệu. Hãy quét nguồn tự động hoặc tải file lên.
                  </div>
                ) : (
                  stats.recentDocuments.map((document) => (
                    <Link
                      key={document.id}
                      to={`/documents/${document.id}`}
                      className="block rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {truncate(document.title, 90)}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span>{labelOf(DOC_ORIGINS, document.origin)}</span>
                        {document.groupName ? <span>· {document.groupName}</span> : null}
                        <span>· {formatRelative(document.discovered_at)}</span>
                      </p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Bài viết cập nhật gần nhất</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate("/articles")}
                >
                  Xem tất cả
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.recentArticles.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-6 text-sm text-muted-foreground">
                    <Inbox className="h-4 w-4" />
                    Chưa có bài viết nào trong kho.
                  </div>
                ) : (
                  stats.recentArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/articles/${article.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {truncate(article.title, 80)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(article.updated_at)}
                        </p>
                      </div>
                      <StatusBadge
                        label={labelOf(ARTICLE_STATUSES, article.status)}
                        tone={toneOf(ARTICLE_STATUSES, article.status)}
                      />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card card-shadow">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Flame className="h-4 w-4 text-warning" />
              <CardTitle className="text-base">Bước tiếp theo của KT Writer PRO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                Giai đoạn hiện tại đã có kho văn bản, thư viện từ khóa và kho bài viết. Phần sinh
                bài bằng AI, kiểm duyệt chống ảo giác, JSON-LD schema và đăng đa kênh (WordPress,
                social, Telegram) sẽ được bổ sung ở giai đoạn sau trên cùng nền dữ liệu này.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
