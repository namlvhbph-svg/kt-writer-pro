import { format, formatDistanceToNow, parseISO, differenceInCalendarDays } from "date-fns";
import { vi } from "date-fns/locale";

const EMPTY = "—";

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = value.length <= 10 ? new Date(`${value}T00:00:00`) : parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value?: string | null): string {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy") : EMPTY;
}

export function formatDateTime(value?: string | null): string {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy HH:mm") : EMPTY;
}

export function formatRelative(value?: string | null): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return `${formatDistanceToNow(date, { locale: vi, addSuffix: true })}`;
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) return EMPTY;
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatBytes(value?: number | null): string {
  if (!value) return EMPTY;
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export function truncate(text: string | null | undefined, max = 120): string {
  if (!text) return EMPTY;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Giữ nguyên quy tắc make_slug trong main.py */
export function slugify(text: string, maxLen = 80): string {
  return text
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

/** Ngày còn lại tới hạn (âm nếu đã qua) */
export function daysUntil(value?: string | null): number | null {
  const date = toDate(value);
  if (!date) return null;
  return differenceInCalendarDays(date, new Date());
}

export function toDateInputValue(value?: string | null): string {
  const date = toDate(value);
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function parseNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/[.\s]/g, "").replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}
