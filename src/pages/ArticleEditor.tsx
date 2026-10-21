import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import SelectField from "@/components/common/SelectField";
import KeywordPicker from "@/components/common/KeywordPicker";
import MarkdownEditor from "@/components/articles/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ARTICLE_STATUSES, ARTICLE_TYPES, labelOf, toneOf } from "@/lib/constants";
import { countWords, slugify, truncate } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import { exportArticleAsJson, exportArticleAsMarkdown } from "@/lib/export-article";
import {
  useArticle,
  useDeleteArticle,
  useSetArticleKeywords,
  useUpdateArticle,
} from "@/hooks/useArticles";
import { useActiveKeywords } from "@/hooks/useKeywords";
import { useDocument, useDocuments } from "@/hooks/useDocuments";

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading, isError, error } = useArticle(id);
  const { data: allKeywords = [] } = useActiveKeywords();
  const { data: documentsData } = useDocuments({ page: 1, pageSize: 100 });
  const { data: sourceDocument } = useDocument(article?.document_id ?? undefined);
  const updateArticle = useUpdateArticle();
  const setKeywords = useSetArticleKeywords();
  const deleteArticle = useDeleteArticle();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [articleType, setArticleType] = useState("huong-dan");
  const [status, setStatus] = useState("nhap");
  const [documentId, setDocumentId] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!article) return;
    setTitle(article.title);
    setSlug(article.slug);
    setMetaDescription(article.meta_description ?? "");
    setArticleType(article.article_type);
    setStatus(article.status);
    setDocumentId(article.document_id ?? "");
    setContentMd(article.content_md ?? "");
    setSelectedKeywords((article.kt_article_keywords ?? []).map((link) => link.keyword_id));
    setHydrated(true);
  }, [article]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/articles")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Về kho bài viết
        </Button>
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error
            ? `Không tải được bài viết: ${error.message}`
            : "Không tìm thấy bài viết này."}
        </p>
      </div>
    );
  }

  const documents = documentsData?.items ?? [];
  const wordCount = countWords(contentMd);
  const saving = updateArticle.isPending || setKeywords.isPending;

  const exportPayload = {
    title,
    slug,
    metaDescription,
    contentMd,
    articleType,
    documentTitle: sourceDocument
      ? `${sourceDocument.doc_number ?? ""} ${sourceDocument.title}`.trim()
      : null,
    documentUrl: sourceDocument?.original_url ?? null,
    keywords: allKeywords
      .filter((keyword) => selectedKeywords.includes(keyword.id))
      .map((keyword) => keyword.term),
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Tiêu đề bài viết không được để trống.");
      return;
    }
    try {
      await updateArticle.mutateAsync({
        id: article.id,
        patch: {
          title: title.trim(),
          slug: (slug.trim() || slugify(title)) as string,
          meta_description: metaDescription.trim() || null,
          article_type: articleType,
          status,
          document_id: documentId || null,
          content_md: contentMd,
          word_count: wordCount,
        },
      });
      await setKeywords.mutateAsync({ articleId: article.id, keywordIds: selectedKeywords });
      toast.success("Đã lưu bài viết.");
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Lưu không thành công."));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteArticle.mutateAsync(article.id);
      toast.success("Đã xóa bài viết khỏi kho.");
      navigate("/articles");
    } catch (err) {
      toast.error(friendlyDbError(err instanceof Error ? err.message : "Xóa không thành công."));
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => navigate("/articles")}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Về kho bài viết
      </Button>

      <PageHeader
        title="Biên tập bài viết"
        description={`${wordCount.toLocaleString("vi-VN")} từ · cập nhật lần cuối ${new Date(
          article.updated_at,
        ).toLocaleString("vi-VN")}`}
        icon={FileText}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-1.5 h-4 w-4" />
              Xuất file
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                exportArticleAsMarkdown(exportPayload);
                toast.success("Đã xuất file .md");
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Xuất .md (kèm front-matter)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                exportArticleAsJson(exportPayload);
                toast.success("Đã xuất file .json");
              }}
            >
              <FileJson className="mr-2 h-4 w-4" />
              Xuất .json
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          Xóa
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving || !hydrated}>
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Lưu bài viết
        </Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Card className="card-shadow">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="editor-title" className="text-xs font-medium text-muted-foreground">
                  Tiêu đề
                </Label>
                <Input
                  id="editor-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="text-base font-medium"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="editor-slug" className="text-xs font-medium text-muted-foreground">
                    Slug
                  </Label>
                  <Input
                    id="editor-slug"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Meta description ({metaDescription.length}/160)
                  </Label>
                  <Textarea
                    value={metaDescription}
                    onChange={(event) => setMetaDescription(event.target.value)}
                    placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm."
                    className="min-h-[38px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Nội dung bài viết (Markdown)</CardTitle>
              <span className="text-xs text-muted-foreground">
                {wordCount.toLocaleString("vi-VN")} từ
              </span>
            </CardHeader>
            <CardContent>
              <MarkdownEditor
                value={contentMd}
                onChange={setContentMd}
                placeholder={"## Mở bài\n\nNội dung…\n\n## Kết bài\n\nTóm tắt và lưu ý áp dụng."}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-shadow">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Trạng thái duyệt</CardTitle>
              <StatusBadge
                label={labelOf(ARTICLE_STATUSES, status)}
                tone={toneOf(ARTICLE_STATUSES, status)}
              />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Trạng thái"
                value={status}
                onChange={setStatus}
                options={ARTICLE_STATUSES}
              />
              <SelectField
                label="Loại bài viết"
                value={articleType}
                onChange={setArticleType}
                options={ARTICLE_TYPES}
              />
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-base">Văn bản nguồn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SelectField
                label="Chọn văn bản làm căn cứ"
                value={documentId}
                onChange={setDocumentId}
                placeholder="Chưa gắn văn bản nguồn"
                options={documents.map((document) => ({
                  value: document.id,
                  label: document.doc_number
                    ? `${document.doc_number} — ${truncate(document.title, 60)}`
                    : truncate(document.title, 80),
                }))}
              />
              {sourceDocument ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/documents/${sourceDocument.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {truncate(sourceDocument.title, 80)}
                    </Link>
                    {sourceDocument.original_url ? (
                      <a
                        href={sourceDocument.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="inline h-3 w-3" /> nguồn gốc
                      </a>
                    ) : null}
                  </div>
                  <ScrollArea className="h-52 rounded-lg border border-border bg-muted/30 p-3">
                    <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-muted-foreground">
                      {sourceDocument.raw_text.slice(0, 6000)}
                    </pre>
                  </ScrollArea>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa gắn văn bản nguồn. Gắn văn bản để nội dung bài viết có căn cứ pháp lý rõ ràng.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-base">Từ khóa chủ đề</CardTitle>
            </CardHeader>
            <CardContent>
              <KeywordPicker
                options={allKeywords.map((keyword) => ({
                  id: keyword.id,
                  term: keyword.term,
                }))}
                selected={selectedKeywords}
                onChange={setSelectedKeywords}
                placeholder="Gắn từ khóa cho bài viết"
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Từ khóa giúp định hướng nội dung và phục vụ liên kết nội bộ ở giai đoạn sau.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa bài viết khỏi kho?"
        description={`Bài viết "${title}" sẽ bị xóa cùng liên kết từ khóa. Thao tác này không thể hoàn tác.`}
        loading={deleteArticle.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
