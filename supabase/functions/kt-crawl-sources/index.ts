// kt-crawl-sources
// Cào văn bản pháp luật từ các nguồn cấu hình trong kt_sources và ghi vào kho kt_documents.
// Chuyển thể từ Scraper trong main.py (requests + BeautifulSoup -> fetch + node-html-parser).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_LINKS_PER_RUN = 30;
const MAX_DOCUMENT_CHARS = 120000;
const TIME_BUDGET_MS = 100000;
const MIN_CONTENT_CHARS = 300;
const CONTENT_CLASS_RE = /detail|content|article|post/i;

const BLOCK_TAGS = new Set([
  "p", "div", "li", "ul", "ol", "table", "tr", "section", "article",
  "blockquote", "pre", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "br", "hr",
]);

const SKIP_TAGS = new Set([
  "script", "style", "noscript", "svg", "nav", "footer", "aside", "iframe", "form",
]);

type LinkItem = { url: string; hint: string };

type SimpleNode = {
  nodeType: number;
  textContent: string;
  rawTagName?: string;
  childNodes?: SimpleNode[];
  getAttribute(name: string): string | null;
  querySelectorAll(selector: string): SimpleNode[];
};

type DocParser = {
  querySelectorAll(selector: string): SimpleNode[];
};

// ── HTML helpers ────────────────────────────────────────────────────────────

let parseDoc: ((html: string) => DocParser) | null | undefined;

async function getParser(): Promise<((html: string) => DocParser) | null> {
  if (parseDoc !== undefined) return parseDoc;
  try {
    const mod = await import("https://esm.sh/node-html-parser@6.1.13");
    parseDoc = (html: string) => mod.parse(html) as unknown as DocParser;
  } catch (error) {
    console.warn("Không nạp được node-html-parser, dùng bộ lọc regex:", error);
    parseDoc = null;
  }
  return parseDoc;
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ldquo: "\u201c", rdquo: "\u201d", lsquo: "\u2018", rsquo: "\u2019",
  hellip: "\u2026", ndash: "\u2013", mdash: "\u2014",
  agrave: "\u00e0", aacute: "\u00e1", acirc: "\u00e2", atilde: "\u00e3",
  egrave: "\u00e8", eacute: "\u00e9", ecirc: "\u00ea",
  igrave: "\u00ec", iacute: "\u00ed",
  ograve: "\u00f2", oacute: "\u00f3", ocirc: "\u00f4", otilde: "\u00f5",
  ugrave: "\u00f9", uacute: "\u00fa", yacute: "\u00fd",
  Agrave: "\u00c0", Aacute: "\u00c1", Acirc: "\u00c2", Atilde: "\u00c3",
  Egrave: "\u00c8", Eacute: "\u00c9", Ecirc: "\u00ca",
  Igrave: "\u00cc", Iacute: "\u00cd",
  Ograve: "\u00d2", Oacute: "\u00d3", Ocirc: "\u00d4", Otilde: "\u00d5",
  Ugrave: "\u00d9", Uacute: "\u00da", Yacute: "\u00dd",
  Abreve: "\u0102", abreve: "\u0103", Ohorn: "\u01a0", ohorn: "\u01a1",
  Uhorn: "\u01af", uhorn: "\u01b0", deg: "\u00b0", sect: "\u00a7",
  para: "\u00b6", middot: "\u00b7", bull: "\u2022", copy: "\u00a9",
  reg: "\u00ae", trade: "\u2122", euro: "\u20ac", minus: "\u2212",
  times: "\u00d7", divide: "\u00f7", lsquo2: "\u2018",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return " ";
      }
    })
    .replace(/&#(\d+);/g, (_m, dec) => {
      try {
        return String.fromCodePoint(Number(dec));
      } catch {
        return " ";
      }
    })
    .replace(/&([a-z]+);/g, (m, name) => ENTITIES[name] ?? m);
}

function normalizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Duyệt DOM và dựng văn bản thuần, giữ xuống dòng theo khối. */
function nodeToText(node: SimpleNode, out: string[]): void {
  for (const child of node.childNodes ?? []) {
    if (child.nodeType === 3 || child.nodeType === 4) {
      out.push(child.textContent);
      continue;
    }
    const tag = (child.rawTagName ?? "").toLowerCase();
    if (SKIP_TAGS.has(tag)) continue;
    const isBlock = BLOCK_TAGS.has(tag);
    if (isBlock) out.push("\n");
    nodeToText(child, out);
    if (isBlock) out.push("\n");
  }
}

/** Bộ lọc dự phòng khi không nạp được bộ phân tích DOM. */
function stripTagsRegex(html: string): string {
  return normalizeText(
    decodeEntities(
      html
        .replace(
          /<(script|style|noscript|svg|nav|footer|aside)[\s\S]*?<\/\1>/gi,
          " ",
        )
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6]|tr|table|section|article)>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(decodeEntities(href.trim()), base).toString();
  } catch {
    return "";
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "vi,en;q=0.8" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      console.warn(`Thử ${attempt}/3 lỗi khi tải ${url}:`, error);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

async function findLinks(
  html: string,
  pageUrl: string,
  linkFilter: string | null,
): Promise<LinkItem[]> {
  const parser = await getParser();
  const found: LinkItem[] = [];

  if (parser) {
    const root = parser(html);
    for (const a of root.querySelectorAll("a")) {
      found.push({
        url: absoluteUrl(a.getAttribute("href") ?? "", pageUrl),
        hint: a.textContent.trim(),
      });
    }
  } else {
    const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      found.push({
        url: absoluteUrl(match[1], pageUrl),
        hint: stripTagsRegex(match[2]),
      });
    }
  }

  const indexKey = pageUrl.replace(/\/$/, "");
  const seen = new Set<string>([indexKey]);
  const result: LinkItem[] = [];
  for (const item of found) {
    if (!item.url || !/^https?:/i.test(item.url)) continue;
    if (linkFilter && !item.url.includes(linkFilter)) continue;
    const key = item.url.replace(/\/$/, "");
    // Bỏ qua chính trang danh mục để không lưu nhầm thành một văn bản
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ url: key, hint: item.hint.slice(0, 200) });
  }
  return result;
}

/** Tìm tiêu đề và khối nội dung chính, sau đó chuyển thành văn bản thuần. */
async function extractDocument(
  html: string,
  fallbackTitle: string,
): Promise<{ title: string; text: string }> {
  const parser = await getParser();

  if (parser) {
    const root = parser(html);
    const firstText = (selector: string) => {
      const nodes = root.querySelectorAll(selector);
      return nodes.length ? nodes[0].textContent.trim() : "";
    };

    const title = firstText("h1") || firstText("h2") || firstText("title");

    let contentEl: SimpleNode | null = null;
    for (const tag of ["div", "article", "main", "section"]) {
      for (const el of root.querySelectorAll(tag)) {
        const cls = el.getAttribute("class") ?? "";
        const id = el.getAttribute("id") ?? "";
        if (CONTENT_CLASS_RE.test(cls) || CONTENT_CLASS_RE.test(id)) {
          contentEl = el;
          break;
        }
      }
      if (contentEl) break;
    }
    if (!contentEl) {
      const bodies = root.querySelectorAll("body");
      contentEl = bodies.length ? bodies[0] : root;
    }

    const parts: string[] = [];
    nodeToText(contentEl, parts);

    return {
      title: title || fallbackTitle,
      text: normalizeText(parts.join("")),
    };
  }

  const titleMatch =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ??
    html.match(/<title[^>]*>([\s\S]*?)<\/h1>/i) ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTagsRegex(titleMatch[1]) : "";

  const bodyHtml = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const contentMatch = bodyHtml.match(
    /<div[^>]+(?:class|id)=["'][^"']*(?:detail|content|article|post)[^"']*["'][^>]*>([\s\S]*)/i,
  );

  return {
    title: title || fallbackTitle,
    text: stripTagsRegex(contentMatch ? contentMatch[1] : bodyHtml),
  };
}

// ── Utils ───────────────────────────────────────────────────────────────────

async function fingerprint(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

function inferDocTypeCode(title: string, fallback: string): string {
  const lower = title.toLowerCase();
  if (/thông tư\s*133|tt\s*133/.test(lower)) return "TT133";
  if (/thông tư\s*200|tt\s*200/.test(lower)) return "TT200";
  if (/thông tư\s*99\s*\/\s*2025|tt\s*99\s*\/\s*2025/.test(lower)) return "TT99";
  if (/luật kế toán/.test(lower)) return "LUAT_KT";
  return fallback;
}

// ── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      "";
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!supabaseUrl || !anonKey || !authHeader) {
      console.error("Thiếu cấu hình backend hoặc Authorization header.");
      return new Response(
        JSON.stringify({ error: "Yêu cầu không hợp lệ hoặc chưa đăng nhập." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const sourceId: string | undefined = body?.source_id;

    let sourceQuery = supabase
      .from("kt_sources")
      .select("id, name, base_url, index_url, link_filter, is_active");
    sourceQuery = sourceId
      ? sourceQuery.eq("id", sourceId)
      : sourceQuery.eq("is_active", true);

    const { data: sources, error: sourceError } = await sourceQuery;
    if (sourceError) throw sourceError;
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({
          fetched: 0,
          inserted: 0,
          skipped: 0,
          truncated: false,
          errors: ["Không có nguồn cào nào đang được bật."],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: docTypes } = await supabase
      .from("kt_doc_types")
      .select("id, code");
    const { data: topicGroups } = await supabase
      .from("kt_topic_groups")
      .select("id, code");

    const docTypeByCode = new Map<string, string>(
      (docTypes ?? []).map((t: { code: string; id: string }) => [t.code, t.id]),
    );
    const defaultTopicGroupId =
      (topicGroups ?? []).find(
        (g: { code: string; id: string }) => g.code === "VAS_CHUAN_MUC",
      )?.id ?? null;

    let fetched = 0;
    let inserted = 0;
    let skipped = 0;
    let truncated = false;
    const errors: string[] = [];

    for (const source of sources) {
      let sourceInserted = 0;
      const sourceErrors: string[] = [];
      const indexUrl: string | null = source.index_url?.trim() ?? null;

      if (!indexUrl) {
        sourceErrors.push(`${source.name}: chưa cấu hình URL trang danh mục.`);
      } else {
        const indexHtml = await fetchHtml(indexUrl);
        if (!indexHtml) {
          sourceErrors.push(`${source.name}: không tải được trang danh mục.`);
        } else {
          const links = await findLinks(indexHtml, indexUrl, source.link_filter);
          console.log(
            `Nguồn ${source.name}: tìm thấy ${links.length} liên kết khớp bộ lọc.`,
          );

          for (const link of links) {
            if (Date.now() - startedAt > TIME_BUDGET_MS) {
              truncated = true;
              sourceErrors.push(
                `${source.name}: dừng sớm do hết thời gian xử lý, chạy lại để cào tiếp.`,
              );
              break;
            }
            if (sourceInserted >= MAX_LINKS_PER_RUN) {
              truncated = true;
              break;
            }

            const detailHtml = await fetchHtml(link.url);
            fetched++;
            if (!detailHtml) {
              skipped++;
              continue;
            }

            const doc = await extractDocument(detailHtml, link.hint || "Văn bản");
            if (doc.text.length < MIN_CONTENT_CHARS) {
              skipped++;
              continue;
            }

            const fp = await fingerprint(`${doc.title}|${link.url}`);
            const { data: savedRows, error: insertError } = await supabase
              .from("kt_documents")
              .upsert(
                {
                  title: doc.title.slice(0, 300),
                  doc_type_id:
                    docTypeByCode.get(inferDocTypeCode(doc.title, "VAS")) ??
                    null,
                  topic_group_id: defaultTopicGroupId,
                  source_id: source.id,
                  original_url: link.url,
                  raw_text: doc.text.slice(0, MAX_DOCUMENT_CHARS),
                  char_count: Math.min(doc.text.length, MAX_DOCUMENT_CHARS),
                  fingerprint: fp,
                  origin: "cao_tu_dong",
                  review_status: "moi",
                },
                { onConflict: "fingerprint", ignoreDuplicates: true },
              )
              .select("id");

            if (insertError) {
              sourceErrors.push(
                `${source.name}: lỗi khi lưu "${doc.title.slice(0, 60)}" — ${insertError.message}`,
              );
              continue;
            }
            // ignoreDuplicates: chỉ trả về dòng thực sự được chèn mới
            if (savedRows && savedRows.length > 0) {
              inserted += savedRows.length;
              sourceInserted += savedRows.length;
            } else {
              skipped++;
            }
          }
        }
      }

      errors.push(...sourceErrors);

      await supabase
        .from("kt_sources")
        .update({
          last_crawled_at: new Date().toISOString(),
          last_crawl_new_count: sourceInserted,
          last_crawl_status:
            sourceErrors.length === 0
              ? `Thành công — thêm ${sourceInserted} văn bản mới`
              : `Có lỗi — thêm ${sourceInserted} văn bản mới`,
          last_crawl_error: sourceErrors.length ? sourceErrors.join(" | ") : null,
        })
        .eq("id", source.id);
    }

    console.log(
      `Hoàn tất: fetched=${fetched} inserted=${inserted} skipped=${skipped} truncated=${truncated}`,
    );

    return new Response(
      JSON.stringify({ fetched, inserted, skipped, truncated, errors }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Lỗi không xử lý được khi cào dữ liệu:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
