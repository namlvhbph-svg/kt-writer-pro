import { useRef, useState } from "react";
import { AlertTriangle, FileUp, Loader2, Trash2, Upload } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import SelectField from "@/components/common/SelectField";
import { LEGAL_STATUSES, REVIEW_STATUSES } from "@/lib/constants";
import { extractTextFromFile, SUPPORTED_UPLOAD_HINT } from "@/lib/file-extract";
import { countWords, formatBytes } from "@/lib/format";
import { fingerprintValue, friendlyDbError } from "@/lib/fingerprint";
import { useCreateDocument } from "@/hooks/useDocuments";
import type { DocTypeRow, TopicGroupRow } from "@/lib/types";

type QueueItem = {
  key: string;
  file: File;
  title: string;
  text: string;
  warnings: string[];
  status: "extracting" | "ready" | "error";
  error?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docTypes: DocTypeRow[];
  topicGroups: TopicGroupRow[];
};

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  docTypes,
  topicGroups,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const createDocument = useCreateDocument();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [docTypeId, setDocTypeId] = useState("");
  const [topicGroupId, setTopicGroupId] = useState("");
  const [legalStatus, setLegalStatus] = useState("khong_xac_dinh");
  const [reviewStatus, setReviewStatus] = useState("moi");
  const [saving, setSaving] = useState(false);

  const activeItem = items.find((item) => item.key === activeKey) ?? items[0] ?? null;

  const reset = () => {
    setItems([]);
    setActiveKey(null);
    setSaving(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const queued: QueueItem[] = files.map((file, index) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${index}`,
      file,
      title: file.name.replace(/\.[^.]+$/, ""),
      text: "",
      warnings: [],
      status: "extracting",
    }));

    setItems(queued);
    setActiveKey(queued[0].key);

    for (const item of queued) {
      try {
        const { text, warnings } = await extractTextFromFile(item.file);
        setItems((current) =>
          current.map((entry) =>
            entry.key === item.key
              ? {
                  ...entry,
                  text,
                  warnings,
                  status: text.length > 0 ? "ready" : "error",
                  error: text.length === 0 ? "Không trích được nội dung văn bản." : undefined,
                }
              : entry,
          ),
        );
      } catch (error) {
        setItems((current) =>
          current.map((entry) =>
            entry.key === item.key
              ? {
                  ...entry,
                  status: "error",
                  error: error instanceof Error ? error.message : "Không đọc được file.",
                }
              : entry,
          ),
        );
      }
    }
  };

  const updateTitle = (key: string, title: string) =>
    setItems((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, title } : entry)),
    );

  const removeItem = (key: string) =>
    setItems((current) => current.filter((entry) => entry.key !== key));

  const handleSave = async () => {
    const ready = items.filter((item) => item.status === "ready");
    if (ready.length === 0) {
      toast.error("Chưa có file nào trích được nội dung để lưu.");
      return;
    }
    if (ready.some((item) => !item.title.trim())) {
      toast.error("Mỗi file cần có tiêu đề trước khi lưu.");
      return;
    }

    setSaving(true);
    let saved = 0;
    const failures: string[] = [];

    for (const item of ready) {
      try {
        const fingerprint = await fingerprintValue(
          `${item.title.trim()}|${item.file.name}|${item.file.size}`,
        );
        await createDocument.mutateAsync({
          title: item.title.trim(),
          doc_type_id: docTypeId || null,
          topic_group_id: topicGroupId || null,
          legal_status: legalStatus,
          review_status: reviewStatus,
          raw_text: item.text,
          char_count: item.text.length,
          file_name: item.file.name,
          file_size: item.file.size,
          mime_type: item.file.type || null,
          fingerprint,
          origin: "upload",
        });
        saved += 1;
      } catch (error) {
        failures.push(
          `${item.title.slice(0, 40)}: ${friendlyDbError(
            error instanceof Error ? error.message : "lỗi không xác định",
          )}`,
        );
      }
    }

    setSaving(false);

    if (saved > 0) {
      toast.success(`Đã lưu ${saved} văn bản vào kho.`);
    }
    if (failures.length > 0) {
      toast.error(`Không lưu được ${failures.length} file. ${failures[0]}`);
    }
    if (saved > 0 && failures.length === 0) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tải file văn bản vào kho</DialogTitle>
          <DialogDescription>
            Hệ thống tự trích văn bản từ file để lưu vào kho dữ liệu. Định dạng hỗ trợ:{" "}
            {SUPPORTED_UPLOAD_HINT}. Có thể chọn nhiều file cùng lúc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleFiles(event.dataTransfer.files);
            }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary shadow-sm">
              <FileUp className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">Kéo thả file vào đây hoặc chọn từ máy</p>
            <p className="text-xs text-muted-foreground">
              Văn bản scan dạng ảnh sẽ không trích được chữ — khi đó hãy dùng chức năng Thêm văn
              bản để dán nội dung.
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.docx,.pdf"
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Chọn file
            </Button>
          </div>

          {items.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveKey(item.key)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      activeItem?.key === item.key
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-xs font-medium">{item.title}</span>
                      <span
                        onClick={(event) => {
                          event.stopPropagation();
                          removeItem(item.key);
                        }}
                        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatBytes(item.file.size)}
                      {item.status === "extracting" ? " · đang trích văn bản…" : ""}
                      {item.status === "ready" ? ` · ${countWords(item.text)} từ` : ""}
                      {item.status === "error" ? " · lỗi" : ""}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {activeItem ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Tiêu đề văn bản
                      </Label>
                      <Input
                        value={activeItem.title}
                        onChange={(event) => updateTitle(activeItem.key, event.target.value)}
                      />
                    </div>

                    {activeItem.error ? (
                      <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {activeItem.error}
                      </p>
                    ) : null}

                    {activeItem.status === "extracting" ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang đọc nội dung file…
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Nội dung trích được (xem trước)
                        </Label>
                        <ScrollArea className="h-56 rounded-lg border border-border bg-muted/30 p-3">
                          <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-foreground">
                            {activeItem.text.slice(0, 6000) || "(không có nội dung)"}
                          </pre>
                        </ScrollArea>
                        {activeItem.text.length > 6000 ? (
                          <p className="text-[11px] text-muted-foreground">
                            Chỉ hiển thị 6.000 ký tự đầu. Toàn bộ{" "}
                            {activeItem.text.length.toLocaleString("vi-VN")} ký tự vẫn được lưu vào
                            kho.
                          </p>
                        ) : null}
                      </div>
                    )}

                    {activeItem.warnings.length > 0 ? (
                      <div className="space-y-1 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
                        {activeItem.warnings.map((warning) => (
                          <p key={warning} className="text-xs text-warning">
                            {warning}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Thông tin bên dưới áp dụng cho toàn bộ file trong lần tải lên này. Bạn có thể chỉnh
                lại chi tiết từng văn bản sau khi lưu.
              </p>
              <SelectField
                label="Loại văn bản"
                value={docTypeId}
                onChange={setDocTypeId}
                placeholder="Chọn loại văn bản"
                options={docTypes.map((item) => ({ value: item.id, label: item.name }))}
              />
              <SelectField
                label="Nhóm chủ đề"
                value={topicGroupId}
                onChange={setTopicGroupId}
                placeholder="Chọn nhóm chủ đề"
                options={topicGroups.map((item) => ({ value: item.id, label: item.name }))}
              />
              <SelectField
                label="Hiệu lực pháp lý"
                value={legalStatus}
                onChange={setLegalStatus}
                options={LEGAL_STATUSES}
              />
              <SelectField
                label="Trạng thái xử lý"
                value={reviewStatus}
                onChange={setReviewStatus}
                options={REVIEW_STATUSES}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || items.filter((item) => item.status === "ready").length === 0}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Lưu {items.filter((item) => item.status === "ready").length || ""} văn bản vào kho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
