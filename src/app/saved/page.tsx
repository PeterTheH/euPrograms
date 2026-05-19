import { SimpleHeader } from "@/components/PageText";
import { SavedPrograms } from "@/components/SavedPrograms";
import { getPrograms } from "@/lib/programs";

export default async function SavedPage() {
  const programs = await getPrograms();

  return (
    <main className="page-shell">
      <SimpleHeader eyebrowKey="saved.eyebrow" titleKey="saved.title" />
      <SavedPrograms programs={programs} />
    </main>
  );
}
