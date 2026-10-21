import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
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
import { LEGAL_STATUSES, REVIEW_STATUSES } from "@/lib/constants";
import { fingerprintValue, friendlyDbError } from "@/lib/fingerprint";
import { countWords, toDateInputValue } from "@/lib/format";
import {
  useCreateDocument,
  useUpdateDocument,
  type DocumentWithRefs,
} from "@/hooks/useDocuments";
import type { DocTypeRow, TopicGroupRow } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docTypes: DocTypeRow[];
  topicGroups: TopicGroupRow[];
  document?: DocumentWithRefs | null;
};

type FormState = {
  title: string;
  docNumber: string;
  docTypeId: string;
  topicGroupId: string;
  issuingBody: string;
  issuedDate: string;
  effectiveDate: string;
  expiryDate: string;
  legalStatus: string;
  reviewStatus: string;
  originalUrl: string;
  notes: string;
  rawText: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  docNumber: "",
  docTypeId: "",
  topicGroupId: "",
  issuingBody: "",
  issuedDate: "",
  effectiveDate: "",
  expiryDate: "",
  legalStatus: "khong_xac_dinh",
  reviewStatus: "moi",
  originalUrl: "",
  notes: "",
  rawText: "",
};

export default function DocumentFormDialog({
  open,
  onOpenChange,
  docTypes,
  topicGroups,
  document,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const isEdit = Boolean(document);
  const saving = createDocument.isPending || updateDocument.isPending;

  useEffect(() => {
    if (!open) return;
    if (document) {
      setForm({
        title: document.title,
        docNumber: document.doc_number ?? "",
        docTypeId: document.doc_type_id ?? "",
        topicGroupId: document.topic_group_id ?? "",
        issuingBody: document.issuing_body ?? "",
        issuedDate: toDateInputValue(document.issued_date),
        effectiveDate: toDateInputValue(document.effective_date),
        expiryDate: toDateInputValue(document.expiry_date),
        legalStatus: document.legal_status,
        reviewStatus: document.review_status,
        originalUrl: document.original_url ?? "",
        notes: document.notes ?? "",
        rawText: document.raw_text ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, document]);

  const patch = (partial: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...partial }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề văn bản.");
      return;
    }
    if (!form.rawText.trim()) {
      toast.error("Vui lòng dán nội dung văn bản để lưu vào kho.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      doc_number: form.docNumber.trim() || null,
      doc_type_id: form.docTypeId || null,
      topic_group_id: form.topicGroupId || null,
      issuing_body: form.issuingBody.trim() || null,
      issued_date: form.issuedDate || null,
      effective_date: form.effectiveDate || null,
      expiry_date: form.expiryDate || null,
      legal_status: form.legalStatus,
      review_status: form.reviewStatus,
      original_url: form.originalUrl.trim() || null,
      notes: form.notes.trim() || null,
      raw_text: form.rawText,
      char_count: form.rawText.length,
    };

    try {
      if (document) {
        await updateDocument.mutateAsync({ id: document.id, patch: payload });
        toast.success("Đã cập nhật văn bản.");
      } else {
        const fingerprint = await fingerprintValue(
          `${payload.title}|${payload.doc_number ?? ""}|${payload.original_url ?? "nhap-tay"}`,
        );
        await createDocument.mutateAsync({
          ...payload,
          fingerprint,
          origin: "nhap_tay",
        });
        toast.success("Đã thêm văn bản vào kho.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(friendlyDbError(error instanceof Error ? error.message : "Lưu không thành công."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật văn bản" : "Thêm văn bản vào kho"}</DialogTitle>
          <DialogDescription>
            Dùng cho trường hợp dán nội dung bằng tay. Nếu có file PDF/DOCX/TXT, hãy dùng chức
            năng Tải file lên để hệ thống tự trích văn bản.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title" className="text-xs font-medium text-muted-foreground">
              Tiêu đề văn bản *
            </Label>
            <Input
              id="doc-title"
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="Ví dụ: Thông tư 200/2014/TT-BTC hướng dẫn chế độ kế toán doanh nghiệp"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-number" className="text-xs font-medium text-muted-foreground">
                Số hiệu văn bản
              </Label>
              <Input
                id="doc-number"
                value={form.docNumber}
                onChange={(event) => patch({ docNumber: event.target.value })}
                placeholder="200/2014/TT-BTC"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-issuer" className="text-xs font-medium text-muted-foreground">
                Cơ quan ban hành
              </Label>
              <Input
                id="doc-issuer"
                value={form.issuingBody}
                onChange={(event) => patch({ issuingBody: event.target.value })}
                placeholder="Bộ Tài chính"
              />
            </div>

            <SelectField
              label="Loại văn bản"
              value={form.docTypeId}
              onChange={(value) => patch({ docTypeId: value })}
              placeholder="Chọn loại văn bản"
              options={docTypes.map((item) => ({ value: item.id, label: item.name }))}
            />
            <SelectField
              label="Nhóm chủ đề"
              value={form.topicGroupId}
              onChange={(value) => patch({ topicGroupId: value })}
              placeholder="Chọn nhóm chủ đề"
              options={topicGroups.map((item) => ({ value: item.id, label: item.name }))}
            />

            <div className="space-y-1.5">
              <Label htmlFor="doc-issued" className="text-xs font-medium text-muted-foreground">
                Ngày ban hành
              </Label>
              <Input
                id="doc-issued"
                type="date"
                value={form.issuedDate}
                onChange={(event) => patch({ issuedDate: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-effective" className="text-xs font-medium text-muted-foreground">
                Ngày có hiệu lực
              </Label>
              <Input
                id="doc-effective"
                type="date"
                value={form.effectiveDate}
                onChange={(event) => patch({ effectiveDate: event.target.value })}
              />
            </div>

            <SelectField
              label="Hiệu lực pháp lý"
              value={form.legalStatus}
              onChange={(value) => patch({ legalStatus: value })}
              options={LEGAL_STATUSES}
            />
            <SelectField
              label="Trạng thái xử lý"
              value={form.reviewStatus}
              onChange={(value) => patch({ reviewStatus: value })}
              options={REVIEW_STATUSES}
            />

            <div className="space-y-1.5">
              <Label htmlFor="doc-expiry" className="text-xs font-medium text-muted-foreground">
                Ngày hết hiệu lực (nếu có)
              </Label>
              <Input
                id="doc-expiry"
                type="date"
                value={form.expiryDate}
                onChange={(event) => patch({ expiryDate: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-url" className="text-xs font-medium text-muted-foreground">
                Đường dẫn nguồn
              </Label>
              <Input
                id="doc-url"
                value={form.originalUrl}
                onChange={(event) => patch({ originalUrl: event.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-raw" className="text-xs font-medium text-muted-foreground">
              Nội dung văn bản *
            </Label>
            <Textarea
              id="doc-raw"
              value={form.rawText}
              onChange={(event) => patch({ rawText: event.target.value })}
              placeholder="Dán toàn văn hoặc phần nội dung quan trọng của văn bản…"
              className="min-h-[220px] font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              {form.rawText.length.toLocaleString("vi-VN")} ký tự · {countWords(form.rawText)} từ
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-notes" className="text-xs font-medium text-muted-foreground">
              Ghi chú nội bộ
            </Label>
            <Textarea
              id="doc-notes"
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Điểm cần lưu ý, phạm vi áp dụng, người phụ trách…"
              className="min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEdit ? "Lưu thay đổi" : "Thêm vào kho"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
