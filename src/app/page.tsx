import { HomeHero } from "@/components/PageText";
import { ProgramExplorer } from "@/components/ProgramExplorer";
import { getPrograms } from "@/lib/programs";

export default async function HomePage() {
  const programs = await getPrograms();
  const openCount = programs.filter((program) => program.status === "open" || program.status === "rolling").length;
  const bgCount = programs.filter((program) => program.regionType === "Bulgaria").length;
  const euCount = programs.filter((program) => program.regionType === "EU").length;

  return (
    <main className="page-shell">
      <HomeHero openCount={openCount} bgCount={bgCount} euCount={euCount} />
      <ProgramExplorer programs={programs} />
    </main>
  );
}
