import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ExternalLink,
  FileUp,
  Library,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import DocumentFiltersPanel from "@/components/documents/DocumentFilters";
import DocumentFormDialog from "@/components/documents/DocumentFormDialog";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import CrawlNowButton from "@/components/documents/CrawlNowButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DOC_ORIGINS,
  LEGAL_STATUSES,
  REVIEW_STATUSES,
  labelOf,
  toneOf,
} from "@/lib/constants";
import { formatDate, truncate } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import {
  useDeleteDocument,
  useDocuments,
  type DocumentFilters,
  type DocumentWithRefs,
} from "@/hooks/useDocuments";
import { useDocTypes, useTopicGroups } from "@/hooks/useReferenceData";

const PAGE_SIZE = 15;

export default function Documents() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DocumentFilters>({ page: 1, pageSize: PAGE_SIZE });
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentWithRefs | null>(null);
  const [deleting, setDeleting] = useState<DocumentWithRefs | null>(null);

  const { data: docTypes = [] } = useDocTypes();
  const { data: topicGroups = [] } = useTopicGroups();
  const { data, isLoading, isError, error } = useDocuments(filters);
  const deleteDocument = useDeleteDocument();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDocument.mutateAsync(deleting.id);
      toast.success("Đã xóa văn bản khỏi kho.");
      setDeleting(null);
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Xóa không thành công."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho văn bản pháp luật"
        description="Nơi lưu toàn văn các văn bản kế toán – thuế làm ngữ cảnh cho việc biên tập nội dung về sau."
        icon={Library}
      >
        <CrawlNowButton label="Quét nguồn tự động" variant="outline" />
        <Button variant="outline" onClick={() => setUploadOpen(true)}>
          <FileUp className="mr-1.5 h-4 w-4" />
          Tải file lên
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Thêm văn bản
        </Button>
      </PageHeader>

      <DocumentFiltersPanel
        filters={filters}
        onChange={setFilters}
        docTypes={docTypes}
        topicGroups={topicGroups}
      />

      <div className="rounded-xl border border-border bg-card p-4 card-shadow">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Không tải được danh sách văn bản: {error instanceof Error ? error.message : "lỗi không xác định"}
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Library}
            title="Kho văn bản đang trống"
            description="Bắt đầu bằng cách quét nguồn tự động (ví dụ nguồn UEL đã cấu hình sẵn), tải file văn bản lên, hoặc thêm văn bản bằng tay."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <CrawlNowButton label="Quét nguồn tự động" variant="default" />
                <Button variant="outline" onClick={() => setUploadOpen(true)}>
                  <Upload className="mr-1.5 h-4 w-4" />
                  Tải file lên
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[320px]">Văn bản</TableHead>
                    <TableHead className="hidden lg:table-cell">Nhóm chủ đề</TableHead>
                    <TableHead>Hiệu lực</TableHead>
                    <TableHead>Xử lý</TableHead>
                    <TableHead className="hidden md:table-cell">Cách nhập</TableHead>
                    <TableHead className="hidden xl:table-cell">Phát hiện</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/documents/${item.id}`)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium leading-snug text-foreground">
                            {truncate(item.title, 110)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.doc_number ? `${item.doc_number} · ` : ""}
                            {item.kt_doc_types?.name ?? "Chưa phân loại"}
                            {" · "}
                            {item.char_count.toLocaleString("vi-VN")} ký tự
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {item.kt_topic_groups?.name ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={labelOf(LEGAL_STATUSES, item.legal_status)}
                          tone={toneOf(LEGAL_STATUSES, item.legal_status)}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={labelOf(REVIEW_STATUSES, item.review_status)}
                          tone={toneOf(REVIEW_STATUSES, item.review_status)}
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {labelOf(DOC_ORIGINS, item.origin)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                        {formatDate(item.discovered_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.original_url ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                              aria-label="Mở nguồn gốc"
                            >
                              <a href={item.original_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Sửa văn bản"
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
                            aria-label="Xóa văn bản"
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

      {deleteDocument.isPending ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Đang xóa…
        </p>
      ) : null}

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        docTypes={docTypes}
        topicGroups={topicGroups}
        document={editing}
      />

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        docTypes={docTypes}
        topicGroups={topicGroups}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xóa văn bản khỏi kho?"
        description={`Văn bản "${deleting?.title ?? ""}" sẽ bị xóa khỏi kho dữ liệu cùng các liên kết từ khóa của nó. Thao tác này không thể hoàn tác.`}
        loading={deleteDocument.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
