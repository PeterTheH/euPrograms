import { promises as fs } from "fs";
import path from "path";
import type { Program, SourceStatus } from "./types";

const dataDir = path.join(process.cwd(), "data");
const programsPath = path.join(dataDir, "programs.json");
const sourcesPath = path.join(dataDir, "sources.json");

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function readPrograms(): Promise<Program[]> {
  return readJson<Program[]>(programsPath);
}

export async function writePrograms(programs: Program[]): Promise<void> {
  await writeJson(programsPath, programs);
}

export async function readSources(): Promise<SourceStatus[]> {
  return readJson<SourceStatus[]>(sourcesPath);
}

export async function writeSources(sources: SourceStatus[]): Promise<void> {
  await writeJson(sourcesPath, sources);
}
