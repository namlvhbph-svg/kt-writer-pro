import { useState } from "react";
import { Flame, Loader2, Pencil, Plus, Search, Tags, TrendingUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import SelectField from "@/components/common/SelectField";
import KeywordFormDialog from "@/components/keywords/KeywordFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KEYWORD_TYPES, TREND_FLAGS, labelOf, toneOf } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import { cn } from "@/lib/utils";
import {
  articleCountOf,
  documentCountOf,
  useDeleteKeyword,
  useKeywords,
  type KeywordFilters,
  type KeywordWithRefs,
} from "@/hooks/useKeywords";
import { useTopicGroups } from "@/hooks/useReferenceData";
import type { KeywordRow } from "@/lib/types";

const PAGE_SIZE = 15;

const QUICK_TRENDS = [
  { value: "", label: "Tất cả" },
  { value: "hot", label: "Đang hot" },
  { value: "dang_len", label: "Đang lên" },
];

export default function Keywords() {
  const [filters, setFilters] = useState<KeywordFilters>({ page: 1, pageSize: PAGE_SIZE });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KeywordRow | null>(null);
  const [deleting, setDeleting] = useState<KeywordWithRefs | null>(null);

  const { data: topicGroups = [] } = useTopicGroups();
  const { data, isLoading, isError, error } = useKeywords(filters);
  const deleteKeyword = useDeleteKeyword();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const patch = (partial: Partial<KeywordFilters>) =>
    setFilters((current) => ({ ...current, ...partial, page: 1 }));

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteKeyword.mutateAsync(deleting.id);
      toast.success("Đã xóa từ khóa khỏi thư viện.");
      setDeleting(null);
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Xóa không thành công."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thư viện từ khóa & chủ đề"
        description="Theo dõi các chủ đề kế toán, chính sách thuế và văn bản mới cần khai thác nội dung."
        icon={Tags}
      >
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Thêm từ khóa
        </Button>
      </PageHeader>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 card-shadow">
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_TRENDS.map((trend) => {
            const isActive = (filters.trendFlag ?? "") === trend.value;
            return (
              <button
                key={trend.value || "all"}
                type="button"
                onClick={() => patch({ trendFlag: trend.value })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {trend.value === "hot" ? <Flame className="h-3 w-3" /> : null}
                {trend.value === "dang_len" ? <TrendingUp className="h-3 w-3" /> : null}
                {trend.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tìm từ khóa</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search ?? ""}
                onChange={(event) => patch({ search: event.target.value })}
                placeholder="Ví dụ: thuế TNDN, hóa đơn điện tử…"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <SelectField
            label="Nhóm chủ đề"
            value={filters.topicGroupId ?? ""}
            onChange={(value) => patch({ topicGroupId: value })}
            allLabel="Tất cả nhóm chủ đề"
            options={topicGroups.map((item) => ({ value: item.id, label: item.name }))}
          />

          <SelectField
            label="Loại từ khóa"
            value={filters.keywordType ?? ""}
            onChange={(value) => patch({ keywordType: value })}
            allLabel="Tất cả loại"
            options={KEYWORD_TYPES}
          />

          <SelectField
            label="Trạng thái"
            value={filters.status ?? ""}
            onChange={(value) => patch({ status: value })}
            allLabel="Mọi trạng thái"
            options={[
              { value: "active", label: "Đang theo dõi" },
              { value: "paused", label: "Tạm dừng" },
            ]}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 card-shadow">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Không tải được thư viện từ khóa:{" "}
            {error instanceof Error ? error.message : "lỗi không xác định"}
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Chưa có từ khóa nào khớp điều kiện"
            description="Thêm từ khóa theo nhóm nghiệp vụ để định hướng nội dung. Thư viện đã có sẵn một số chủ đề kế toán – thuế mẫu để bạn bắt đầu."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm từ khóa
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Từ khóa</TableHead>
                    <TableHead className="hidden lg:table-cell">Nhóm chủ đề</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Quan tâm</TableHead>
                    <TableHead className="hidden md:table-cell">Ưu tiên</TableHead>
                    <TableHead className="hidden xl:table-cell">Tìm kiếm/tháng</TableHead>
                    <TableHead>Đang dùng</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{item.term}</p>
                          {item.notes ? (
                            <p className="text-xs text-muted-foreground">{item.notes}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground md:hidden">
                            Ưu tiên {item.priority}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {item.kt_topic_groups?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={labelOf(KEYWORD_TYPES, item.keyword_type)}
                          tone={toneOf(KEYWORD_TYPES, item.keyword_type)}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={labelOf(TREND_FLAGS, item.trend_flag)}
                          tone={toneOf(TREND_FLAGS, item.trend_flag)}
                          icon={item.trend_flag === "hot" ? Flame : undefined}
                        />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {item.priority}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                        {item.monthly_searches
                          ? formatNumber(item.monthly_searches)
                          : "Chưa có số liệu"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {documentCountOf(item)} văn bản · {articleCountOf(item)} bài viết
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Sửa từ khóa"
                            onClick={() => {
                              setEditing(item);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label="Xóa từ khóa"
                            onClick={() => setDeleting(item)}
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

      {deleteKeyword.isPending ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Đang xóa…
        </p>
      ) : null}

      <KeywordFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        topicGroups={topicGroups}
        keyword={editing}
        defaultTopicGroupId={filters.topicGroupId}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xóa từ khóa khỏi thư viện?"
        description={`Từ khóa "${deleting?.term ?? ""}" sẽ bị xóa cùng liên kết tới văn bản và bài viết đang dùng nó. Thao tác này không thể hoàn tác.`}
        loading={deleteKeyword.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
