import { NextResponse } from "next/server";
import { evaluateEligibility } from "@/lib/eligibility";
import { generateOllamaJson } from "@/lib/ollama";
import { getProgramById } from "@/lib/programs";
import { buildFallbackPack } from "@/lib/templates";
import type { ApplicationPack, FounderProfile } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { programId?: string; profile?: FounderProfile };

  if (!body.programId || !body.profile) {
    return NextResponse.json({ error: "programId and profile are required." }, { status: 400 });
  }

  const program = await getProgramById(body.programId);
  if (!program) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  const eligibility = evaluateEligibility(program, body.profile);
  const fallback = buildFallbackPack(program, body.profile, eligibility);

  const systemPrompt = [
    "You are GrantForge, an application preparation assistant for EU and Bulgarian technology-startup funding.",
    "Return only valid JSON. Do not include markdown.",
    "Keep every document tailored to the programme requirements, evaluation criteria, funding type, startup stage, and official-source traceability.",
    "Do not invent deadlines, funding amounts, or eligibility rules. Use the supplied programme record."
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      task: "Generate a customized application pack.",
      outputShape: {
        programId: "string",
        programTitle: "string",
        generatedAt: "ISO string",
        aiProvider: "ollama",
        model: "string",
        eligibility: "use supplied eligibility object exactly",
        applicationTips: [
          {
            title: "string",
            detail: "specific, practical evaluator-facing advice",
            sourceRequirement: "which programme requirement inspired the tip",
            sourceUrl: "official URL"
          }
        ],
        documents: [
          {
            title: "string",
            purpose: "string",
            sections: [
              {
                heading: "string",
                prompt: "founder-facing writing prompt",
                programSpecificNotes: ["string"]
              }
            ]
          }
        ],
        checklist: ["string"]
      },
      programmeRecord: program,
      founderProfile: body.profile,
      eligibility,
      fallbackTemplate: fallback
    },
    null,
    2
  );

  const result = await generateOllamaJson<ApplicationPack>(systemPrompt, userPrompt, fallback);
  const pack = {
    ...fallback,
    ...result.data,
    generatedAt: new Date().toISOString(),
    aiProvider: result.provider,
    model: result.model,
    warning: result.warning
  };

  return NextResponse.json(pack);
}
