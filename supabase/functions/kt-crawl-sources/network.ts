import { publicUrl } from "./scraper.ts";

export async function fetchHtml(input: string, deadline: number): Promise<string> {
  let url = publicUrl(input);
  if (!url) throw new Error("URL nguồn phải là địa chỉ HTTP/HTTPS công khai.");
  const origin = new URL(url).origin;
  const timeout = Math.min(10000, deadline - Date.now());
  if (timeout <= 0) throw new Error("Đã hết thời gian của đợt quét.");
  const signal = AbortSignal.timeout(timeout);
  for (let redirect = 0; redirect < 4; redirect++) {
    const response = await fetch(url, { signal, redirect: "manual", headers: { "User-Agent": "KTWriterSourceCollector/2.0", Accept: "text/html,application/xhtml+xml", "Accept-Language": "vi,en;q=0.8" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = publicUrl(response.headers.get("location") ?? "", url);
      await response.body?.cancel();
      if (!next || new URL(next).origin !== origin) throw new Error("Nguồn chuyển sang tên miền khác; hãy cập nhật URL cấu hình.");
      url = next; continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Nguồn trả về HTTP ${response.status}.`); }
    if (!/text\/html|application\/xhtml\+xml/i.test(response.headers.get("content-type") ?? "")) { await response.body?.cancel(); throw new Error("Nguồn không trả về HTML; chưa hỗ trợ PDF/RSS ở bộ quét này."); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Nguồn không trả về nội dung.");
    const decoder = new TextDecoder();
    let bytes = 0, text = "";
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 700000) throw new Error("Trang lớn hơn 700 KB, bỏ qua để tránh vượt giới hạn xử lý.");
        text += decoder.decode(chunk.value, { stream: true });
      }
      return text + decoder.decode();
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  }
  throw new Error("Nguồn chuyển hướng quá nhiều lần.");
}
