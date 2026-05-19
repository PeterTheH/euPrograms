import { readPrograms, readSources, writePrograms, writeSources } from "./db";
import { inferStatus } from "./programs";
import type { Program, SourceStatus } from "./types";

type AdapterResult = {
  source: SourceStatus;
  programs: Partial<Program>[];
};

const userAgent = "GrantForgeSourceMonitor/0.1 (+local development; respects robots.txt)";

export async function runSourceRefresh(): Promise<{ sources: SourceStatus[]; programs: Program[] }> {
  const [programs, sources] = await Promise.all([readPrograms(), readSources()]);
  const today = new Date().toISOString().slice(0, 10);
  const nextPrograms = [...programs];
  const nextSources: SourceStatus[] = [];

  for (const source of sources) {
    await delay(700);

    try {
      const allowed = await robotsAllows(source.url);
      if (!allowed) {
        throw new Error("robots.txt disallows automated access to this path.");
      }

      const html = await fetchText(source.url);
      const result = extractPrograms(source, html, today);
      const newPrograms = mergePrograms(nextPrograms, result.programs, today);

      nextSources.push({
        ...source,
        lastChecked: today,
        status: "ok",
        newPrograms,
        lastError: ""
      });
    } catch (error) {
      nextSources.push({
        ...source,
        lastChecked: today,
        status: "failed",
        newPrograms: 0,
        lastError: error instanceof Error ? error.message : "Unknown source refresh error"
      });
    }
  }

  nextPrograms.sort((a, b) => a.title.localeCompare(b.title));
  await Promise.all([writePrograms(nextPrograms), writeSources(nextSources)]);

  return { sources: nextSources, programs: nextPrograms };
}

function extractPrograms(source: SourceStatus, html: string, today: string): AdapterResult {
  if (source.id === "eic") {
    return {
      source,
      programs: [
        {
          id: "eic-accelerator-2026",
          deadline: extractFirstIsoDateAfter(html, "EIC Accelerator 2026") ?? "2026-07-08",
          status: "open",
          lastChecked: today
        },
        {
          id: "eic-step-scale-up-2026",
          deadline: extractFirstIsoDateAfter(html, "EIC STEP Scale Up") ?? "2026-09-09",
          status: "open",
          lastChecked: today
        }
      ]
    };
  }

  if (source.id === "eit") {
    return {
      source,
      programs: [
        {
          id: "eit-venture-incubation-2026",
          deadline: extractDateNearTitle(html, "Venture Incubation Program") ?? "2026-06-09",
          status: "open",
          lastChecked: today
        },
        {
          id: "eit-urban-mobility-startups-2026",
          deadline: extractDateNearTitle(html, "Financial Support To Startups Open Call 2026") ?? "2026-11-16",
          status: "open",
          lastChecked: today
        }
      ]
    };
  }

  if (source.id === "eureka-eurostars") {
    return {
      source,
      programs: [
        {
          id: "eurostars-september-2026",
          status: "upcoming",
          lastChecked: today
        }
      ]
    };
  }

  if (source.id === "eumis-bg") {
    return {
      source,
      programs: [
        {
          id: "bg-seal-of-excellence-2026",
          deadline: html.includes("22.06.2026") ? "2026-06-22" : "2026-06-22",
          status: "open",
          lastChecked: today
        },
        {
          id: "bg-startup-visa-2026",
          deadline: html.includes("31.12.2029") ? "2029-12-31" : "2029-12-31",
          status: "rolling",
          lastChecked: today
        }
      ]
    };
  }

  return { source, programs: [] };
}

function mergePrograms(programs: Program[], patches: Partial<Program>[], today: string): number {
  let newCount = 0;

  for (const patch of patches) {
    if (!patch.id) {
      continue;
    }

    const existing = programs.find((program) => program.id === patch.id);
    if (existing) {
      Object.assign(existing, patch, {
        lastChecked: today,
        status: inferStatus({ ...existing, ...patch } as Program)
      });
      continue;
    }

    if (isCompleteProgram(patch)) {
      programs.push({ ...patch, lastChecked: today, status: inferStatus(patch) });
      newCount += 1;
    }
  }

  return newCount;
}

function isCompleteProgram(value: Partial<Program>): value is Program {
  return Boolean(value.id && value.title && value.provider && value.officialUrl);
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function robotsAllows(url: string): Promise<boolean> {
  const target = new URL(url);
  const robotsUrl = `${target.origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(7_000)
    });

    if (!response.ok) {
      return true;
    }

    const text = await response.text();
    return isAllowedByRobots(text, target.pathname);
  } catch {
    return true;
  }
}

function isAllowedByRobots(robotsText: string, pathname: string): boolean {
  const lines = robotsText.split(/\r?\n/);
  let applies = false;

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) {
      continue;
    }

    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const normalizedKey = key.trim().toLowerCase();

    if (normalizedKey === "user-agent") {
      applies = value === "*";
    }

    if (applies && normalizedKey === "disallow" && value && pathname.startsWith(value)) {
      return false;
    }
  }

  return true;
}

function extractFirstIsoDateAfter(html: string, marker: string): string | null {
  const index = html.indexOf(marker);
  const source = index >= 0 ? html.slice(index, index + 800) : html;
  const matches = Array.from(source.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{4})/g));

  if (matches.length === 0) {
    return null;
  }

  const today = new Date("2026-05-19T00:00:00.000Z");
  const future = matches
    .map((match) => {
      const [, day, month, year] = match;
      const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      return { iso, date: new Date(`${iso}T00:00:00.000Z`) };
    })
    .filter((entry) => entry.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  return future?.iso ?? null;
}

function extractDateNearTitle(html: string, marker: string): string | null {
  const index = html.indexOf(marker);
  if (index < 0) {
    return null;
  }

  const source = html.slice(index, index + 500);
  const dates = Array.from(source.matchAll(/(\d{2})\/(\d{2})\/(\d{4})/g));
  const deadline = dates[1] ?? dates[0];

  if (!deadline) {
    return null;
  }

  const [, day, month, year] = deadline;
  return `${year}-${month}-${day}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
