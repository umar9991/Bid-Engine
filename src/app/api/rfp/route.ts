import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractText } from "@/lib/parsing/document";

export const runtime = "nodejs";

/** GET /api/rfp - list all RFPs (newest first). */
export async function GET() {
  const rfps = await prisma.rFP.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rfps);
}

/** POST /api/rfp - upload a tender document (multipart form-data, field "file"). */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractText(buffer, file.name);

    const rfp = await prisma.rFP.create({
      data: { title: file.name, filename: file.name, content },
    });
    return NextResponse.json(rfp, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
