import { NextResponse } from "next/server";
import { runSourceRefresh } from "@/lib/source-adapters";

export async function POST() {
  const result = await runSourceRefresh();
  return NextResponse.json(result);
}
