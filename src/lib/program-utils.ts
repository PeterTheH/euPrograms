import type { Program } from "./types";

const currentDate = new Date("2026-05-19T00:00:00.000Z");

export function formatDate(value: string | null): string {
  if (!value) {
    return "Rolling";
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
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

  return Math.ceil((deadline.getTime() - currentDate.getTime()) / 86_400_000);
}

export function deadlineLabel(program: Program): string {
  const days = daysUntilDeadline(program);

  if (program.status === "rolling") {
    return "Rolling";
  }

  if (days === null) {
    return formatDate(program.deadline);
  }

  if (days < 0) {
    return "Closed";
  }

  if (days === 0) {
    return "Today";
  }

  if (days <= 14) {
    return `${days} days left`;
  }

  return formatDate(program.deadline);
}
