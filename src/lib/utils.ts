import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera una sugerencia de nombre de usuario en formato oficial:
 * primera letra del nombre + "." + apellido (en minúsculas y sin acentos).
 * Ejemplo: "Roberto Carlos", "Morales Rivas" -> "r.morales"
 */
export function generateUsername(firstName: string, lastName: string): string {
  const cleanFirst = (firstName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const cleanLast = (lastName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const firstLetter = cleanFirst.replace(/[^a-z0-9]/g, "").charAt(0);
  const lastParts = cleanLast.split(/\s+/).filter(Boolean);
  const primaryLast = (lastParts[0] || "").replace(/[^a-z0-9]/g, "");

  if (firstLetter && primaryLast) {
    return `${firstLetter}.${primaryLast}`;
  } else if (firstLetter) {
    return firstLetter;
  } else if (primaryLast) {
    return primaryLast;
  }
  return "";
}
