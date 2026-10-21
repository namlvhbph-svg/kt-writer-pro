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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import SelectField from "@/components/common/SelectField";
import { DOC_GROUPS } from "@/lib/constants";
import { friendlyDbError } from "@/lib/fingerprint";
import { useSaveSource } from "@/hooks/useReferenceData";
import type { SourceRow } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: SourceRow | null;
};

type FormState = {
  name: string;
  baseUrl: string;
  indexUrl: string;
  linkFilter: string;
  docGroup: string;
  isActive: boolean;
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  baseUrl: "",
  indexUrl: "",
  linkFilter: "",
  docGroup: "ke_toan",
  isActive: false,
  notes: "",
};

export default function SourceFormDialog({ open, onOpenChange, source }: Props) {
  const saveSource = useSaveSource();
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      source
        ? {
            name: source.name,
            baseUrl: source.base_url ?? "",
            indexUrl: source.index_url ?? "",
            linkFilter: source.link_filter ?? "",
            docGroup: source.doc_group,
            isActive: source.is_active,
            notes: source.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, source]);

  const patch = (partial: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...partial }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên nguồn dữ liệu.");
      return;
    }
    if (form.isActive && !form.indexUrl.trim()) {
      toast.error("Nguồn đang bật cần có URL trang danh mục để cào.");
      return;
    }

    try {
      await saveSource.mutateAsync({
        id: source?.id,
        name: form.name.trim(),
        base_url: form.baseUrl.trim() || null,
        index_url: form.indexUrl.trim() || null,
        link_filter: form.linkFilter.trim() || null,
        doc_group: form.docGroup,
        is_active: form.isActive,
        notes: form.notes.trim() || null,
      });
      toast.success(source ? "Đã cập nhật nguồn dữ liệu." : "Đã thêm nguồn dữ liệu.");
      onOpenChange(false);
    } catch (error) {
      toast.error(friendlyDbError(error instanceof Error ? error.message : "Lưu không thành công."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{source ? "Cập nhật nguồn dữ liệu" : "Thêm nguồn dữ liệu"}</DialogTitle>
          <DialogDescription>
            Hệ thống tải trang danh mục, lọc các liên kết chứa chuỗi nhận dạng, rồi lấy toàn văn
            từng văn bản vào kho. Hãy chắc chắn URL thuộc trang công khai.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="source-name" className="text-xs font-medium text-muted-foreground">
              Tên nguồn *
            </Label>
            <Input
              id="source-name"
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="Ví dụ: Bộ Tài chính – Văn bản mới"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="source-base" className="text-xs font-medium text-muted-foreground">
                Tên miền gốc
              </Label>
              <Input
                id="source-base"
                value={form.baseUrl}
                onChange={(event) => patch({ baseUrl: event.target.value })}
                placeholder="https://www.mof.gov.vn"
              />
            </div>
            <SelectField
              label="Nhóm văn bản"
              value={form.docGroup}
              onChange={(value) => patch({ docGroup: value })}
              options={DOC_GROUPS}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source-index" className="text-xs font-medium text-muted-foreground">
              URL trang danh mục
            </Label>
            <Input
              id="source-index"
              value={form.indexUrl}
              onChange={(event) => patch({ indexUrl: event.target.value })}
              placeholder="https://ktkt.uel.edu.vn/chuan-muc-ke-toan-viet-nam-vas2"
            />
            <p className="text-xs text-muted-foreground">
              Ví dụ với nguồn UEL: URL danh mục chuẩn mực kế toán và chuỗi nhận dạng{" "}
              <code className="rounded bg-muted px-1">chuan-muc-</code>.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source-filter" className="text-xs font-medium text-muted-foreground">
              Chuỗi nhận dạng liên kết văn bản
            </Label>
            <Input
              id="source-filter"
              value={form.linkFilter}
              onChange={(event) => patch({ linkFilter: event.target.value })}
              placeholder="Ví dụ: chuan-muc-  /  van-ban"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Bật nguồn này khi quét tự động</p>
              <p className="text-xs text-muted-foreground">
                Nguồn cần có URL danh mục trước khi bật.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => patch({ isActive: checked })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source-notes" className="text-xs font-medium text-muted-foreground">
              Ghi chú
            </Label>
            <Textarea
              id="source-notes"
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Ví dụ: nguồn có thể chặn bot, cần kiểm tra khi lỗi."
              className="min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveSource.isPending}>
              {saveSource.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu nguồn dữ liệu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
