import { EligibilityFlow } from "@/components/EligibilityFlow";
import { SimpleHeader } from "@/components/PageText";
import { getPrograms } from "@/lib/programs";

type PageProps = {
  searchParams?: {
    program?: string;
  };
};

export default async function CheckerPage({ searchParams }: PageProps) {
  const programs = await getPrograms();

  return (
    <main className="page-shell">
      <SimpleHeader eyebrowKey="checker.eyebrow" titleKey="checker.title" />
      <EligibilityFlow programs={programs} initialProgramId={searchParams?.program} />
    </main>
  );
}
