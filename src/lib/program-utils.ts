import type { Locale } from "./localization";
import type { Program } from "./types";

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function formatDate(value: string | null, locale: Locale = "en"): string {
  if (!value) {
    return locale === "bg" ? "Постоянен прием" : "Rolling";
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function daysUntilDeadline(program: Program): number | null {
  if (!program.deadline) {
    return null;
  }

  const deadline = new Date(`${program.deadline}T00:00:00.000Z`);
  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  return Math.ceil((deadline.getTime() - startOfTodayUtc().getTime()) / 86_400_000);
}

export function deadlineLabel(program: Program, locale: Locale = "en"): string {
  const days = daysUntilDeadline(program);

  if (program.status === "rolling") {
    return locale === "bg" ? "Постоянен прием" : "Rolling";
  }

  if (days === null) {
    return formatDate(program.deadline, locale);
  }

  if (days < 0) {
    return locale === "bg" ? "Затворена" : "Closed";
  }

  if (days === 0) {
    return locale === "bg" ? "Днес" : "Today";
  }

  if (days <= 14) {
    if (locale === "bg") {
      return days === 1 ? "1 ден остава" : `${days} дни остават`;
    }
    return `${days} days left`;
  }

  return formatDate(program.deadline, locale);
}
