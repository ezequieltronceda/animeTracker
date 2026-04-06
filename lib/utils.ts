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
