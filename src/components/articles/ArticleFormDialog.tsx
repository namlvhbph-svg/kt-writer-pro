import { useEffect, useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SelectField from "@/components/common/SelectField";
import { ARTICLE_STATUSES, ARTICLE_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import { useCreateArticle } from "@/hooks/useArticles";
import type { DocumentRow } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentRow[];
  defaultDocumentId?: string;
};

export default function ArticleFormDialog({
  open,
  onOpenChange,
  documents,
  defaultDocumentId,
}: Props) {
  const navigate = useNavigate();
  const createArticle = useCreateArticle();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [articleType, setArticleType] = useState("huong-dan");
  const [documentId, setDocumentId] = useState("");
  const [status, setStatus] = useState("nhap");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setArticleType("huong-dan");
    setDocumentId(defaultDocumentId ?? "");
    setStatus("nhap");
    setMetaDescription("");
  }, [open, defaultDocumentId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    try {
      const created = await createArticle.mutateAsync({
        title: title.trim(),
        slug: (slug.trim() || slugify(title)) as string,
        article_type: articleType,
        document_id: documentId || null,
        status,
        meta_description: metaDescription.trim() || null,
        content_md: "",
        word_count: 0,
        origin: "thu_cong",
      });
      toast.success("Đã tạo bài viết mới. Hãy soạn nội dung.");
      onOpenChange(false);
      if (created?.id) navigate(`/articles/${created.id}`);
    } catch (error) {
      toast.error(friendlyDbError(error instanceof Error ? error.message : "Tạo bài thất bại."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo bài viết mới</DialogTitle>
          <DialogDescription>
            Bài viết được lưu vào kho ở trạng thái bạn chọn. Nội dung sẽ soạn ở bước tiếp theo,
            với văn bản nguồn làm căn cứ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="article-title" className="text-xs font-medium text-muted-foreground">
              Tiêu đề bài viết *
            </Label>
            <Input
              id="article-title"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Ví dụ: Hướng dẫn hạch toán chi phí theo Thông tư 200"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-slug" className="text-xs font-medium text-muted-foreground">
              Đường dẫn (slug)
            </Label>
            <Input
              id="article-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              placeholder="huong-dan-hach-toan-chi-phi"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Loại bài viết"
              value={articleType}
              onChange={setArticleType}
              options={ARTICLE_TYPES}
            />
            <SelectField
              label="Trạng thái ban đầu"
              value={status}
              onChange={setStatus}
              options={ARTICLE_STATUSES}
            />
          </div>

          <SelectField
            label="Văn bản nguồn"
            value={documentId}
            onChange={setDocumentId}
            placeholder="Chọn văn bản làm căn cứ nội dung"
            options={documents.map((document) => ({
              value: document.id,
              label: document.doc_number
                ? `${document.doc_number} — ${document.title.slice(0, 70)}`
                : document.title.slice(0, 90),
            }))}
          />

          <div className="space-y-1.5">
            <Label htmlFor="article-meta" className="text-xs font-medium text-muted-foreground">
              Meta description
            </Label>
            <Textarea
              id="article-meta"
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
              placeholder="Mô tả 150–160 ký tự dùng cho SEO."
              className="min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createArticle.isPending}>
              {createArticle.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="mr-2 h-4 w-4" />
              )}
              Tạo và soạn nội dung
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
