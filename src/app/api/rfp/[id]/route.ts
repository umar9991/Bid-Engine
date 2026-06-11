import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/** GET /api/rfp/:id - single RFP with all analysis results. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rfp = await prisma.rFP.findUnique({ where: { id: params.id } });
  if (!rfp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rfp);
}
