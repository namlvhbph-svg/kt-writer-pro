import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "node-html-parser";
import { collectLinks, extractPage, dateOnly, publicUrl, readCursor, DESKS } from "../supabase/functions/kt-crawl-sources/scraper.ts";
import { fetchHtml } from "../supabase/functions/kt-crawl-sources/network.ts";

const body = "Doanh nghiệp cần đối chiếu chứng từ, sổ kế toán và hồ sơ thuế trước khi lập báo cáo. ".repeat(12);
const page = (content, head = "") => parse(`<html><head>${head}</head><body>${content}</body></html>`);
const index = "https://news.example.com/kinh-te";
test("discovery rejects menus, categories, foreign domains and files; removes tracking", () => {
  const root = page(`<nav><a href="/menu">Một liên kết menu rất dài</a></nav>
    <a href="/chuyen-muc/thue">Chuyên mục thuế phí lệ phí</a>
    <a href="https://other.example.com/news">Một bài từ tên miền khác</a>
    <a href="/download.pdf">Tải toàn văn văn bản quy định</a>
    <a href="/bai-viet-123.html?utm_source=menu#top">Hướng dẫn kiểm tra hồ sơ kế toán</a>
    <a href="/bai-viet-123.html">Hướng dẫn kiểm tra hồ sơ kế toán</a>`);
  assert.deepEqual(collectLinks(root, index, null), [{ url: "https://news.example.com/bai-viet-123.html", hint: "Hướng dẫn kiểm tra hồ sơ kế toán" }]);
});
test("link substring filters still apply", () => {
  assert.equal(collectLinks(page('<a href="/news/123">Hướng dẫn kiểm tra chứng từ</a>'), index, "/legal/").length, 0);
});
test("article content excludes navigation, related links, scripts and ads", () => {
  const doc = extractPage(page(`<h1>Kiểm tra chứng từ trước khi lập báo cáo</h1><nav>MENU</nav><div class="content">WRONG GENERIC WRAPPER</div><article><p>${body}</p><aside>SIDEBAR</aside><div class="related">RELATED</div><script>BAD_SCRIPT</script><p>Kết luận và lưu ý.</p></article>`, '<meta property="article:published_time" content="2026-10-23T08:00:00+07:00">'));
  assert.ok(doc.text.includes("Kết luận và lưu ý."));
  assert.equal(doc.issuedDate, "2026-10-23");
  assert.doesNotMatch(doc.text, /MENU|SIDEBAR|RELATED|BAD_SCRIPT|WRONG/);
});
test("warehouse does not accept catalog listings or arbitrary body fallback", () => {
  assert.equal(extractPage(page(`<h1>Chuyên mục thuế phí lệ phí</h1><div class="detail-content">${body}</div>`)), null);
  assert.equal(extractPage(page(`<h1>Các bài viết mới trong tuần này</h1><article>${body}</article><article>${body}</article>`)), null);
  assert.equal(extractPage(page(`<h1>Trang thông tin kinh tế tài chính</h1><div class="content">${body}</div>`)), null);
});
test("link-heavy containers cannot be mistaken for an article", () => {
  assert.equal(extractPage(page(`<h1>Danh sách tin tức cập nhật ngày hôm nay</h1><div class="detail-content"><a href="/1">${body}</a></div>`)), null);
});
test("known accounting, tax and news article containers are supported", () => {
  for (const selector of ["entry-content", "fck_detail", "detail-content", "article-body", "doc-content", "bot-content"]) {
    assert.ok(extractPage(page(`<h1>Phân tích chi phí và quản trị tài chính</h1><div class="${selector}"><p>${body}</p></div>`)));
  }
  assert.equal(Object.keys(DESKS).length, 4);
});
test("unknown dates stay null and invalid dates are rejected", () => {
  assert.equal(dateOnly("2026-02-30"), null);
  assert.equal(dateOnly(undefined), null);
  assert.equal(extractPage(page(`<h1>Phân tích chi phí và quản trị tài chính</h1><article>${body}</article>`)).issuedDate, null);
});
test("cursor snapshots preserve position after rejected pages and enforce bounds", () => {
  const c = { sourceId: "source-1", indexUrl: index, offset: 2, links: [1, 2, 3].map(n => ({ url: `https://news.example.com/news/${n}`, hint: "Một tiêu đề bài viết đầy đủ" })) };
  assert.equal(readCursor(JSON.parse(JSON.stringify(c))).links.slice(c.offset)[0].url, "https://news.example.com/news/3");
  for (const offset of [-1, 4, 0.5]) assert.throws(() => readCursor({ ...c, offset }));
  assert.throws(() => readCursor({ ...c, links: Array(101).fill(c.links[0]) }));
});
test("URLs reject local addresses, credentials and non-web protocols", () => {
  for (const url of ["http://127.0.0.1/", "http://169.254.169.254/", "http://[::1]/", "http://localhost/", "https://a.internal/", "file:///tmp/x", "https://user:pass@example.com/", "https://example.com:444/"]) assert.equal(publicUrl(url), "");
});
test("downloads reject oversized, non-HTML and external redirects", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("x".repeat(700001), { headers: { "content-type": "text/html" } });
    await assert.rejects(fetchHtml(index, Date.now() + 10000), /700 KB/);
    globalThis.fetch = async () => new Response("pdf", { headers: { "content-type": "application/pdf" } });
    await assert.rejects(fetchHtml(index, Date.now() + 10000), /HTML/);
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { location: "https://other.example.com/" } });
    await assert.rejects(fetchHtml(index, Date.now() + 10000), /tên miền khác/);
    globalThis.fetch = async () => new Response("<html>ok</html>", { headers: { "content-type": "text/html" } });
    assert.equal(await fetchHtml(index, Date.now() + 10000), "<html>ok</html>");
  } finally { globalThis.fetch = original; }
});
