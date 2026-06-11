import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merges Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a Firestore Timestamp or Date to a locale date string */
export function formatDate(date: Date | { toDate: () => Date } | null | undefined): string {
  if (!date) return "—"
  const d = "toDate" in date ? date.toDate() : date
  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Calculate age in years from a Date or Firestore Timestamp */
export function calcAge(dob: Date | { toDate: () => Date } | null | undefined): string {
  if (!dob) return "—"
  const d = "toDate" in dob ? dob.toDate() : dob
  const diff = Date.now() - d.getTime()
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  return `${age} años`
}

/** Auto-flag a numeric result given min/max range */
export function autoFlag(
  value: number | string,
  min?: number,
  max?: number
): "H" | "L" | "N" | undefined {
  const n = Number(value)
  if (isNaN(n) || min === undefined || max === undefined) return undefined
  if (n > max) return "H"
  if (n < min) return "L"
  return "N"
}
