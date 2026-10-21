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
import {
  KEYWORD_STATUSES,
  KEYWORD_TYPES,
  PRIORITY_OPTIONS,
  TREND_FLAGS,
} from "@/lib/constants";
import { parseNumberInput } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import { useCreateKeyword, useUpdateKeyword } from "@/hooks/useKeywords";
import type { KeywordRow, TopicGroupRow } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicGroups: TopicGroupRow[];
  keyword?: KeywordRow | null;
  defaultTopicGroupId?: string;
};

type FormState = {
  term: string;
  topicGroupId: string;
  keywordType: string;
  trendFlag: string;
  priority: string;
  monthlySearches: string;
  status: string;
  notes: string;
};

export default function KeywordFormDialog({
  open,
  onOpenChange,
  topicGroups,
  keyword,
  defaultTopicGroupId,
}: Props) {
  const createKeyword = useCreateKeyword();
  const updateKeyword = useUpdateKeyword();
  const saving = createKeyword.isPending || updateKeyword.isPending;
  const isEdit = Boolean(keyword);

  const [form, setForm] = useState<FormState>({
    term: "",
    topicGroupId: "",
    keywordType: "primary",
    trendFlag: "on_dinh",
    priority: "3",
    monthlySearches: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    if (keyword) {
      setForm({
        term: keyword.term,
        topicGroupId: keyword.topic_group_id ?? "",
        keywordType: keyword.keyword_type,
        trendFlag: keyword.trend_flag,
        priority: String(keyword.priority ?? 3),
        monthlySearches: keyword.monthly_searches ? String(keyword.monthly_searches) : "",
        status: keyword.status,
        notes: keyword.notes ?? "",
      });
    } else {
      setForm({
        term: "",
        topicGroupId: defaultTopicGroupId ?? "",
        keywordType: "primary",
        trendFlag: "on_dinh",
        priority: "3",
        monthlySearches: "",
        status: "active",
        notes: "",
      });
    }
  }, [open, keyword, defaultTopicGroupId]);

  const patch = (partial: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...partial }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const term = form.term.trim();
    if (!term) {
      toast.error("Vui lòng nhập từ khóa.");
      return;
    }

    const payload = {
      term,
      topic_group_id: form.topicGroupId || null,
      keyword_type: form.keywordType,
      trend_flag: form.trendFlag,
      priority: Number(form.priority),
      monthly_searches: parseNumberInput(form.monthlySearches),
      status: form.status,
      notes: form.notes.trim() || null,
    };

    try {
      if (keyword) {
        await updateKeyword.mutateAsync({ id: keyword.id, patch: payload });
        toast.success("Đã cập nhật từ khóa.");
      } else {
        await createKeyword.mutateAsync({ ...payload, origin: "thu_cong" });
        toast.success("Đã thêm từ khóa vào thư viện.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(friendlyDbError(error instanceof Error ? error.message : "Lưu không thành công."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật từ khóa" : "Thêm từ khóa chủ đề"}</DialogTitle>
          <DialogDescription>
            Từ khóa dùng để định hướng chủ đề bài viết và theo dõi mức độ quan tâm theo từng nhóm
            nghiệp vụ kế toán – thuế.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="keyword-term" className="text-xs font-medium text-muted-foreground">
              Từ khóa *
            </Label>
            <Input
              id="keyword-term"
              value={form.term}
              onChange={(event) => patch({ term: event.target.value })}
              placeholder="Ví dụ: chính sách thuế mới"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Nhóm chủ đề"
              value={form.topicGroupId}
              onChange={(value) => patch({ topicGroupId: value })}
              placeholder="Chọn nhóm chủ đề"
              options={topicGroups.map((item) => ({ value: item.id, label: item.name }))}
            />
            <SelectField
              label="Loại từ khóa"
              value={form.keywordType}
              onChange={(value) => patch({ keywordType: value })}
              options={KEYWORD_TYPES}
            />
            <SelectField
              label="Mức độ quan tâm"
              value={form.trendFlag}
              onChange={(value) => patch({ trendFlag: value })}
              options={TREND_FLAGS}
            />
            <SelectField
              label="Mức ưu tiên"
              value={form.priority}
              onChange={(value) => patch({ priority: value })}
              options={PRIORITY_OPTIONS}
            />
            <div className="space-y-1.5">
              <Label htmlFor="keyword-searches" className="text-xs font-medium text-muted-foreground">
                Lượt tìm kiếm / tháng (nếu có số liệu)
              </Label>
              <Input
                id="keyword-searches"
                value={form.monthlySearches}
                onChange={(event) => patch({ monthlySearches: event.target.value })}
                placeholder="Để trống nếu chưa có dữ liệu"
                inputMode="numeric"
              />
            </div>
            <SelectField
              label="Trạng thái theo dõi"
              value={form.status}
              onChange={(value) => patch({ status: value })}
              options={KEYWORD_STATUSES}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keyword-notes" className="text-xs font-medium text-muted-foreground">
              Ghi chú
            </Label>
            <Textarea
              id="keyword-notes"
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Ý định nội dung, đối tượng độc giả, văn bản liên quan…"
              className="min-h-[80px]"
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
              {isEdit ? "Lưu thay đổi" : "Thêm từ khóa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
