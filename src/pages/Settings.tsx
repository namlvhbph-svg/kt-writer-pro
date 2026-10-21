import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import SelectField from "@/components/common/SelectField";
import CrawlNowButton from "@/components/documents/CrawlNowButton";
import SourceFormDialog from "@/components/settings/SourceFormDialog";
import DocTypeFormDialog from "@/components/settings/DocTypeFormDialog";
import TopicGroupFormDialog from "@/components/settings/TopicGroupFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOC_GROUPS, labelOf } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { friendlyDbError } from "@/lib/fingerprint";
import { useSources } from "@/hooks/useSources";
import {
  useDeleteDocType,
  useDeleteSource,
  useDeleteTopicGroup,
  useDocTypes,
  useSaveSource,
  useTopicGroups,
} from "@/hooks/useReferenceData";
import type { DocTypeRow, SourceRow, TopicGroupRow } from "@/lib/types";

export default function Settings() {
  const { data: sources = [], isLoading: loadingSources } = useSources();
  const { data: docTypes = [], isLoading: loadingDocTypes } = useDocTypes();
  const { data: topicGroups = [], isLoading: loadingTopics } = useTopicGroups();
  const saveSource = useSaveSource();
  const deleteSource = useDeleteSource();
  const deleteDocType = useDeleteDocType();
  const deleteTopicGroup = useDeleteTopicGroup();

  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceRow | null>(null);
  const [deletingSource, setDeletingSource] = useState<SourceRow | null>(null);

  const [docTypeFormOpen, setDocTypeFormOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<DocTypeRow | null>(null);
  const [deletingDocType, setDeletingDocType] = useState<DocTypeRow | null>(null);

  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicGroupRow | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<TopicGroupRow | null>(null);

  const toggleSource = async (source: SourceRow, isActive: boolean) => {
    if (isActive && !source.index_url) {
      toast.error("Cần điền URL trang danh mục trước khi bật nguồn này.");
      return;
    }
    try {
      await saveSource.mutateAsync({
        id: source.id,
        name: source.name,
        base_url: source.base_url,
        index_url: source.index_url,
        link_filter: source.link_filter,
        doc_group: source.doc_group,
        is_active: isActive,
        notes: source.notes,
      });
      toast.success(isActive ? "Đã bật nguồn dữ liệu." : "Đã tắt nguồn dữ liệu.");
    } catch (error) {
      toast.error(friendlyDbError(error instanceof Error ? error.message : "Cập nhật thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quản lý nguồn cào dữ liệu, loại văn bản và nhóm chủ đề dùng xuyên suốt kho dữ liệu."
        icon={SettingsIcon}
      >
        <CrawlNowButton label="Quét toàn bộ nguồn đang bật" variant="default" size="default" />
      </PageHeader>

      <Tabs defaultValue="sources" className="space-y-5">
        <TabsList>
          <TabsTrigger value="sources">Nguồn dữ liệu</TabsTrigger>
          <TabsTrigger value="doctypes">Loại văn bản</TabsTrigger>
          <TabsTrigger value="topics">Nhóm chủ đề</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Nguồn đang bật sẽ được quét khi bấm "Quét ngay". Nguồn chưa có URL danh mục sẽ được
              bỏ qua kèm cảnh báo.
            </p>
            <Button
              onClick={() => {
                setEditingSource(null);
                setSourceFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm nguồn
            </Button>
          </div>

          {loadingSources ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="Chưa có nguồn dữ liệu nào"
              description="Thêm nguồn cào để hệ thống tự động phát hiện văn bản mới."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {sources.map((source) => (
                <Card key={source.id} className="card-shadow">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{source.name}</CardTitle>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {source.index_url ?? "Chưa cấu hình URL trang danh mục"}
                        </p>
                      </div>
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={(checked) => void toggleSource(source, checked)}
                        disabled={saveSource.isPending}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={source.is_active ? "Đang bật" : "Đang tắt"}
                        tone={source.is_active ? "success" : "muted"}
                      />
                      <StatusBadge
                        label={labelOf(DOC_GROUPS, source.doc_group)}
                        tone="info"
                      />
                      {source.link_filter ? (
                        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          lọc: {source.link_filter}
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        {source.last_crawl_error ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        )}
                        Lần quét gần nhất: {formatDateTime(source.last_crawled_at)}
                      </p>
                      <p className="text-muted-foreground">
                        {source.last_crawl_status ?? "Chưa quét lần nào"}
                      </p>
                      {source.last_crawl_error ? (
                        <p className="text-warning">{source.last_crawl_error}</p>
                      ) : null}
                    </div>

                    {source.notes ? (
                      <p className="text-xs text-muted-foreground">{source.notes}</p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      <CrawlNowButton sourceId={source.id} label="Quét nguồn này" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSource(source);
                          setSourceFormOpen(true);
                        }}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeletingSource(source)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="doctypes" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Dùng để phân loại văn bản trong kho và lọc nhanh khi tìm kiếm.
            </p>
            <Button
              onClick={() => {
                setEditingDocType(null);
                setDocTypeFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm loại văn bản
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 card-shadow">
            {loadingDocTypes ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên loại văn bản</TableHead>
                      <TableHead className="hidden md:table-cell">Nhóm</TableHead>
                      <TableHead className="hidden md:table-cell">Thứ tự</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docTypes.map((docType) => (
                      <TableRow key={docType.id}>
                        <TableCell className="font-mono text-xs">{docType.code}</TableCell>
                        <TableCell className="text-sm font-medium">{docType.name}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {labelOf(DOC_GROUPS, docType.doc_group)}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {docType.sort_order}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={docType.is_active ? "Đang dùng" : "Ngừng dùng"}
                            tone={docType.is_active ? "success" : "muted"}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Sửa loại văn bản"
                              onClick={() => {
                                setEditingDocType(docType);
                                setDocTypeFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              aria-label="Xóa loại văn bản"
                              onClick={() => setDeletingDocType(docType)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Nhóm chủ đề gom văn bản và từ khóa theo mảng nghiệp vụ.
            </p>
            <Button
              onClick={() => {
                setEditingTopic(null);
                setTopicFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm nhóm chủ đề
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 card-shadow">
            {loadingTopics ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên nhóm chủ đề</TableHead>
                      <TableHead className="hidden md:table-cell">Mô tả</TableHead>
                      <TableHead className="hidden md:table-cell">Thứ tự</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topicGroups.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell className="font-mono text-xs">{topic.code}</TableCell>
                        <TableCell className="text-sm font-medium">{topic.name}</TableCell>
                        <TableCell className="hidden max-w-[320px] truncate text-sm text-muted-foreground md:table-cell">
                          {topic.description ?? "—"}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {topic.sort_order}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Sửa nhóm chủ đề"
                              onClick={() => {
                                setEditingTopic(topic);
                                setTopicFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              aria-label="Xóa nhóm chủ đề"
                              onClick={() => setDeletingTopic(topic)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="card-shadow">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Ghi chú vận hành</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Việc quét dữ liệu chạy theo yêu cầu (bấm "Quét ngay"), không chạy theo lịch tự động.
            Lịch chạy định kỳ sẽ được bổ sung ở giai đoạn tự động hóa.
          </p>
          <p className="flex items-start gap-2">
            <Tags className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Một số nguồn như Thư Viện Pháp Luật hoặc Bộ Tài chính có thể chặn truy cập tự động. Khi
            đó nguồn sẽ báo lỗi ngay tại thẻ nguồn, bạn hãy dùng chức năng Tải file lên để nhập văn
            bản thủ công.
          </p>
        </CardContent>
      </Card>

      <SourceFormDialog
        open={sourceFormOpen}
        onOpenChange={(open) => {
          setSourceFormOpen(open);
          if (!open) setEditingSource(null);
        }}
        source={editingSource}
      />

      <DocTypeFormDialog
        open={docTypeFormOpen}
        onOpenChange={(open) => {
          setDocTypeFormOpen(open);
          if (!open) setEditingDocType(null);
        }}
        docType={editingDocType}
      />

      <TopicGroupFormDialog
        open={topicFormOpen}
        onOpenChange={(open) => {
          setTopicFormOpen(open);
          if (!open) setEditingTopic(null);
        }}
        topicGroup={editingTopic}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingSource)}
        onOpenChange={(open) => {
          if (!open) setDeletingSource(null);
        }}
        title="Xóa nguồn dữ liệu?"
        description={`Nguồn "${deletingSource?.name ?? ""}" sẽ bị xóa. Các văn bản đã cào về vẫn ở lại trong kho nhưng sẽ không còn gắn nguồn này.`}
        loading={deleteSource.isPending}
        onConfirm={() => {
          if (!deletingSource) return;
          void deleteSource
            .mutateAsync(deletingSource.id)
            .then(() => {
              toast.success("Đã xóa nguồn dữ liệu.");
              setDeletingSource(null);
            })
            .catch((error) =>
              toast.error(
                friendlyDbError(error instanceof Error ? error.message : "Xóa không thành công."),
              ),
            );
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingDocType)}
        onOpenChange={(open) => {
          if (!open) setDeletingDocType(null);
        }}
        title="Xóa loại văn bản?"
        description={`Loại "${deletingDocType?.name ?? ""}" sẽ bị xóa. Các văn bản đang dùng loại này sẽ trở thành chưa phân loại.`}
        loading={deleteDocType.isPending}
        onConfirm={() => {
          if (!deletingDocType) return;
          void deleteDocType
            .mutateAsync(deletingDocType.id)
            .then(() => {
              toast.success("Đã xóa loại văn bản.");
              setDeletingDocType(null);
            })
            .catch((error) =>
              toast.error(
                friendlyDbError(error instanceof Error ? error.message : "Xóa không thành công."),
              ),
            );
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingTopic)}
        onOpenChange={(open) => {
          if (!open) setDeletingTopic(null);
        }}
        title="Xóa nhóm chủ đề?"
        description={`Nhóm "${deletingTopic?.name ?? ""}" sẽ bị xóa. Văn bản và từ khóa thuộc nhóm sẽ trở thành chưa gắn nhóm.`}
        loading={deleteTopicGroup.isPending}
        onConfirm={() => {
          if (!deletingTopic) return;
          void deleteTopicGroup
            .mutateAsync(deletingTopic.id)
            .then(() => {
              toast.success("Đã xóa nhóm chủ đề.");
              setDeletingTopic(null);
            })
            .catch((error) =>
              toast.error(
                friendlyDbError(error instanceof Error ? error.message : "Xóa không thành công."),
              ),
            );
        }}
      />
    </div>
  );
}
