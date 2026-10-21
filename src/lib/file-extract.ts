import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export type ExtractResult = {
  text: string;
  warnings: string[];
};

const MIN_USEFUL_CHARS = 300;

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

async function extractFromDocx(file: File): Promise<string> {
  const mod = await import("mammoth/mammoth.browser.js");
  const mammoth = mod.default ?? mod;
  const { value } = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return value ?? "";
}

async function extractFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;

  const pages: string[] = [];
  for (let index = 1; index <= doc.numPages; index += 1) {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    pages.push(line);
  }
  await doc.destroy();
  return pages.join("\n\n");
}

/**
 * Trích xuất văn bản thuần từ file người dùng tải lên.
 * Hỗ trợ: .txt .md .csv .docx .pdf
 */
export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const extension = extensionOf(file.name);
  const warnings: string[] = [];
  let raw = "";

  if (["txt", "md", "csv", "text"].includes(extension)) {
    raw = await file.text();
  } else if (extension === "docx") {
    raw = await extractFromDocx(file);
  } else if (extension === "pdf") {
    raw = await extractFromPdf(file);
    if (raw.trim().length < MIN_USEFUL_CHARS) {
      warnings.push(
        "File PDF có thể là bản scan (ảnh) nên không trích được văn bản. Bạn hãy dán nội dung bằng tay để lưu vào kho.",
      );
    }
  } else if (extension === "doc") {
    throw new Error(
      "File .doc (Word cũ) chưa được hỗ trợ. Bạn hãy lưu lại thành .docx rồi tải lên.",
    );
  } else {
    throw new Error(
      `Định dạng .${extension || "?"} chưa được hỗ trợ. Chỉ nhận .txt, .md, .csv, .docx và .pdf.`,
    );
  }

  const text = normalize(raw);
  if (!text) {
    warnings.push("Không đọc được nội dung văn bản nào từ file này.");
  }
  return { text, warnings };
}

export const SUPPORTED_UPLOAD_HINT = ".txt, .md, .csv, .docx, .pdf";
