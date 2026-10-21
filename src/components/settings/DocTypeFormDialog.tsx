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
import SelectField from "@/components/common/SelectField";
import { DOC_GROUPS } from "@/lib/constants";
import { friendlyDbError } from "@/lib/fingerprint";
import { useSaveDocType } from "@/hooks/useReferenceData";
import type { DocTypeRow } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType?: DocTypeRow | null;
};

export default function DocTypeFormDialog({ open, onOpenChange, docType }: Props) {
  const saveDocType = useSaveDocType();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [docGroup, setDocGroup] = useState("ke_toan");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setCode(docType?.code ?? "");
    setName(docType?.name ?? "");
    setDocGroup(docType?.doc_group ?? "ke_toan");
    setSortOrder(String(docType?.sort_order ?? 0));
    setIsActive(docType?.is_active ?? true);
  }, [open, docType]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast.error("Cần nhập cả mã và tên loại văn bản.");
      return;
    }
    try {
      await saveDocType.mutateAsync({
        id: docType?.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        doc_group: docGroup,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      });
      toast.success(docType ? "Đã cập nhật loại văn bản." : "Đã thêm loại văn bản.");
      onOpenChange(false);
    } catch (error) {
      toast.error(friendlyDbError(error instanceof Error ? error.message : "Lưu không thành công."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{docType ? "Cập nhật loại văn bản" : "Thêm loại văn bản"}</DialogTitle>
          <DialogDescription>
            Phân loại văn bản giúp lọc nhanh trong kho và định hình nội dung bài viết.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doctype-code" className="text-xs font-medium text-muted-foreground">
                Mã *
              </Label>
              <Input
                id="doctype-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="TT200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doctype-sort" className="text-xs font-medium text-muted-foreground">
                Thứ tự hiển thị
              </Label>
              <Input
                id="doctype-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doctype-name" className="text-xs font-medium text-muted-foreground">
              Tên loại văn bản *
            </Label>
            <Input
              id="doctype-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Thông tư 200/2014/TT-BTC"
            />
          </div>

          <SelectField
            label="Nhóm văn bản"
            value={docGroup}
            onChange={setDocGroup}
            options={DOC_GROUPS}
          />

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-sm font-medium">Đang sử dụng</p>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveDocType.isPending}>
              {saveDocType.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
