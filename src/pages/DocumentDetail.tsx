import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Pencil,
  Save,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import KeywordPicker from "@/components/common/KeywordPicker";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import DocumentFormDialog from "@/components/documents/DocumentFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import SelectField from "@/components/common/SelectField";
import {
  DOC_ORIGINS,
  LEGAL_STATUSES,
  REVIEW_STATUSES,
  ARTICLE_STATUSES,
  labelOf,
  toneOf,
} from "@/lib/constants";
import { countWords, formatBytes, formatDate, formatDateTime } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import {
  useDeleteDocument,
  useDocument,
  useDocumentKeywords,
  useSetDocumentKeywords,
  useUpdateDocument,
} from "@/hooks/useDocuments";
import { useActiveKeywords } from "@/hooks/useKeywords";
import { useDocTypes, useTopicGroups } from "@/hooks/useReferenceData";
import { useArticles } from "@/hooks/useArticles";

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: document, isLoading, isError, error } = useDocument(id);
  const { data: docTypes = [] } = useDocTypes();
  const { data: topicGroups = [] } = useTopicGroups();
  const { data: allKeywords = [] } = useActiveKeywords();
  const { data: linkedKeywordIds = [] } = useDocumentKeywords(id);
  const setKeywords = useSetDocumentKeywords();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const { data: articlesData } = useArticles({ documentId: id, pageSize: 20 });

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setSelectedKeywords(linkedKeywordIds);
  }, [linkedKeywordIds]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/documents")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Về danh sách
        </Button>
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error
            ? `Không tải được văn bản: ${error.message}`
            : "Không tìm thấy văn bản này trong kho."}
        </p>
      </div>
    );
  }

  const keywordOptions = allKeywords.map((keyword) => ({
    id: keyword.id,
    term: keyword.term,
  }));

  const handleSaveKeywords = async () => {
    try {
      await setKeywords.mutateAsync({
        documentId: document.id,
        keywordIds: selectedKeywords,
      });
      toast.success("Đã cập nhật từ khóa cho văn bản.");
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Lưu không thành công."));
    }
  };

  const quickUpdate = async (patch: Parameters<typeof updateDocument.mutateAsync>[0]["patch"]) => {
    try {
      await updateDocument.mutateAsync({ id: document.id, patch });
      toast.success("Đã cập nhật trạng thái văn bản.");
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Cập nhật không thành công."));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument.mutateAsync(document.id);
      toast.success("Đã xóa văn bản khỏi kho.");
      navigate("/documents");
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Xóa không thành công."));
    }
  };

  const articles = articlesData?.items ?? [];

  const metaRows: { label: string; value: string }[] = [
    { label: "Số hiệu", value: document.doc_number ?? "—" },
    { label: "Loại văn bản", value: document.kt_doc_types?.name ?? "Chưa phân loại" },
    { label: "Nhóm chủ đề", value: document.kt_topic_groups?.name ?? "—" },
    { label: "Cơ quan ban hành", value: document.issuing_body ?? "—" },
    { label: "Ngày ban hành", value: formatDate(document.issued_date) },
    { label: "Ngày có hiệu lực", value: formatDate(document.effective_date) },
    { label: "Ngày hết hiệu lực", value: formatDate(document.expiry_date) },
    { label: "Nguồn dữ liệu", value: document.kt_sources?.name ?? "Nhập thủ công" },
    { label: "Cách nhập kho", value: labelOf(DOC_ORIGINS, document.origin) },
    { label: "Phát hiện lúc", value: formatDateTime(document.discovered_at) },
    { label: "Cập nhật lúc", value: formatDateTime(document.updated_at) },
    {
      label: "File gốc",
      value: document.file_name
        ? `${document.file_name} (${formatBytes(document.file_size)})`
        : "Không có",
    },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => navigate("/documents")}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Về kho văn bản
      </Button>

      <PageHeader
        title={document.title}
        description={`${document.char_count.toLocaleString("vi-VN")} ký tự · ${countWords(
          document.raw_text,
        ).toLocaleString("vi-VN")} từ trong kho ngữ cảnh`}
        icon={FileText}
      >
        {document.original_url ? (
          <Button variant="outline" asChild>
            <a href={document.original_url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Mở nguồn gốc
            </a>
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => setFormOpen(true)}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Sửa
        </Button>
        <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          Xóa
        </Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="card-shadow">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Toàn văn trong kho</CardTitle>
            <StatusBadge
              label={labelOf(LEGAL_STATUSES, document.legal_status)}
              tone={toneOf(LEGAL_STATUSES, document.legal_status)}
            />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[560px] rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
                {document.raw_text || "(Chưa có nội dung)"}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-base">Trạng thái nghiệp vụ</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Trạng thái xử lý"
                value={document.review_status}
                onChange={(value) => void quickUpdate({ review_status: value })}
                options={REVIEW_STATUSES}
                disabled={updateDocument.isPending}
              />
              <SelectField
                label="Hiệu lực pháp lý"
                value={document.legal_status}
                onChange={(value) => void quickUpdate({ legal_status: value })}
                options={LEGAL_STATUSES}
                disabled={updateDocument.isPending}
              />
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tags className="h-4 w-4 text-primary" />
                Từ khóa chủ đề
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <KeywordPicker
                options={keywordOptions}
                selected={selectedKeywords}
                onChange={setSelectedKeywords}
                placeholder="Gắn từ khóa cho văn bản này"
              />
              <Button
                size="sm"
                onClick={() => void handleSaveKeywords()}
                disabled={
                  setKeywords.isPending ||
                  selectedKeywords.length === linkedKeywordIds.length &&
                    selectedKeywords.every((item) => linkedKeywordIds.includes(item))
                }
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Lưu từ khóa
              </Button>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Thông tin văn bản
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
                {metaRows.map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="truncate text-sm text-foreground" title={row.value}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {document.notes ? (
                <p className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {document.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-base">
                Bài viết gắn với văn bản ({articlesData?.total ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {articles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có bài viết nào được gắn văn bản nguồn này. Tính năng sinh bài tự động sẽ bổ
                  sung ở giai đoạn sau.
                </p>
              ) : (
                <ul className="space-y-2">
                  {articles.map((article) => (
                    <li key={article.id} className="flex items-center justify-between gap-3">
                      <Link
                        to={`/articles/${article.id}`}
                        className="truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {article.title}
                      </Link>
                      <StatusBadge
                        label={labelOf(ARTICLE_STATUSES, article.status)}
                        tone={toneOf(ARTICLE_STATUSES, article.status)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        docTypes={docTypes}
        topicGroups={topicGroups}
        document={document}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa văn bản khỏi kho?"
        description={`Văn bản "${document.title}" sẽ bị xóa cùng các liên kết từ khóa. Thao tác này không thể hoàn tác.`}
        loading={deleteDocument.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
