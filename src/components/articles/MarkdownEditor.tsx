import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, PenLine } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function MarkdownEditor({ value, onChange, placeholder, className }: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "edit"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <PenLine className="h-3.5 w-3.5" />
            Soạn thảo
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Xem trước
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {value.length.toLocaleString("vi-VN")} ký tự
        </p>
      </div>

      {mode === "edit" ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-[520px] font-mono text-sm leading-relaxed"
        />
      ) : (
        <div className="min-h-[520px] overflow-auto rounded-lg border border-border bg-card p-5">
          {value.trim() ? (
            <article className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có nội dung để xem trước.</p>
          )}
        </div>
      )}
    </div>
  );
}
