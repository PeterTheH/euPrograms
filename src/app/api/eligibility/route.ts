import { NextResponse } from "next/server";
import { evaluateEligibility } from "@/lib/eligibility";
import { getProgramById } from "@/lib/programs";
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

  return NextResponse.json(evaluateEligibility(program, body.profile));
}
