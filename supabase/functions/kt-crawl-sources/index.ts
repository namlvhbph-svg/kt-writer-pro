import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { parse } from "https://esm.sh/node-html-parser@6.1.13";
import { collectLinks, DESKS, extractPage, isDetailLink, publicUrl, readCursor, type Cursor, type Element } from "./scraper.ts";
import { fetchHtml } from "./network.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type", "Access-Control-Allow-Methods": "POST,OPTIONS" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fingerprint = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Chỉ hỗ trợ POST." }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return reply({ error: "Vui lòng đăng nhập để quét nguồn." }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: auth, error: authError } = await db.auth.getUser();
    if (authError || !auth.user) return reply({ error: "Phiên đăng nhập không hợp lệ." }, 401);
    const body = await req.json().catch(() => null);
    let cursor: Cursor | null;
    try {
      if (!body || typeof body !== "object" || body.source_id != null && typeof body.source_id !== "string") throw new Error("Yêu cầu quét không hợp lệ.");
      cursor = readCursor(body.cursor);
    } catch (error) { return reply({ error: error instanceof Error ? error.message : "Vị trí quét không hợp lệ." }, 400); }
    let query = db.from("kt_sources").select("id,name,index_url,link_filter,doc_group,is_active").eq("is_active", true).order("id");
    if (body.source_id) query = query.eq("id", body.source_id);
    const { data: sources, error: sourcesError } = await query;
    if (sourcesError) throw sourcesError;
    if (!sources?.length) return reply({ fetched: 0, inserted: 0, skipped: 0, duplicates: 0, rejected: 0, truncated: false, next_cursor: null, errors: ["Không có nguồn đang bật. Vào Cấu hình để thêm URL danh mục và bật nguồn."] });
    const source = sources.find(s => s.id === cursor?.sourceId) ?? sources[0];
    if (cursor && (cursor.sourceId !== source.id || cursor.indexUrl !== source.index_url)) cursor = null;
    const deadline = Date.now() + 28000;
    let fetched = 0, inserted = 0, duplicates = 0, rejected = 0;
    const errors: string[] = [];
    let next: Cursor | null = null;
    try {
      const indexUrl = publicUrl(source.index_url ?? "");
      if (!indexUrl) throw new Error("Chưa cấu hình URL danh mục công khai hợp lệ.");
      if (!cursor || cursor.links.length === 0) {
        const html = await fetchHtml(indexUrl, deadline);
        cursor = { sourceId: source.id, indexUrl: source.index_url, offset: 0, links: collectLinks(parse(html) as unknown as Element, indexUrl, source.link_filter) };
      }
      if (!cursor.links.length) errors.push("Không tìm thấy liên kết bài chi tiết phù hợp. Kiểm tra URL danh mục và bộ lọc.");
      // Limit attempted pages, not successful inserts. Keep the snapshot to resume rejected links too.
      const batch = cursor.links.slice(cursor.offset, cursor.offset + 2);
      const safeLinks = batch.filter(link => isDetailLink(link, indexUrl, source.link_filter));
      const { data: existing, error: existingError } = safeLinks.length
        ? await db.from("kt_documents").select("original_url").in("original_url", safeLinks.map(link => link.url))
        : { data: [], error: null };
      if (existingError) throw existingError;
      const known = new Set((existing ?? []).map(row => row.original_url));
      const desk = DESKS[source.doc_group];
      let groupId: string | null = null;
      if (desk) {
        const { data: group, error } = await db.from("kt_topic_groups").upsert({ code: desk.code, name: desk.name }, { onConflict: "code" }).select("id").single();
        if (error) throw error;
        groupId = group.id;
      }
      for (const link of batch) {
        if (Date.now() > deadline - 1000) break;
        if (!isDetailLink(link, indexUrl, source.link_filter)) { rejected++; cursor.offset++; continue; }
        if (known.has(link.url)) { duplicates++; cursor.offset++; continue; }
        let doc;
        try {
          fetched++;
          doc = extractPage(parse(await fetchHtml(link.url, deadline)) as unknown as Element);
        } catch (error) {
          errors.push(`${link.hint}: ${error instanceof Error ? error.message : "Không tải được trang."}`);
          rejected++; cursor.offset++; continue;
        }
        if (!doc) { rejected++; cursor.offset++; continue; }
        const fp = await fingerprint(link.url);
        const contentFp = await fingerprint(doc.text);
        const { data: sameContent, error: duplicateError } = await db.from("kt_documents").select("id").eq("origin", "cao_tu_dong").like("notes", `%content-sha256:${contentFp}%`).limit(1);
        if (duplicateError) throw duplicateError;
        if (sameContent?.length) { duplicates++; cursor.offset++; continue; }
        const { data: saved, error } = await db.from("kt_documents").upsert({
          title: doc.title, original_url: link.url, raw_text: doc.text, char_count: doc.text.length,
          issued_date: doc.issuedDate, source_id: source.id, topic_group_id: groupId,
          doc_type_id: null, fingerprint: fp, origin: "cao_tu_dong", review_status: "moi", legal_status: "khong_xac_dinh",
          notes: `Nhóm nguồn: ${desk?.name ?? source.doc_group}. Thu thập: ${new Date().toISOString()}. Ngày đăng lấy từ metadata nguồn, chưa xác minh hiệu lực pháp lý. content-sha256:${contentFp}`,
        }, { onConflict: "fingerprint", ignoreDuplicates: true }).select("id");
        if (error) throw error;
        if (saved?.length) inserted++; else duplicates++;
        cursor.offset++;
      }
      if (cursor.offset < cursor.links.length) next = cursor;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Không xử lý được nguồn.");
      if (cursor && cursor.offset < cursor.links.length) next = cursor;
    }
    const followingSource = sources[sources.findIndex(s => s.id === source.id) + 1];
    if (!next && followingSource) next = { sourceId: followingSource.id, indexUrl: followingSource.index_url ?? "", offset: 0, links: [] };
    const { error: statusError } = await db.from("kt_sources").update({ last_crawled_at: new Date().toISOString(), last_crawl_new_count: inserted, last_crawl_status: `${errors.length ? "Có lỗi" : "Đã quét đợt nhỏ"} — thêm ${inserted}, trùng ${duplicates}, loại ${rejected}`, last_crawl_error: errors.length ? errors.join(" | ").slice(0, 3000) : null }).eq("id", source.id);
    if (statusError) errors.push("Không lưu được nhật ký nguồn.");
    console.log(`Crawl source=${source.id} fetched=${fetched} inserted=${inserted} duplicates=${duplicates} rejected=${rejected}`);
    return reply({ fetched, inserted, duplicates, rejected, skipped: duplicates + rejected, truncated: Boolean(next), next_cursor: next, source_name: source.name, errors });
  } catch (error) {
    console.error("Crawl failed", error instanceof Error ? error.message : "Unknown error");
    return reply({ error: "Quét nguồn thất bại. Kiểm tra Logs của kt-crawl-sources." }, 500);
  }
});
