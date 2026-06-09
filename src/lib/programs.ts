import type { Program, ProgramStatus } from "./types";
import { readPrograms } from "./db";

export async function getPrograms(): Promise<Program[]> {
  const programs = await readPrograms();
  return programs
    .map((program) => ({ ...program, status: inferStatus(program) }))
    .sort(comparePrograms);
}

export async function getProgramById(id: string): Promise<Program | undefined> {
  const programs = await getPrograms();
  return programs.find((program) => program.id === id);
}

export async function getSimilarPrograms(program: Program, limit = 3): Promise<Program[]> {
  const programs = await getPrograms();
  return programs
    .filter((candidate) => candidate.id !== program.id)
    .map((candidate) => ({
      program: candidate,
      score:
        overlap(candidate.sectors, program.sectors) * 3 +
        overlap(candidate.startupStages, program.startupStages) * 2 +
        overlap(candidate.fundingType, program.fundingType) +
        (candidate.regionType === program.regionType ? 2 : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.program);
}

export function inferStatus(program: Program): ProgramStatus {
  if (program.status === "rolling") {
    return "rolling";
  }

  if (!program.deadline) {
    return program.status;
  }

  const today = startOfTodayUtc();
  const deadline = new Date(`${program.deadline}T23:59:59.000Z`);

  if (Number.isNaN(deadline.getTime())) {
    return program.status;
  }

  if (deadline < today) {
    return "closed";
  }

  return program.status === "upcoming" ? "upcoming" : "open";
}

export function daysUntilDeadline(program: Program): number | null {
  if (!program.deadline) {
    return null;
  }

  const today = startOfTodayUtc();
  const deadline = new Date(`${program.deadline}T00:00:00.000Z`);

  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  return Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
}

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

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function comparePrograms(a: Program, b: Program): number {
  const statusRank: Record<ProgramStatus, number> = {
    open: 0,
    rolling: 1,
    upcoming: 2,
    closed: 3
  };

  const statusDiff = statusRank[a.status] - statusRank[b.status];
  if (statusDiff !== 0) {
    return statusDiff;
  }

  const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

function overlap(a: string[], b: string[]): number {
  const right = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => right.has(item.toLowerCase())).length;
}
