/** Sinh khóa nhận dạng 16 ký tự, cùng thuật toán với Database.save_source trong main.py */
export async function fingerprintValue(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("duplicate key")) {
    if (lower.includes("slug")) {
      return "Đường dẫn (slug) này đã được dùng cho bài viết khác.";
    }
    if (lower.includes("term")) {
      return "Từ khóa này đã tồn tại trong nhóm chủ đề đã chọn.";
    }
    return "Bản ghi này đã có trong kho (trùng khóa nhận dạng), không thể thêm lần nữa.";
  }
  if (lower.includes("violates foreign key")) {
    return "Không thực hiện được vì bản ghi đang được dữ liệu khác tham chiếu.";
  }
  if (lower.includes("row-level security") || lower.includes("jwt")) {
    return "Phiên đăng nhập không còn hiệu lực. Hãy đăng nhập lại rồi thử tiếp.";
  }
  if (lower.includes("invalid input syntax for type date")) {
    return "Ngày tháng nhập chưa đúng định dạng.";
  }
  return message;
}
