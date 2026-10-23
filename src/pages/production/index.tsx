import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Factory, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import SelectField from "@/components/common/SelectField";
import MarkdownEditor from "@/components/articles/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ARTICLE_TYPES } from "@/lib/constants";
import { CONTENT_DESKS, productionChecks } from "@/lib/content-production";
import { countWords, slugify } from "@/lib/format";
import { useDocuments } from "@/hooks/useDocuments";
import { useCreateArticle } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";

type Draft = { title: string; metaDescription: string; contentMd: string; documentId: string; generatedAt: string; articleType: string; desk: string };

export default function Production() {
  const navigate = useNavigate();
  const [desk, setDesk] = useState("ke_toan");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("Kế toán viên và chủ doanh nghiệp vừa và nhỏ");
  const [articleType, setArticleType] = useState("huong-dan");
  const [targetWords, setTargetWords] = useState("1000");
  const [instructions, setInstructions] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const lock = useRef(false);
  const create = useCreateArticle();
  const { data, isLoading, isError } = useDocuments({ search, page: 1, pageSize: 100 });
  const documents = data?.items ?? [];
  const source = documents.find(item => item.id === documentId);
  const checks = draft ? productionChecks(draft.title, draft.metaDescription, draft.contentMd, Boolean(draft.documentId)) : [];

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setGenerating(true);
    setGenerationError("");
    try {
      const { data: result, error } = await supabase.functions.invoke("kt-generate-article", {
        body: { desk, topic: topic.trim(), audience, articleType, targetWords: Number(targetWords), instructions, documentId },
      });
      if (error) {
        let message = "Không kết nối được AI. Kiểm tra triển khai hàm kt-generate-article và cấu hình máy chủ.";
        if (error.context instanceof Response) {
          const payload = await error.context.json().catch(() => null);
          if (typeof payload?.error === "string") message = payload.error;
        }
        throw new Error(message);
      }
      if (!result?.title || !result?.contentMd || !result?.documentId) throw new Error(result?.error || "AI trả về bài viết thiếu nội dung.");
      setDraft({ ...result, articleType, desk });
      toast.success("Đã tạo bản nháp. Hãy đối chiếu nguồn và biên tập trước khi duyệt.");
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Tạo bài thất bại.");
    } finally { setGenerating(false); lock.current = false; }
  }

  async function save() {
    if (!draft || !draft.title.trim() || !draft.contentMd.trim() || lock.current) return;
    lock.current = true;
    try {
      const article = await create.mutateAsync({
        title: draft.title.trim(), slug: `${slugify(draft.title).slice(0, 150) || "bai-viet"}-${crypto.randomUUID().slice(0, 8)}`,
        meta_description: draft.metaDescription, content_md: draft.contentMd,
        article_type: draft.articleType, document_id: draft.documentId,
        word_count: countWords(draft.contentMd), origin: "ai", status: "nhap",
        validation_note: `Chuyên mục: ${CONTENT_DESKS.find(item => item.value === draft.desk)?.label}. AI tạo lúc ${draft.generatedAt}. Cần người biên tập đối chiếu nguồn, số liệu và hiệu lực trước khi duyệt.`,
      });
      toast.success("Đã lưu bản nháp vào kho bài viết.");
      navigate(`/articles/${article.id}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Lưu thất bại. Bản nháp vẫn còn trên màn hình."); }
    finally { lock.current = false; }
  }

  return <div className="space-y-6">
    <PageHeader title="Xưởng sản xuất nội dung" icon={Factory} description="Từ nguồn đáng tin cậy đến bài viết có cấu trúc, sẵn sàng cho biên tập và kiểm duyệt.">
      <Button variant="outline" asChild><Link to="/articles">Mở kho bài viết</Link></Button>
    </PageHeader>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CONTENT_DESKS.map(item => <button key={item.value} type="button" disabled={generating || create.isPending} onClick={() => { setDesk(item.value); if (item.value === "tin_hot") setArticleType("tin-nong"); else if (articleType === "tin-nong") setArticleType("huong-dan"); }} aria-pressed={desk === item.value} className={`rounded-xl border p-4 text-left transition-colors ${desk === item.value ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"}`}>
        <p className="font-semibold">{item.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.hint}</p>
      </button>)}
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.3fr]">
      <Card><CardHeader><CardTitle className="text-base">1. Đặt yêu cầu sản xuất</CardTitle></CardHeader><CardContent>
        <form onSubmit={generate} className="space-y-4">
          <fieldset disabled={generating || create.isPending} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="production-topic">Chủ đề bài viết</Label><Textarea id="production-topic" required minLength={10} maxLength={300} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ví dụ: Cách kiểm tra chứng từ trước khi lập báo cáo tài chính" /></div>
            <div className="space-y-2"><Label htmlFor="production-audience">Độc giả mục tiêu</Label><Input id="production-audience" required maxLength={300} value={audience} onChange={e => setAudience(e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><SelectField label="Định dạng bài" value={articleType} onChange={setArticleType} options={ARTICLE_TYPES} /><SelectField label="Độ dài mục tiêu" value={targetWords} onChange={setTargetWords} options={[{ value: "500", label: "500 từ" }, { value: "1000", label: "1.000 từ" }, { value: "1500", label: "1.500 từ" }, { value: "2000", label: "2.000 từ" }]} /></div>
            <div className="space-y-2"><Label htmlFor="production-search">Tìm tài liệu nguồn</Label><Input id="production-search" value={search} onChange={e => { setSearch(e.target.value); setDocumentId(""); }} placeholder="Tìm theo tiêu đề hoặc số văn bản" /></div>
            <SelectField label="Tài liệu làm căn cứ (bắt buộc)" value={documentId} onChange={setDocumentId} options={documents.map(item => ({ value: item.id, label: item.title }))} disabled={isLoading || isError} />
            {isError && <p role="alert" className="text-sm text-destructive">Không tải được kho nguồn. Kiểm tra kết nối rồi thử lại.</p>}
            {!isLoading && !isError && documents.length === 0 && <p className="text-sm text-muted-foreground">Chưa có nguồn phù hợp. <Link to="/documents" className="text-primary underline">Thêm hoặc thu thập tài liệu</Link> trước khi tạo bài.</p>}
            {source && <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed">Nguồn: {source.doc_number || source.title} · Ngày ban hành/đăng: {source.issued_date || "Chưa có"}. Dữ liệu ngày do người dùng cung cấp, cần đối chiếu nguồn gốc.</p>}
            {(desk === "tin_hot" || articleType === "tin-nong") && <p className="text-sm text-amber-700">Tin nóng cần URL nguồn và ngày ban hành/đăng trong 72 giờ gần đây. Hệ thống viết từ nguồn bạn chọn; chưa tự dò xu hướng trực tuyến.</p>}
            <div className="space-y-2"><Label htmlFor="production-instructions">Yêu cầu biên tập bổ sung</Label><Textarea id="production-instructions" maxLength={2000} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Góc tiếp cận, từ khóa SEO, ví dụ cần giải thích…" /></div>
          </fieldset>
          {draft && <p className="text-xs text-muted-foreground">Tạo lại sẽ thay bản nháp đang hiển thị. Hãy lưu vào kho trước nếu muốn giữ bản này.</p>}
          {generationError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{generationError}</p>}
          <Button type="submit" disabled={generating || create.isPending || !documentId || topic.trim().length < 10 || !audience.trim()} className="w-full">{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{generating ? "Đang viết bản nháp…" : draft ? "Tạo lại bản nháp" : "Sản xuất bài viết bằng AI"}</Button>
        </form>
      </CardContent></Card>
      <div className="space-y-4">
        <Card><CardHeader><CardTitle className="text-base">2. Biên tập bản nháp</CardTitle></CardHeader><CardContent className="space-y-4">
          {!draft ? <div className="py-16 text-center text-muted-foreground"><Factory className="mx-auto mb-4 h-10 w-10 opacity-40" /><p>Bản nháp sẽ xuất hiện tại đây.</p><p className="mt-2 text-sm">Chọn chuyên mục, gắn nguồn và đặt yêu cầu để bắt đầu.</p></div> : <fieldset disabled={generating || create.isPending} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="draft-title">Tiêu đề</Label><Input id="draft-title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="draft-meta">Mô tả SEO ({draft.metaDescription.length}/160)</Label><Textarea id="draft-meta" maxLength={160} value={draft.metaDescription} onChange={e => setDraft({ ...draft, metaDescription: e.target.value })} /></div>
            <MarkdownEditor value={draft.contentMd} onChange={contentMd => setDraft({ ...draft, contentMd })} />
            <p className="text-xs text-muted-foreground">{countWords(draft.contentMd).toLocaleString("vi-VN")} từ · Bản nháp chưa được lưu. Rời trang sẽ mất bản chưa lưu.</p>
            <Button type="button" disabled={!draft.title.trim() || !draft.contentMd.trim()} onClick={() => void save()}><Save className="mr-2 h-4 w-4" />{create.isPending ? "Đang lưu…" : "Lưu nháp và mở trình biên tập"}</Button>
          </fieldset>}
        </CardContent></Card>
        {draft && <Card><CardHeader><CardTitle className="text-base">3. Kiểm tra trước khi duyệt</CardTitle></CardHeader><CardContent className="space-y-2">{checks.map(check => <p key={check.label} className="flex items-center gap-2 text-sm">{check.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-amber-600" />}{check.label}</p>)}<p className="pt-3 text-xs text-muted-foreground">Đây là kiểm tra hình thức. Người biên tập cần xác minh số liệu, nguồn và hiệu lực pháp lý. Bài AI luôn được lưu ở trạng thái Nháp.</p></CardContent></Card>}
      </div>
    </div>
  </div>;
}
