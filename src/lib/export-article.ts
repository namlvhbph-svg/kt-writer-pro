import { slugify } from "./format";

export type ArticleExportInput = {
  title: string;
  slug: string;
  metaDescription?: string | null;
  contentMd: string;
  articleType: string;
  documentTitle?: string | null;
  documentUrl?: string | null;
  keywords?: string[];
};

/** Giữ cấu trúc front-matter của Publisher.to_file trong main.py */
export function buildArticleMarkdown(input: ArticleExportInput): string {
  const lines = [
    "---",
    `title: "${input.title.replace(/"/g, '\\"')}"`,
    `slug: "${input.slug}"`,
    `meta_description: "${(input.metaDescription ?? "").replace(/"/g, '\\"')}"`,
    `article_type: "${input.articleType}"`,
  ];
  if (input.documentTitle) {
    lines.push(`source_document: "${input.documentTitle.replace(/"/g, '\\"')}"`);
  }
  if (input.documentUrl) {
    lines.push(`source_url: "${input.documentUrl}"`);
  }
  if (input.keywords?.length) {
    lines.push(`keywords: [${input.keywords.map((k) => `"${k}"`).join(", ")}]`);
  }
  lines.push(`generated_at: "${new Date().toISOString()}"`, "---", "", `# ${input.title}`, "", input.contentMd, "");
  return lines.join("\n");
}

export function buildArticleJson(input: ArticleExportInput): string {
  return JSON.stringify(
    {
      title: input.title,
      slug: input.slug,
      meta_description: input.metaDescription ?? "",
      article_type: input.articleType,
      content_markdown: input.contentMd,
      source_document: input.documentTitle ?? null,
      source_url: input.documentUrl ?? null,
      keywords: input.keywords ?? [],
      exported_at: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportArticleAsMarkdown(input: ArticleExportInput): void {
  const base = slugify(input.slug || input.title) || "bai-viet";
  downloadTextFile(`${base}.md`, buildArticleMarkdown(input), "text/markdown;charset=utf-8");
}

export function exportArticleAsJson(input: ArticleExportInput): void {
  const base = slugify(input.slug || input.title) || "bai-viet";
  downloadTextFile(`${base}.json`, buildArticleJson(input), "application/json;charset=utf-8");
}
