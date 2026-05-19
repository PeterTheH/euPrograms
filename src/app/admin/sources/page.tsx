import { SimpleHeader } from "@/components/PageText";
import { SourceMonitor } from "@/components/SourceMonitor";
import { readSources } from "@/lib/db";

export default async function SourcesPage() {
  const sources = await readSources();

  return (
    <main className="page-shell">
      <SimpleHeader eyebrowKey="sources.eyebrow" titleKey="sources.title" />
      <SourceMonitor initialSources={sources} />
    </main>
  );
}
