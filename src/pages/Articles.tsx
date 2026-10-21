import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  FileText,
  FileJson,
  Loader2,
  PenLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import SelectField from "@/components/common/SelectField";
import ArticleFormDialog from "@/components/articles/ArticleFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ARTICLE_STATUSES, ARTICLE_TYPES, labelOf, toneOf } from "@/lib/constants";
import { formatRelative, truncate } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import { exportArticleAsJson, exportArticleAsMarkdown } from "@/lib/export-article";
import {
  keywordTermsOf,
  useArticles,
  useDeleteArticle,
  useUpdateArticle,
  type ArticleFilters,
  type ArticleWithRefs,
} from "@/hooks/useArticles";
import { useDocuments } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

const QUICK_STATUS = [
  { value: "", label: "Tất cả" },
  ...ARTICLE_STATUSES.map((status) => ({ value: status.value, label: status.label })),
];

export default function Articles() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ArticleFilters>({ page: 1, pageSize: PAGE_SIZE });
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ArticleWithRefs | null>(null);

  const { data, isLoading, isError, error } = useArticles(filters);
  const { data: documentsData } = useDocuments({ page: 1, pageSize: 100 });
  const deleteArticle = useDeleteArticle();
  const updateArticle = useUpdateArticle();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const documents = documentsData?.items ?? [];

  const patch = (partial: Partial<ArticleFilters>) =>
    setFilters((current) => ({ ...current, ...partial, page: 1 }));

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteArticle.mutateAsync(deleting.id);
      toast.success("Đã xóa bài viết khỏi kho.");
      setDeleting(null);
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Xóa không thành công."));
    }
  };

  const changeStatus = async (article: ArticleWithRefs, status: string) => {
    try {
      await updateArticle.mutateAsync({ id: article.id, patch: { status } });
      toast.success(`Đã chuyển bài viết sang trạng thái "${labelOf(ARTICLE_STATUSES, status)}".`);
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Cập nhật không thành công."));
    }
  };

  const handleExport = (article: ArticleWithRefs, format: "md" | "json") => {
    const payload = {
      title: article.title,
      slug: article.slug,
      metaDescription: article.meta_description,
      contentMd: article.content_md,
      articleType: article.article_type,
      documentTitle: `${article.kt_documents?.doc_number ?? ""} ${article.kt_documents?.title ?? ""}`.trim(),
      keywords: (article.kt_article_keywords ?? [])
        .map((link) => link.kt_keywords?.term)
        .filter(Boolean) as string[],
    };
    if (format === "md") {
      exportArticleAsMarkdown(payload);
    } else {
      exportArticleAsJson(payload);
    }
    toast.success(`Đã xuất file .${format} cho bài viết.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho bài viết"
        description="Nơi soạn, biên tập và theo dõi trạng thái duyệt của từng bài viết trước khi xuất bản."
        icon={FileText}
      >
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Tạo bài viết
        </Button>
      </PageHeader>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 card-shadow">
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_STATUS.map((status) => {
            const isActive = (filters.status ?? "") === status.value;
            return (
              <button
                key={status.value || "all"}
                type="button"
                onClick={() => patch({ status: status.value })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {status.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tìm theo tiêu đề hoặc slug
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search ?? ""}
                onChange={(event) => patch({ search: event.target.value })}
                placeholder="Ví dụ: hạch toán chi phí…"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <SelectField
            label="Loại bài viết"
            value={filters.articleType ?? ""}
            onChange={(value) => patch({ articleType: value })}
            allLabel="Tất cả loại bài"
            options={ARTICLE_TYPES}
          />

          <SelectField
            label="Văn bản nguồn"
            value={filters.documentId ?? ""}
            onChange={(value) => patch({ documentId: value })}
            allLabel="Mọi văn bản nguồn"
            options={documents.map((document) => ({
              value: document.id,
              label: truncate(document.title, 60),
            }))}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 card-shadow">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Không tải được kho bài viết:{" "}
            {error instanceof Error ? error.message : "lỗi không xác định"}
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Chưa có bài viết nào khớp điều kiện"
            description="Tạo bài viết mới, gắn văn bản nguồn và từ khóa chủ đề. Tính năng sinh bài tự động bằng AI sẽ được bổ sung ở giai đoạn sau."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Tạo bài viết
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px]">Bài viết</TableHead>
                    <TableHead className="hidden lg:table-cell">Văn bản nguồn</TableHead>
                    <TableHead className="hidden xl:table-cell">Từ khóa</TableHead>
                    <TableHead className="hidden md:table-cell">Số từ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((article) => (
                    <TableRow
                      key={article.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/articles/${article.id}`)}
                    >
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium leading-snug text-foreground">
                            {truncate(article.title, 100)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {labelOf(ARTICLE_TYPES, article.article_type)} · /{article.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {article.kt_documents
                            ? truncate(article.kt_documents.title, 50)
                            : "Chưa gắn văn bản"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {keywordTermsOf(article) || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {article.word_count.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={labelOf(ARTICLE_STATUSES, article.status)}
                          tone={toneOf(ARTICLE_STATUSES, article.status)}
                        />
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {formatRelative(article.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Biên tập bài viết"
                            onClick={() => navigate(`/articles/${article.id}`)}
                          >
                            <PenLine className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Thêm thao tác"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleExport(article, "md")}>
                                <Download className="mr-2 h-4 w-4" />
                                Xuất file .md
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport(article, "json")}>
                                <FileJson className="mr-2 h-4 w-4" />
                                Xuất file .json
                              </DropdownMenuItem>
                              {ARTICLE_STATUSES.filter(
                                (status) => status.value !== article.status,
                              ).map((status) => (
                                <DropdownMenuItem
                                  key={status.value}
                                  onClick={() => void changeStatus(article, status.value)}
                                >
                                  Chuyển sang: {status.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label="Xóa bài viết"
                            onClick={() => setDeleting(article)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              page={filters.page ?? 1}
              pageSize={filters.pageSize ?? PAGE_SIZE}
              total={total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        )}
      </div>

      {deleteArticle.isPending ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Đang xóa…
        </p>
      ) : null}

      <ArticleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        documents={documents}
        defaultDocumentId={filters.documentId}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xóa bài viết khỏi kho?"
        description={`Bài viết "${deleting?.title ?? ""}" sẽ bị xóa cùng liên kết từ khóa. Thao tác này không thể hoàn tác.`}
        loading={deleteArticle.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
