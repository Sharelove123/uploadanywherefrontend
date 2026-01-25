import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(path: string | undefined | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  // Get API URL from env or default, but we need the base (without /api potentially if media is at root)
  // Actually, traditionally Django serves media at root /media/
  // Let's rely on NEXT_PUBLIC_API_URL or a dedicated one.
  // NEXT_PUBLIC_API_URL is like http://lvh.me:8000/api

  let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  // Strip /api from the end
  baseUrl = baseUrl.replace(/\/api\/?$/, "");

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
}
