import { NextResponse } from "next/server";
import { analyzeRFP } from "@/services/bid-analysis.service";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/rfp/:id/analyze - run the full extract -> RAG -> score pipeline. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await analyzeRFP(params.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
