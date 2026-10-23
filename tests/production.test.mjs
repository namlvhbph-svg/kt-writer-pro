import test from "node:test";
import assert from "node:assert/strict";
import { validateBrief, validateDraft, validateNewsDate } from "../supabase/functions/kt-generate-article/contract.ts";
import { productionChecks } from "../src/lib/content-production.ts";

const brief = { desk: "ke_toan", topic: "Kiểm tra chứng từ kế toán", audience: "Kế toán viên", articleType: "huong-dan", targetWords: 1000, instructions: "", documentId: "12345678-1234-1234-1234-123456789abc" };
test("all four desks accept valid briefs", () => {
  for (const desk of ["ke_toan", "thue", "tai_chinh", "tin_hot"]) assert.equal(validateBrief({ ...brief, desk }).desk, desk);
});
test("invalid briefs and oversized generation are rejected", () => {
  for (const patch of [{ desk: "other" }, { topic: "" }, { audience: "" }, { documentId: "" }, { targetWords: 10000 }, { targetWords: "1000" }, { articleType: "fake" }, { instructions: "a".repeat(2001) }]) {
    assert.throws(() => validateBrief({ ...brief, ...patch }));
  }
  assert.throws(() => validateBrief(null));
});
test("news requires a known date within 72 hours, never a future date", () => {
  const now = Date.parse("2026-10-23T12:00:00Z");
  assert.doesNotThrow(() => validateNewsDate("2026-10-22", now));
  for (const date of [null, "invalid", "2026-10-19", "2026-10-24"]) assert.throws(() => validateNewsDate(date, now));
  assert.doesNotThrow(() => validateNewsDate("2026-10-20T12:00:00Z", now));
});
test("partial and malformed AI responses cannot become drafts", () => {
  for (const draft of [null, {}, { title: "Bài viết", metaDescription: "Mô tả", contentMd: "" }, { title: "Bài viết", metaDescription: "a".repeat(161), contentMd: "Nội dung" }]) assert.throws(() => validateDraft(draft));
  assert.equal(validateDraft({ title: "Bài viết", metaDescription: "Mô tả", contentMd: "## Nội dung" }).title, "Bài viết");
});
test("quality checklist detects missing source and unresolved claims", () => {
  const checks = productionChecks("Hướng dẫn kiểm tra chứng từ", "a".repeat(120), "## Nội dung\n" + "từ ".repeat(300) + "[Cần xác minh: thuế suất]", false);
  assert.equal(checks.filter(item => item.pass).length, 4);
  assert.equal(checks.find(item => item.label.includes("nguồn")).pass, false);
  assert.equal(checks.find(item => item.label.includes("chỗ trống")).pass, false);
});
