import { NextResponse } from "next/server";
import { evaluateEligibility } from "@/lib/eligibility";
import { getProgramById } from "@/lib/programs";
import { buildFallbackPack } from "@/lib/templates";
import type { FounderProfile } from "@/lib/types";

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

  // The pack is a programme-tailored template, returned instantly. The AI work
  // happens on demand per section (draft / feedback) via /api/section-assist,
  // which keeps prompts small and fast instead of regenerating the whole pack.
  const pack = buildFallbackPack(program, body.profile, eligibility);

  return NextResponse.json({ ...pack, generatedAt: new Date().toISOString(), warning: undefined });
}
