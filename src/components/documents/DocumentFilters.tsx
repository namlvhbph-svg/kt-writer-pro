import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectField from "@/components/common/SelectField";
import {
  DOC_ORIGINS,
  LEGAL_STATUSES,
  REVIEW_STATUSES,
} from "@/lib/constants";
import type { DocTypeRow, TopicGroupRow } from "@/lib/types";
import type { DocumentFilters as Filters } from "@/hooks/useDocuments";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  docTypes: DocTypeRow[];
  topicGroups: TopicGroupRow[];
};

export default function DocumentFilters({
  filters,
  onChange,
  docTypes,
  topicGroups,
}: Props) {
  const patch = (partial: Partial<Filters>) =>
    onChange({ ...filters, ...partial, page: 1 });

  const hasFilter = Boolean(
    filters.search ||
      filters.docTypeId ||
      filters.topicGroupId ||
      filters.legalStatus ||
      filters.reviewStatus ||
      filters.origin ||
      filters.dateFrom ||
      filters.dateTo,
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 card-shadow">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Tìm theo tiêu đề hoặc số hiệu
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search ?? ""}
              onChange={(event) => patch({ search: event.target.value })}
              placeholder="Ví dụ: thông tư 200, hóa đơn điện tử…"
              className="h-9 pl-9"
            />
          </div>
        </div>

        <SelectField
          label="Loại văn bản"
          value={filters.docTypeId ?? ""}
          onChange={(value) => patch({ docTypeId: value })}
          allLabel="Tất cả loại văn bản"
          options={docTypes.map((item) => ({ value: item.id, label: item.name }))}
        />

        <SelectField
          label="Nhóm chủ đề"
          value={filters.topicGroupId ?? ""}
          onChange={(value) => patch({ topicGroupId: value })}
          allLabel="Tất cả nhóm chủ đề"
          options={topicGroups.map((item) => ({ value: item.id, label: item.name }))}
        />

        <SelectField
          label="Trạng thái xử lý"
          value={filters.reviewStatus ?? ""}
          onChange={(value) => patch({ reviewStatus: value })}
          allLabel="Tất cả trạng thái"
          options={REVIEW_STATUSES}
        />

        <SelectField
          label="Hiệu lực pháp lý"
          value={filters.legalStatus ?? ""}
          onChange={(value) => patch({ legalStatus: value })}
          allLabel="Tất cả hiệu lực"
          options={LEGAL_STATUSES}
        />

        <SelectField
          label="Cách nhập"
          value={filters.origin ?? ""}
          onChange={(value) => patch({ origin: value })}
          allLabel="Mọi nguồn nhập"
          options={DOC_ORIGINS}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Từ ngày</label>
          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) => patch({ dateFrom: event.target.value })}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Đến ngày</label>
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) => patch({ dateTo: event.target.value })}
            className="h-9"
          />
        </div>
      </div>

      {hasFilter ? (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Đang áp dụng bộ lọc — số liệu bên dưới chỉ tính trên các văn bản khớp điều kiện.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              onChange({ page: 1, pageSize: filters.pageSize, search: "" })
            }
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Xóa bộ lọc
          </Button>
        </div>
      ) : null}
    </div>
  );
}
