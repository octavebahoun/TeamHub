import { differenceInCalendarDays, format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/** Formats d'affichage partagés (dates françaises, montants FCFA, initiales). */

export const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
};

/** « 8 oct. » (ou « 8 oct. 2027 » hors de l'année courante). */
export function shortDate(value: string | null | undefined, now = new Date()): string {
  const d = toDate(value);
  if (!d) return "—";
  return format(d, d.getFullYear() === now.getFullYear() ? "d MMM" : "d MMM yyyy", { locale: fr });
}

/** Échéance relative : Hier / Aujourd'hui / Demain / « Lun. 5 oct. » / date courte. */
export function dueLabel(value: string | null | undefined, now = new Date()): string {
  const d = toDate(value);
  if (!d) return "Sans échéance";
  const diff = differenceInCalendarDays(d, now);
  if (diff === 0) return "Aujourd'hui";
  if (diff === -1) return "Hier";
  if (diff === 1) return "Demain";
  if (diff > 1 && diff < 7) {
    const s = format(d, "EEE d MMM", { locale: fr });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return shortDate(value, now);
}

export const isOverdue = (value: string | null | undefined, now = new Date()) => {
  const d = toDate(value);
  return !!d && differenceInCalendarDays(d, now) < 0;
};

/** Échéance dans les 24 h (aujourd'hui ou demain) — pour badges Kanban / table. */
export const isDueSoon = (value: string | null | undefined, now = new Date()) => {
  const d = toDate(value);
  if (!d) return false;
  const diff = differenceInCalendarDays(d, now);
  return diff >= 0 && diff <= 1;
};

/** « Jeudi 1er octobre ». */
export function longToday(now = new Date()): string {
  const day = now.getDate() === 1 ? "1er" : String(now.getDate());
  const s = `${format(now, "EEEE", { locale: fr })} ${day} ${format(now, "MMMM", { locale: fr })}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** « il y a 20 min », « hier »… */
export function ago(value: string | null | undefined, now = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  const days = differenceInCalendarDays(now, d);
  if (days === 1) return "Hier";
  if (now.getTime() - d.getTime() < 60_000) return "À l'instant";
  return `Il y a ${formatDistanceToNowStrict(d, { locale: fr })}`;
}

export const time = (value: string | null | undefined) => {
  const d = toDate(value);
  return d ? format(d, "HH:mm") : "";
};

const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** « 1 200 000 FCFA ». Les montants arrivent en chaîne décimale depuis l'API. */
export function money(amount: string | number | null | undefined, withUnit = true): string {
  const n = typeof amount === "string" ? Number(amount) : amount ?? 0;
  const s = fcfa.format(Number.isFinite(n) ? n : 0).replace(/ | /g, " ");
  return withUnit ? `${s} FCFA` : s;
}

/** « 6,95 M » pour les gros montants (tuiles Analytics). */
export function compactMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M`;
  if (amount >= 1_000) return `${(amount / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  return money(amount, false);
}

/** « Octave Bahoun » → « OB ». */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
