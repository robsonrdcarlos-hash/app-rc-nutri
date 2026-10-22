import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata qualquer valor de data (string ISO, YYYY-MM-DD ou objeto Date) para DD/MM/AAAA.
 */
export function formatSafeDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return "-";
    const day = String(dateInput.getDate()).padStart(2, "0");
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }
  const str = String(dateInput).trim();
  if (!str) return "-";
  const datePart = str.includes("T") ? str.split("T")[0] : str;
  const parts = datePart.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("pt-BR");
  }
  return str;
}

/**
 * Converte data para formato input date HTML (YYYY-MM-DD).
 */
export function toInputDateFormat(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return "";
    return dateInput.toISOString().split("T")[0];
  }
  const str = String(dateInput).trim();
  if (!str) return "";
  if (str.includes("T")) return str.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return "";
}

