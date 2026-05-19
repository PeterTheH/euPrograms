import { EligibilityFlow } from "@/components/EligibilityFlow";
import { SimpleHeader } from "@/components/PageText";
import { getPrograms } from "@/lib/programs";

type PageProps = {
  searchParams?: {
    program?: string;
  };
};

export default async function DocumentsPage({ searchParams }: PageProps) {
  const programs = await getPrograms();

  return (
    <main className="page-shell">
      <SimpleHeader eyebrowKey="documents.eyebrow" titleKey="documents.title" />
      <EligibilityFlow programs={programs} initialProgramId={searchParams?.program} />
    </main>
  );
}
