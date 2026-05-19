import { notFound } from "next/navigation";
import { ProgramDetailClient } from "@/components/ProgramDetailClient";
import { getProgramById, getSimilarPrograms } from "@/lib/programs";
import { buildApplicationTips } from "@/lib/templates";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function ProgramDetailPage({ params }: PageProps) {
  const program = await getProgramById(params.id);

  if (!program) {
    notFound();
  }

  const similar = await getSimilarPrograms(program);
  const tips = buildApplicationTips(program);

  return <ProgramDetailClient program={program} similar={similar} tips={tips} />;
}
