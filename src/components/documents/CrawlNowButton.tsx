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
          `${result.source_name ?? "Quét nguồn"}: đã thêm ${result.inserted} tài liệu; ${result.duplicates ?? 0} trùng, ${result.rejected ?? 0} trang bị loại hoặc tải lỗi.`,
        );
      } else {
        toast.info(
          `${result.source_name ?? "Quét nguồn"}: chưa thêm tài liệu. Đã tải ${result.fetched} trang; ${result.duplicates ?? 0} trùng, ${result.rejected ?? 0} trang bị loại hoặc tải lỗi.`,
        );
      }

      if (result.truncated) {
        toast.info("Đã lưu vị trí quét trong tab này. Bấm Quét ngay lần nữa để xử lý đợt tiếp theo (tối đa 2 bài mỗi đợt).");
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
