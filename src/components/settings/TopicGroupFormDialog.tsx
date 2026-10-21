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
import { friendlyDbError } from "@/lib/fingerprint";
import { useSaveTopicGroup } from "@/hooks/useReferenceData";
import type { TopicGroupRow } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicGroup?: TopicGroupRow | null;
};

export default function TopicGroupFormDialog({ open, onOpenChange, topicGroup }: Props) {
  const saveTopicGroup = useSaveTopicGroup();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  useEffect(() => {
    if (!open) return;
    setCode(topicGroup?.code ?? "");
    setName(topicGroup?.name ?? "");
    setDescription(topicGroup?.description ?? "");
    setSortOrder(String(topicGroup?.sort_order ?? 0));
  }, [open, topicGroup]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast.error("Cần nhập cả mã và tên nhóm chủ đề.");
      return;
    }
    try {
      await saveTopicGroup.mutateAsync({
        id: topicGroup?.id,
        code: code.trim().toUpperCase().replace(/\s+/g, "_"),
        name: name.trim(),
        description: description.trim() || null,
        sort_order: Number(sortOrder) || 0,
      });
      toast.success(topicGroup ? "Đã cập nhật nhóm chủ đề." : "Đã thêm nhóm chủ đề.");
      onOpenChange(false);
    } catch (error) {
      toast.error(friendlyDbError(error instanceof Error ? error.message : "Lưu không thành công."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{topicGroup ? "Cập nhật nhóm chủ đề" : "Thêm nhóm chủ đề"}</DialogTitle>
          <DialogDescription>
            Nhóm chủ đề dùng để gom văn bản và từ khóa theo mảng nghiệp vụ kế toán – thuế.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="topic-code" className="text-xs font-medium text-muted-foreground">
                Mã *
              </Label>
              <Input
                id="topic-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="THUE_TNDN"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic-sort" className="text-xs font-medium text-muted-foreground">
                Thứ tự hiển thị
              </Label>
              <Input
                id="topic-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topic-name" className="text-xs font-medium text-muted-foreground">
              Tên nhóm chủ đề *
            </Label>
            <Input
              id="topic-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Thuế thu nhập doanh nghiệp"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topic-desc" className="text-xs font-medium text-muted-foreground">
              Mô tả
            </Label>
            <Textarea
              id="topic-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Phạm vi nội dung thuộc nhóm này."
              className="min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveTopicGroup.isPending}>
              {saveTopicGroup.isPending ? (
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
