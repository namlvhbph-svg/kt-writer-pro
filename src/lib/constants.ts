export type Tone = "success" | "warning" | "info" | "muted" | "danger" | "primary";

export type Option = { value: string; label: string; tone?: Tone };

/** Nhóm văn bản – dùng cho kt_doc_types.doc_group và kt_sources.doc_group */
export const DOC_GROUPS: Option[] = [
  { value: "tai_chinh", label: "Tài chính", tone: "success" },
  { value: "tin_hot", label: "Tin nóng", tone: "danger" },
  { value: "ke_toan", label: "Kế toán", tone: "primary" },
  { value: "thue", label: "Thuế", tone: "info" },
  { value: "bhxh", label: "BHXH – BHYT – BHTN", tone: "warning" },
  { value: "khac", label: "Khác", tone: "muted" },
];

/** Tình trạng hiệu lực pháp lý */
export const LEGAL_STATUSES: Option[] = [
  { value: "con_hieu_luc", label: "Còn hiệu lực", tone: "success" },
  { value: "sap_het_hieu_luc", label: "Sắp hết hiệu lực", tone: "warning" },
  { value: "chua_hieu_luc", label: "Chưa có hiệu lực", tone: "info" },
  { value: "het_hieu_luc", label: "Hết hiệu lực", tone: "muted" },
  { value: "khong_xac_dinh", label: "Chưa xác định", tone: "muted" },
];

/** Trạng thái xử lý nội bộ của một văn bản */
export const REVIEW_STATUSES: Option[] = [
  { value: "moi", label: "Mới", tone: "info" },
  { value: "dang_xu_ly", label: "Đang xử lý", tone: "warning" },
  { value: "da_xu_ly", label: "Đã xử lý", tone: "success" },
];

/** Cách văn bản vào kho */
export const DOC_ORIGINS: Option[] = [
  { value: "cao_tu_dong", label: "Cào tự động", tone: "primary" },
  { value: "upload", label: "Tải file lên", tone: "info" },
  { value: "nhap_tay", label: "Nhập tay", tone: "muted" },
];

/** Loại bài viết – giữ nguyên ARTICLE_TYPES trong main.py */
export const ARTICLE_TYPES: Option[] = [
  { value: "tin-nong", label: "Bản tin thời sự" },
  { value: "huong-dan", label: "Hướng dẫn thực hành" },
  { value: "tom-tat", label: "Tóm tắt dễ hiểu" },
  { value: "so-sanh", label: "So sánh với IFRS" },
  { value: "phan-tich", label: "Phân tích chuyên sâu" },
  { value: "case-study", label: "Tình huống thực tế" },
];

/** Trạng thái duyệt bài – tương ứng validation_status trong main.py */
export const ARTICLE_STATUSES: Option[] = [
  { value: "nhap", label: "Nháp", tone: "muted" },
  { value: "cho_duyet", label: "Chờ duyệt", tone: "info" },
  { value: "dat", label: "Đạt", tone: "success" },
  { value: "can_duyet", label: "Cần duyệt lại", tone: "warning" },
  { value: "xuat_ban", label: "Đã xuất bản", tone: "primary" },
];

/** Loại từ khóa SEO */
export const KEYWORD_TYPES: Option[] = [
  { value: "primary", label: "Chính", tone: "primary" },
  { value: "secondary", label: "Phụ", tone: "info" },
  { value: "long_tail", label: "Đuôi dài", tone: "muted" },
];

/** Mức độ quan tâm thị trường */
export const TREND_FLAGS: Option[] = [
  { value: "hot", label: "Đang hot", tone: "danger" },
  { value: "dang_len", label: "Đang lên", tone: "warning" },
  { value: "on_dinh", label: "Ổn định", tone: "muted" },
];

export const KEYWORD_STATUSES: Option[] = [
  { value: "active", label: "Đang theo dõi", tone: "success" },
  { value: "paused", label: "Tạm dừng", tone: "muted" },
];

export const PRIORITY_OPTIONS: Option[] = [
  { value: "1", label: "1 – Ưu tiên cao nhất" },
  { value: "2", label: "2 – Cao" },
  { value: "3", label: "3 – Trung bình" },
  { value: "4", label: "4 – Thấp" },
  { value: "5", label: "5 – Thấp nhất" },
];

export function labelOf(options: Option[], value?: string | null): string {
  if (!value) return "—";
  return options.find((item) => item.value === value)?.label ?? value;
}

export function toneOf(options: Option[], value?: string | null): Tone {
  if (!value) return "muted";
  return options.find((item) => item.value === value)?.tone ?? "muted";
}

/** Ngưỡng cảnh báo văn bản sắp hết hiệu lực (ngày) */
export const EXPIRY_WARNING_DAYS = 60;
/** Ngưỡng coi là "văn bản mới" (ngày) */
export const NEW_DOCUMENT_DAYS = 30;
