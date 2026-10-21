import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCrawlSources } from "@/hooks/useSources";

type Props = {
  sourceId?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
  className?: string;
};

export default function CrawlNowButton({
  sourceId,
  label = "Quét ngay",
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const crawl = useCrawlSources();

  const run = async () => {
    try {
      const result = await crawl.mutateAsync(sourceId);

      if (result.inserted > 0) {
        toast.success(
          `Đã thêm ${result.inserted} văn bản mới vào kho (bỏ qua ${result.skipped} văn bản đã có).`,
        );
      } else {
        toast.info(
          `Không có văn bản mới. Đã kiểm tra ${result.fetched} trang, bỏ qua ${result.skipped} văn bản đã có trong kho.`,
        );
      }

      if (result.truncated) {
        toast.info("Tiến trình chưa quét hết danh sách. Hãy bấm Quét ngay lần nữa để cào tiếp.");
      }

      if (result.errors && result.errors.length > 0) {
        toast.error(result.errors[0]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Quét dữ liệu không thành công.",
      );
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => void run()}
      disabled={crawl.isPending}
    >
      {crawl.isPending ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
      )}
      {crawl.isPending ? "Đang quét dữ liệu…" : label}
    </Button>
  );
}
