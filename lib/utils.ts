import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toMALSlug(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
}

export function toJKAnimeSlug(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}

// MAL's CDN serves the same image at different sizes via a suffix before the extension.
// `.../12345.jpg` (medium ~225px) → `.../12345l.jpg` (large ~500px).
export function upgradeMalImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (!url.includes('cdn.myanimelist.net')) return url;
  return url.replace(/([^/]+?)(l|t)?\.(jpg|jpeg|webp|png)(\?.*)?$/i, (_, base, _size, ext, qs) => {
    return `${base}l.${ext}${qs ?? ''}`;
  });
}
