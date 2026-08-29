import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveUploadUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const apiBase = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://lakshmi-ladies-hostel.onrender.com"
    : "";
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
}
