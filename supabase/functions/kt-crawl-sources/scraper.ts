/** Pure extraction rules shared by the Edge Function and offline tests. */
export type Element = {
  nodeType: number; textContent: string; rawTagName?: string; childNodes: Element[];
  getAttribute(name: string): string | undefined;
  querySelectorAll(selector: string): Element[];
  querySelector(selector: string): Element | null;
  remove(): void;
};
export type Link = { url: string; hint: string };
export type Cursor = { sourceId: string; links: Link[]; offset: number; indexUrl: string };
const SKIP = "script,style,noscript,nav,header,footer,aside,form,iframe,svg,.related,.related-news,.related-post,.related_posts,.comments,.comment-content,.popup-content,.advertisement,.ads,.breadcrumb,.menu,.sidebar";

export function publicUrl(input: string, base?: string): string {
  try {
    const url = new URL(input, base);
    const host = url.hostname.toLowerCase();
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.port && !["80", "443"].includes(url.port)) return "";
    if (!host.includes(".") || host.includes(":") || host.includes("[") || /^[\d.]+$/.test(host) || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)) return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    return url.toString();
  } catch { return ""; }
}

export function isDetailLink(link: Link, indexUrl: string, filter: string | null): boolean {
  const normalized = publicUrl(link.url, indexUrl);
  if (!normalized || normalized === publicUrl(indexUrl)) return false;
  const url = new URL(normalized);
  if (url.origin !== new URL(indexUrl).origin || filter && !url.href.includes(filter)) return false;
  if (/\.(?:pdf|docx?|xlsx?|zip|png|jpe?g|gif|svg|mp4|css|js)$/i.test(url.pathname)) return false;
  if (/(?:^|\/)(?:category|categories|chuyen-muc|tag|tags|search|tim-kiem|author|login|dang-nhap|lien-he|khoa-hoc)(?:\/|$)/i.test(url.pathname)) return false;
  const hint = link.hint.trim();
  if (hint.length < 18 || /^(?:chuyên mục|xem thêm|đọc thêm|trang chủ|đăng nhập|liên hệ|giới thiệu|video|podcast)(?:\s|$)/iu.test(hint)) return false;
  return true;
}

export function collectLinks(root: Element, indexUrl: string, filter: string | null): Link[] {
  for (const node of root.querySelectorAll(SKIP)) node.remove();
  const seen = new Set<string>();
  const links: Link[] = [];
  const containers = root.querySelectorAll(".list-news-subfolder");
  const anchors = containers.length
    ? containers.flatMap(node => node.querySelectorAll("a[href]"))
    : (root.querySelector("main") ?? root).querySelectorAll("a[href]");
  for (const anchor of anchors) {
    const link = { url: publicUrl(anchor.getAttribute("href") ?? "", indexUrl), hint: anchor.textContent.replace(/\s+/g, " ").trim().slice(0, 300) };
    if (!isDetailLink(link, indexUrl, filter) || seen.has(link.url)) continue;
    seen.add(link.url);
    links.push(link);
    if (links.length === 100) break;
  }
  return links;
}

function plain(node: Element): string {
  const parts: string[] = [];
  const walk = (current: Element) => {
    if (current.nodeType === 3) { parts.push(current.textContent); return; }
    const block = /^(?:p|div|li|tr|section|article|blockquote|h[1-6]|br)$/.test((current.rawTagName ?? "").toLowerCase());
    if (block) parts.push("\n");
    for (const child of current.childNodes ?? []) walk(child);
    if (block) parts.push("\n");
  };
  walk(node);
  return parts.join("").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function dateOnly(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  return !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date ? date : null;
}

export function extractPage(root: Element): { title: string; text: string; issuedDate: string | null } | null {
  const meta = (selector: string) => root.querySelector(selector)?.getAttribute("content");
  const headline = root.querySelector("h1")?.textContent.trim();
  const title = (headline || meta('meta[property="og:title"]') || "").replace(/\s+/g, " ").trim();
  if (title.length < 18 || /^(chuyên mục|danh mục)\s/iu.test(title) || /^(trang chủ|media luật|foreign investors|tin pháp luật)$/iu.test(title)) return null;
  const issuedDate = dateOnly(meta('meta[property="article:published_time"]')) ?? dateOnly(meta('meta[itemprop="datePublished"]')) ?? dateOnly(root.querySelector("time[datetime]")?.getAttribute("datetime"));
  const articleMetadata = meta('meta[property="og:type"]') === "article";
  for (const node of root.querySelectorAll(SKIP)) node.remove();
  const selectors = ['[itemprop="articleBody"]', ".fck_detail", ".entry-content", ".article-body", ".article__body", ".detail-content", ".content-detail", ".content_detail", ".contentdetail", ".doc-content", "#divContent", "#contentBody", ".singular-content", ".bot-content"];
  const candidates = new Set<Element>();
  for (const selector of selectors) for (const node of root.querySelectorAll(selector)) if (candidates.size < 12) candidates.add(node);
  const articles = root.querySelectorAll("article");
  if (articles.length === 1 && (headline || articleMetadata)) candidates.add(articles[0]);
  if (!candidates.size && articleMetadata) { const main = root.querySelector("main"); if (main) candidates.add(main); }
  let best = "";
  for (const node of candidates) {
    const text = plain(node);
    if (text.length < 500) continue;
    const linkedChars = node.querySelectorAll("a").reduce((total, link) => total + link.textContent.trim().length, 0);
    if (linkedChars / text.length > 0.3 || node.querySelectorAll("h2,h3").length > 20) continue;
    if (text.length > best.length) best = text;
  }
  if (!best || /(?:just a moment|verify you are human|access denied|captcha)/i.test(title)) return null;
  return { title: title.slice(0, 300), text: best.slice(0, 80000), issuedDate };
}

export function readCursor(value: unknown): Cursor | null {
  if (value == null) return null;
  if (typeof value !== "object") throw new Error("Vị trí quét không hợp lệ.");
  const c = value as Cursor;
  if (typeof c.sourceId !== "string" || !Array.isArray(c.links) || c.links.length > 100 || !Number.isInteger(c.offset) || c.offset < 0 || c.offset > c.links.length || typeof c.indexUrl !== "string") throw new Error("Vị trí quét không hợp lệ.");
  if (c.links.some(link => !link || typeof link.url !== "string" || link.url.length > 2048 || typeof link.hint !== "string" || link.hint.length > 300)) throw new Error("Danh sách tiếp tục quét không hợp lệ.");
  return c;
}

export const DESKS: Record<string, { code: string; name: string }> = {
  ke_toan: { code: "CONTENT_KE_TOAN", name: "Kế toán" }, thue: { code: "CONTENT_THUE", name: "Thuế" },
  tai_chinh: { code: "CONTENT_TAI_CHINH", name: "Tài chính" }, tin_hot: { code: "CONTENT_TIN_HOT", name: "Tin nóng" },
};
