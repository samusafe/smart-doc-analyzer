import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Build common fetch headers with optional token and language.
export function buildAuthHeaders(token?: string, lang?: string): HeadersInit {
  const h: Record<string,string> = { 'Accept': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (lang) h['Accept-Language'] = lang;
  return h;
}
