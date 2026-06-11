import { prisma } from "@/lib/db/prisma";
import { extractRequirements } from "@/lib/ai/groq";
import { matchCapabilities } from "@/lib/ai/rag";
import { calculateWinProbability } from "@/lib/ai/scoring";
import { generateDraftResponse } from "@/lib/ai/draft";
import { notifyAnalysisComplete } from "@/lib/notifications/discord";
import type { AnalysisResult } from "@/types";

/**
 * Orchestrates the full pipeline for one RFP:
 *   extract -> match (RAG) -> score -> draft -> persist -> notify
 * Status is advanced at each stage so the UI can show live progress.
 */
export async function analyzeRFP(rfpId: string): Promise<AnalysisResult> {
  const rfp = await prisma.rFP.findUniqueOrThrow({ where: { id: rfpId } });

  try {
    // 1) Extract
    await prisma.rFP.update({ where: { id: rfpId }, data: { status: "EXTRACTING" } });
    const extracted = await extractRequirements(rfp.content);

    // 2) Match (RAG)
    await prisma.rFP.update({ where: { id: rfpId }, data: { status: "MATCHING" } });
    const compliance = await matchCapabilities(extracted.requirements);

    // 3) Score
    await prisma.rFP.update({ where: { id: rfpId }, data: { status: "SCORING" } });
    const deadline = extracted.deadline ? new Date(extracted.deadline) : null;
    const score = await calculateWinProbability(compliance, deadline, extracted.domain);

    // 4) Draft a grounded proposal response
    const draftResponse = await generateDraftResponse(extracted, compliance);

    // 5) Persist
    await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        status: "COMPLETE",
        title: extracted.title || rfp.title,
        requirements: extracted.requirements,
        criteria: extracted.criteria,
        deadline,
        budgetMin: extracted.budgetMin,
        budgetMax: extracted.budgetMax,
        domain: extracted.domain,
        compliance: compliance as object,
        winProbability: score.winProbability,
        scoreBreakdown: score.breakdown as object,
        goNoGo: score.goNoGo,
        draftResponse,
      },
    });

    const result: AnalysisResult = { extracted, compliance, score };

    // 6) Notify (non-blocking)
    void notifyAnalysisComplete(extracted.title || rfp.title, result);

    return result;
  } catch (err) {
    await prisma.rFP.update({ where: { id: rfpId }, data: { status: "FAILED" } });
    throw err;
  }
}