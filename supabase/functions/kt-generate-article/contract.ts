export type Brief = {
  desk: string; topic: string; audience: string; articleType: string;
  targetWords: number; instructions: string; documentId: string;
};
export function validateBrief(value: unknown): Brief {
  if (!value || typeof value !== "object") throw new Error("Yêu cầu không hợp lệ.");
  const b = value as Record<string, unknown>;
  for (const key of ["desk", "topic", "audience", "articleType", "instructions", "documentId"]) {
    if (typeof b[key] !== "string") throw new Error(`Thiếu trường ${key}.`);
  }
  if (!["ke_toan", "thue", "tai_chinh", "tin_hot"].includes(b.desk as string)) throw new Error("Chuyên mục không hợp lệ.");
  if (!["huong-dan", "tom-tat", "so-sanh", "phan-tich", "case-study", "tin-nong"].includes(b.articleType as string)) throw new Error("Loại bài không hợp lệ.");
  if ((b.topic as string).trim().length < 10 || (b.topic as string).length > 300) throw new Error("Chủ đề cần từ 10–300 ký tự.");
  if (!(b.audience as string).trim() || (b.audience as string).length > 300 || (b.instructions as string).length > 2000) throw new Error("Độc giả hoặc yêu cầu biên tập không hợp lệ.");
  if (!Number.isInteger(b.targetWords) || (b.targetWords as number) < 300 || (b.targetWords as number) > 2000) throw new Error("Độ dài cần từ 300–2.000 từ.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.documentId as string)) throw new Error("Vui lòng chọn tài liệu nguồn.");
  return b as unknown as Brief;
}

export function validateNewsDate(date: string | null, now = Date.now()) {
  const timestamp = date ? Date.parse(date) : NaN;
  if (!Number.isFinite(timestamp) || timestamp > now || now - timestamp > 72 * 3600000) {
    throw new Error("Tin nóng cần nguồn có ngày ban hành/đăng trong 72 giờ gần đây. Hãy cập nhật ngày nguồn trong kho tài liệu.");
  }
}

export function validateDraft(value: unknown): { title: string; metaDescription: string; contentMd: string } {
  if (!value || typeof value !== "object") throw new Error("AI trả về dữ liệu không hợp lệ.");
  const draft = value as Record<string, unknown>;
  for (const key of ["title", "metaDescription", "contentMd"]) {
    if (typeof draft[key] !== "string" || !(draft[key] as string).trim()) throw new Error("AI trả về bài viết thiếu nội dung. Vui lòng thử lại.");
  }
  if ((draft.title as string).length > 300 || (draft.metaDescription as string).length > 160 || (draft.contentMd as string).length > 60000) throw new Error("Nội dung AI vượt giới hạn cho phép.");
  return draft as { title: string; metaDescription: string; contentMd: string };
}
