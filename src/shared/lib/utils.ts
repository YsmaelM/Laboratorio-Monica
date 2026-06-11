import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merges Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Helper to parse different date types (Firestore Timestamp, serialized timestamp, Date, string) */
function parseDate(val: any): Date | null {
  if (!val) return null
  if (typeof val.toDate === "function") {
    return val.toDate()
  }
  if (typeof val === "object" && "seconds" in val && typeof val.seconds === "number") {
    return new Date(val.seconds * 1000)
  }
  if (val instanceof Date) {
    return val
  }
  const parsed = new Date(val)
  return isNaN(parsed.getTime()) ? null : parsed
}

/** Format a Firestore Timestamp or Date to a locale date string */
export function formatDate(date: any): string {
  const d = parseDate(date)
  if (!d) return "—"
  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Calculate age in years from a Date or Firestore Timestamp */
export function calcAge(dob: any): string {
  const d = parseDate(dob)
  if (!d) return "—"
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
