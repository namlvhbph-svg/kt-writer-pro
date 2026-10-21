# KT Writer PRO — Web App (Dashboard + Kho dữ liệu)

## Context

Bạn có `main.py` — công cụ Python (Scrape UEL → SQLite → OpenAI → Validate → WordPress) — và muốn nâng cấp thành **KT Writer PRO**: một web app quản trị chạy độc lập, có database đầy đủ, làm chủ hoàn toàn hạ tầng.

**Ràng buộc nền tảng (đã thống nhất):** Enter không chạy được Python, Streamlit hay FastAPI. Vì vậy app được chuyển hẳn sang kiến trúc **React (Vite + TypeScript) + Enter Cloud** làm backend: Postgres (thay SQLite), Storage (thay thư mục `Generated_Articles`), backend functions (thay phần Scraper/Publisher của Python), và AI capability của Enter (thay OpenAI API) cho giai đoạn sau.

**Phạm vi lần build này (theo lựa chọn của bạn):**

- ✅ Dashboard tổng quan + toàn bộ kho dữ liệu: văn bản pháp luật, từ khóa/chủ đề hot về kế toán – chính sách thuế – văn bản mới, kho bài viết + biên tập
- ✅ Cào tự động (backend function, cấu hình được nguồn) **+** upload PDF/DOCX/TXT
- ✅ Đăng nhập nội bộ (email/mật khẩu)
- ⛔ Chưa có AI: chưa sinh bài tự động, chưa validator chống ảo giác, chưa WordPress/social/Telegram, chưa lịch chạy tự động. Các phần này để giai đoạn sau, schema đã được thiết kế sẵn để nối vào.

---

## Kiến trúc tổng thể

| Thành phần trong `main.py` | Thay thế trong web app |
|---|---|
| `sqlite3` + `vas_articles.db` | Postgres của Enter Cloud (bảng tiền tố `kt_`) |
| `Scraper` (requests + BeautifulSoup) | Backend function `kt-crawl-sources` (Deno `fetch` + `linkedom`) |
| `ArticleGenerator` (OpenAI) | *Giai đoạn sau* — Enter AI capability |
| `Validator` | *Giai đoạn sau* — chạy server-side |
| `Publisher.to_file` | Xuất `.md`/`.json` tải về từ trình duyệt |
| `Publisher.to_wordpress` | *Giai đoạn sau* — backend function + secret WP |
| CLI `argparse` | Giao diện dashboard (sidebar) |

---

## 1. Database (migration qua `supabase_migration`)

Bảng tiền tố `kt_` để tách biệt rõ với dữ liệu khác. **RLS bật trong cùng migration tạo bảng**, policy dành cho `authenticated` (công cụ nội bộ, mọi thành viên đã đăng nhập thấy chung dữ liệu).

**Bảng danh mục (map từ `kt_documents`, seed sẵn):**

- `kt_doc_types` — `code`, `name`, `group` (`ke_toan` | `thue` | `bhxh` | `khac`), `sort_order`, `is_active`
  Seed: Chuẩn mực kế toán VN (VAS), Thông tư 200/2014/TT-BTC, Thông tư 133/2016/TT-BTC, Thông tư 99/2025/TT-BTC, Luật Kế toán, Nghị định – Thuế TNDN, Thông tư – Thuế GTGT, Hóa đơn điện tử, BHXH, Khác
- `kt_topic_groups` — `code`, `name`, `sort_order`
  Seed: Chuẩn mực VAS, Thuế TNDN, Thuế GTGT, Hóa đơn điện tử, Quyết toán thuế, Báo cáo tài chính, IFRS, Văn bản mới
- `kt_sources` (nguồn cào) — `name`, `base_url`, `index_url`, `link_filter`, `category`, `is_active`, `last_crawled_at`, `last_crawl_status`, `last_crawl_new_count`, `last_crawl_error`
  Seed: **UEL – Chuẩn mực kế toán VN** (`https://ktkt.uel.edu.vn/chuan-muc-ke-toan-viet-nam-vas2`, `link_filter = "chuan-muc-"`, `is_active = true`) — nguồn duy nhất đã kiểm chứng chạy được trong `main.py`.
  Seed thêm 2 dòng **inactive** cho Bộ Tài chính và Thư Viện Pháp Luật chỉ ghi `base_url` (không bịa URL index); bạn điền URL index rồi bật ở trang Cấu hình. Ghi chú rõ nguy cơ 2 nguồn này chặn bot.

**Bảng dữ liệu chính:**

- `kt_documents` — kho văn bản pháp luật
  `id`, `title`, `doc_number`, `doc_type_id`, `topic_group_id`, `source_id` (null = nhập tay/upload), `issuing_body`, `issued_date`, `effective_date`, `expiry_date`, `legal_status` (`chua_hieu_luc` | `con_hieu_luc` | `sap_het_hieu_luc` | `het_hieu_luc` | `khong_xac_dinh`), `review_status` (`moi` | `dang_xu_ly` | `da_xu_ly`), `original_url`, `raw_text`, `char_count`, `file_path`, `file_name`, `file_size`, `mime_type`, `fingerprint` **(unique)**, `origin` (`cao_tu_dong` | `upload` | `nhap_tay`), `notes`, `created_by`, `discovered_at`, `created_at`, `updated_at`
  `fingerprint` = 16 ký tự đầu SHA-256 của `title|url` (giữ đúng cơ chế chống trùng của `Database.save_source`). Với upload/nhập tay: `title|file_name|file_size` hoặc `title|hash(nội dung)`.
  Index: `documents(review_status)`, `documents(discovered_at)`.
- `kt_keywords` — `term`, `topic_group_id`, `keyword_type` (`primary` | `secondary` | `long_tail`), `trend_flag` (`hot` | `dang_len` | `on_dinh`), `priority` (1–5), `monthly_searches` (nullable, để trống cho tới khi có nguồn số liệu thật), `status` (`active` | `paused`), `notes`, `origin`
  Unique `(term, topic_group_id)`. Seed sẵn ~20 thuật ngữ kế toán – thuế thật làm thư viện khởi đầu (chuẩn mực kế toán Việt Nam, thông tư 200, hạch toán chi phí, thuế TNDN, thuế GTGT, hóa đơn điện tử, quyết toán thuế, báo cáo tài chính, khấu hao TSCĐ…) — **không bịa số liệu tìm kiếm**.
- `kt_document_keywords` — nối nhiều-nhiều văn bản ↔ từ khóa (pk tổ hợp)
- `kt_articles` — kho bài viết: `title`, `slug` (unique), `meta_description`, `content_md`, `article_type`, `word_count`, `status` (`nhap` | `cho_duyet` | `dat` | `can_duyet` | `xuat_ban`), `validation_note`, `document_id`, `origin` (`thu_cong` — sau này `ai`), `published_file`, `created_by`, timestamps
- `kt_article_keywords` — nối bài viết ↔ từ khóa (phục vụ internal link ở giai đoạn 3)
- `profiles` — bảng chuẩn kèm trigger tự tạo khi user đăng ký (không đọc trực tiếp schema `auth`)

**Storage:** kiểm tra bucket sẵn có bằng truy vấn đọc `storage.buckets`; nếu chưa có bucket phù hợp thì tạo bucket `legal-documents` bằng service role **qua backend function** (không tự ý sửa schema `storage` bằng migration). Lưu file gốc theo path `<document_id>/<tên file>`. Nếu bước này không khả thi, upload vẫn hoạt động ở mức trích xuất văn bản và app sẽ báo rõ file gốc chưa được lưu — không im lặng bỏ qua.

## 2. Backend function `kt-crawl-sources`

`supabase/functions/kt-crawl-sources/index.ts` (deploy bằng `supabase_deploy_edge_function`):

- Nhận `{ source_id?: string }` — cào 1 nguồn hoặc toàn bộ nguồn `is_active`.
- Tải `index_url` với User-Agent giống `main.py`; parse bằng `linkedom` (esm.sh), dự phòng regex strip nếu import lỗi.
- Lọc link chứa `link_filter`, khử trùng theo URL; tải trang chi tiết, lấy tiêu đề (`h1/h2` class khớp `title|header`) và nội dung (`div` class khớp `detail|content|article`), bỏ `script/style/nav/footer/aside`, gộp khoảng trắng — giữ nguyên heuristic đã chạy tốt của `Scraper.scrape_article`.
- Bỏ qua nội dung < 300 ký tự; chèn `kt_documents` với `upsert(..., { onConflict: 'fingerprint', ignoreDuplicates: true })` để chống trùng.
- Cập nhật `last_crawled_at`, `last_crawl_status`, `last_crawl_new_count`, `last_crawl_error` trên `kt_sources`; trả về `{ fetched, inserted, skipped, errors[] }`.
- Bật CORS + xử lý `OPTIONS`; dùng client với Authorization của người gọi để RLS vẫn áp dụng; ghi log đủ để debug qua `supabase_search_edge_function_logs`.

*Lịch chạy tự động (cron) không được hỗ trợ native → nút "Quét ngay" trong app. Ghi chú cron ngoài nằm ngoài phạm vi lần này.*

## 3. Auth nội bộ

- `supabase_configure_auth`: bật auto-confirm cho đăng ký email để test không cần vòng lặp mail.
- Trang `Login` có **cả đăng ký và đăng nhập** email/mật khẩu (tiếng Việt), `emailRedirectTo: ${window.location.origin}/`.
- `src/contexts/AuthContext.tsx`: đăng ký `onAuthStateChange` **trước** khi kiểm tra session hiện có, callback **không async**, mọi lời gọi client trong callback đặt trong `setTimeout(..., 0)`; lưu cả `user` và `session`, đúng chuẩn trong `references/auth.md`.
- `AuthGuard` chặn mọi route trừ `/login`; chưa đăng nhập → điều hướng về `/login`.

## 4. Giao diện (tiếng Việt, không dùng i18n — giữ nguyên scaffold i18n của template, không wire vào)

Bố cục dùng lại `src/components/ui/sidebar.tsx` của template. Sidebar tối, vùng nội dung sáng, thẻ KPI + badge trạng thái màu.

**Design tokens (sửa `src/index.css` + `tailwind.config.ts`)** — phong cách công cụ tài chính chuyên nghiệp, tương phản cao:

- `--primary` teal đậm `174 62% 30%`; `--sidebar-background` navy `222 45% 13%`; `--accent` teal nhạt
- Thêm token ngữ nghĩa mới `--success` `152 60% 34%`, `--warning` `38 92% 45%`, `--info` `205 80% 42%` và map vào `theme.extend.colors` để badge trạng thái dùng token, không hardcode màu
- Thêm `--gradient-surface`, `--shadow-card`, `--transition-smooth`; `--radius: 0.75rem`
- Cả light và dark mode đều được chỉnh để không lệch tương phản (chú ý `--primary-foreground`, `--sidebar-*`)

**Trang (khai báo trong `src/router.tsx`, bọc trong `AppLayout` + `AuthGuard`):**

| Route | Nội dung |
|---|---|
| `/login` | Đăng nhập / đăng ký |
| `/` | **Tổng quan**: KPI (tổng văn bản, văn bản mới 30 ngày, văn bản chờ xử lý, từ khóa đang theo dõi, bài viết theo trạng thái), biểu đồ cột văn bản theo tháng (recharts), biểu đồ tròn phân bố theo nhóm chủ đề, cảnh báo văn bản sắp hết hiệu lực (≤60 ngày), 2 danh sách "văn bản mới nhất" / "bài viết cập nhật gần nhất" |
| `/documents` | **Văn bản pháp luật**: bảng có lọc (loại văn bản, nhóm chủ đề, trạng thái hiệu lực, trạng thái xử lý, khoảng thời gian), tìm kiếm theo tiêu đề/số hiệu, phân trang; nút **Thêm văn bản** (nhập tay/paste), **Tải file lên**, **Quét ngay** |
| `/documents/:id` | Chi tiết văn bản: metadata, toàn văn (khung cuộn), gắn/bỏ từ khóa, đổi trạng thái xử lý, sửa/xóa, link nguồn gốc, tải file gốc |
| `/keywords` | **Từ khóa & Chủ đề**: bảng lọc theo nhóm chủ đề / loại / mức ưu tiên / trạng thái; đánh dấu "hot"; thêm–sửa–xóa; hiển thị số văn bản và số bài viết đang gắn với mỗi từ khóa |
| `/articles` | **Kho bài viết**: bảng lọc theo trạng thái + loại bài + từ khóa; thao tác chuyển trạng thái duyệt (Nháp → Chờ duyệt → Đạt / Cần duyệt → Xuất bản); xuất `.md` và `.json` |
| `/articles/:id` | **Biên tập**: markdown editor (textarea + preview `react-markdown`), đếm từ, sửa meta description/slug, gắn văn bản nguồn + từ khóa, lưu nháp, xuất file |
| `/settings` | **Cấu hình**: quản lý nguồn cào (thêm/sửa/bật-tắt, xem kết quả lần cào cuối), quản lý loại văn bản, nhóm chủ đề, chỗ trống cho cấu hình WordPress ở giai đoạn 3 |

**Upload & trích xuất văn bản (`src/lib/file-extract.ts`):** TXT/MD đọc trực tiếp; DOCX dùng `mammoth`; PDF dùng `pdfjs-dist` (worker qua `?url`). Hiển thị trước phần văn bản trích được để bạn xác nhận trước khi lưu. PDF scan không có lớp văn bản sẽ báo rõ "không trích được văn bản" — OCR ngoài phạm vi.

**Trạng thái & empty state:** mọi bảng có empty state, loading skeleton, và thông báo lỗi rõ ràng (sonner toast có sẵn).

## 5. Files

**Tạo mới**

- `supabase/functions/kt-crawl-sources/index.ts`
- `src/contexts/AuthContext.tsx`, `src/components/auth/AuthGuard.tsx`
- `src/layouts/AppLayout.tsx`
- `src/lib/constants.ts`, `src/lib/format.ts`, `src/lib/file-extract.ts`, `src/lib/export-article.ts`
- `src/hooks/useDocuments.ts`, `useKeywords.ts`, `useArticles.ts`, `useSources.ts`, `useReferenceData.ts`
- `src/components/common/{StatusBadge,PageHeader,EmptyState,ConfirmDeleteDialog,KeywordPicker}.tsx`
- `src/components/documents/{DocumentFormDialog,DocumentUploadDialog,DocumentFilters,CrawlNowButton}.tsx`
- `src/components/keywords/{KeywordFormDialog,KeywordFilters}.tsx`
- `src/components/articles/{ArticleFormDialog,MarkdownEditor}.tsx`
- `src/components/dashboard/{KpiCard,DocumentsTrendChart,TopicDistributionChart,RecentDocuments,RecentArticles}.tsx`
- `src/pages/{Login,Dashboard,Documents,DocumentDetail,Keywords,Articles,ArticleEditor,Settings}.tsx`

**Sửa**

- `src/router.tsx` — thêm toàn bộ route mới (giữ nguyên convention `window.__routers__`)
- `src/App.tsx` — bọc `AuthProvider` + `BrowserRouterProvider` như hiện tại
- `src/index.css`, `tailwind.config.ts` — design tokens mới
- `package.json` — thêm `mammoth`, `pdfjs-dist`, `react-markdown`, `remark-gfm`
- `src/pages/Index.tsx` — thay bằng dashboard (hoặc chuyển thành `Dashboard.tsx` và xóa `Index.tsx`)

**Không đụng tới:** `src/integrations/supabase/*` (framework ghi đè), scaffold i18n, `src/components/ui/*` (chỉ dùng, trừ khi cần thêm variant).

---

## Trạng thái triển khai

Đã hoàn thành và đã deploy. Bảng dữ liệu, RLS, seed dữ liệu nền, backend function cào dữ liệu và toàn bộ giao diện đã được build thành công (`pnpm lint`, `tsc --noEmit`, `pnpm build` đều sạch).

**Một sai lệch so với kế hoạch:** file gốc (PDF/DOCX) **không** được lưu trữ nhị phân. Hệ thống trích và lưu **toàn văn** cùng `file_name`, `file_size`, `mime_type`; cột `file_path` để trống. Lý do: Cloud của dự án chưa có bucket lưu trữ nào và việc tạo/sửa chính sách trong schema lưu trữ bị giới hạn, nên không thể tạo bucket an toàn trong lượt này. Khi bạn muốn lưu file gốc, ta có thể bổ sung ở bước sau.

## Implementation checklist

- [x] Gọi `supabase_enable` để kết nối backend Enter Cloud
- [x] Gọi `supabase_configure_auth` bật auto-confirm đăng ký email
- [x] Migration 1: `kt_doc_types`, `kt_topic_groups`, `kt_keywords`, `kt_sources` + RLS + policy + unique/index
- [x] Migration 2: `kt_documents`, `kt_document_keywords`, `kt_articles`, `kt_article_keywords` + RLS + index + FK
- [x] Migration 3: `profiles` + trigger đồng bộ khi user đăng ký
- [x] Seed `kt_doc_types` (11 loại) và `kt_topic_groups` (8 nhóm)
- [x] Seed `kt_sources`: UEL active; 2 nguồn Bộ Tài chính / Thư Viện Pháp Luật inactive có ghi chú
- [x] Seed 21 từ khóa kế toán – thuế, `monthly_searches` để trống
- [x] Kiểm tra bằng truy vấn `pg_policies`: RLS bật và policy hiển thị trên cả 9 bảng
- [~] Bucket lưu file gốc: không khả dụng → xem sai lệch ở trên
- [x] Viết `supabase/functions/kt-crawl-sources/index.ts` (CORS + OPTIONS, node-html-parser + dự phòng regex, dedupe theo fingerprint, cập nhật trạng thái nguồn)
- [x] Deploy `kt-crawl-sources` (đã xác nhận chạy được)
- [x] Cập nhật `src/index.css` + `tailwind.config.ts`: primary teal, sidebar navy, success/warning/info, shadow/gradient token
- [x] Thêm dependency: `mammoth`, `pdfjs-dist`, `react-markdown`, `remark-gfm`
- [x] `AuthContext` + `AuthGuard` đúng chuẩn session
- [x] Trang `Login` có cả đăng nhập và đăng ký
- [x] `AppLayout` dùng `ui/sidebar`, 5 mục điều hướng + thông tin người dùng + đăng xuất
- [x] `src/lib/file-extract.ts` trích văn bản TXT/MD/CSV/DOCX/PDF
- [x] `src/lib/export-article.ts` xuất `.md` (front-matter) và `.json`
- [x] Hook `useDocuments` / `useKeywords` / `useArticles` / `useSources` / `useReferenceData` / `useStats`
- [x] Trang `Documents` + lọc/tìm kiếm/phân trang + dialog thêm-sửa + dialog upload + nút Quét ngay
- [x] Trang `DocumentDetail` xem toàn văn, gắn từ khóa, đổi trạng thái, sửa, xóa
- [x] Trang `Keywords` CRUD + lọc nhanh theo mức độ quan tâm + đếm liên kết
- [x] Trang `Articles` danh sách + đổi trạng thái duyệt + xuất file
- [x] Trang `ArticleEditor` markdown editor + preview + đếm từ + gắn nguồn/từ khóa
- [x] Trang `Settings` quản lý nguồn cào, loại văn bản, nhóm chủ đề
- [x] Trang `Dashboard` KPI + 2 biểu đồ recharts + 2 danh sách gần đây + cảnh báo sắp hết hiệu lực
- [x] Cập nhật `src/router.tsx` và `src/App.tsx`; xóa `src/pages/Index.tsx`
- [x] `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` đều pass

## Verification checklist

- [x] **RLS (âm tính):** gọi REST bằng vai trò `anon` vào `kt_documents`, `kt_keywords`, `kt_articles`, `profiles` đều trả về 0 dòng dù bảng đã có dữ liệu seed
- [x] **Chặn truy cập (âm tính):** mở `/documents` khi chưa đăng nhập → hiển thị trang đăng nhập (AuthGuard hoạt động), đã chụp ảnh ở cả desktop và mobile
- [x] **Function đã deploy:** gọi `kt-crawl-sources` trả HTTP 200 và kết quả JSON đúng cấu trúc; khi chưa đăng nhập hàm báo không có nguồn nào (RLS chặn)
- [x] **Bộ trích xuất (dương tính):** chạy lại đúng logic trích xuất trên trang UEL thật → tiêu đề "Chuẩn mực số 2: Hàng tồn kho", 14.411 ký tự toàn văn sạch, không còn sót ký tự HTML như `&Agrave;`
- [x] **Bộ lọc liên kết (biên):** trang danh mục UEL có 18 liên kết khớp `chuan-muc-`; đã loại chính trang danh mục khỏi danh sách để không lưu nhầm
- [x] **Cú pháp truy vấn:** 9 dạng truy vấn PostgREST mà app dùng (embed bảng, đếm liên kết, lọc ilike, phân trang, lọc ngày) đều trả HTTP 200
- [x] **Giao diện:** chụp trang đăng nhập ở `desktop_1280` và `mobile_390` — không tràn ngang, bố cục gọn
- [x] **Build:** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` pass
- [ ] **Cào dữ liệu (dương tính) trong app:** bấm "Quét ngay" sau khi đăng nhập → cần bạn thực hiện, tôi không có phiên đăng nhập để chạy
- [ ] **Chống trùng (biên):** bấm "Quét ngay" lần hai → kỳ vọng `inserted = 0`
- [ ] **Upload file (dương tính/âm tính):** tải 1 file TXT/PDF và 1 PDF scan — cần bạn thực hiện
- [ ] **Giao diện sau đăng nhập:** dashboard, bảng dữ liệu, biểu đồ — chưa xác minh bằng ảnh chụp vì tôi không đăng nhập được

---

## Giai đoạn sau (ngoài phạm vi lần này, schema đã sẵn sàng)

1. **AI sinh bài** — Enter AI capability + backend function: dùng `kt_documents.raw_text` làm ngữ cảnh, ghi vào `kt_articles` với `origin = 'ai'`
2. **Validator chống ảo giác** — chuyển `Validator` (trùng câu, đối chiếu số liệu, đối chiếu điều/thông tư được dẫn chiếu với văn bản gốc)
3. **JSON-LD Schema (FAQPage/Article)** trong `kt_articles`
4. **Đa kênh** — WordPress REST (secret), social snippet, newsletter, thông báo Telegram
5. **Internal link tự động** — dùng `kt_article_keywords` + `kt_document_keywords`
6. **Lịch chạy tự động** — cần cơ chế cron ngoài (Enter không có cron native)
7. **Lưu file gốc** — bổ sung bucket lưu trữ khi hạ tầng cho phép, đổ vào cột `file_path`

