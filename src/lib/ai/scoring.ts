import { prisma } from "@/lib/db/prisma";
import type { MatchResult, ScoreResult } from "@/types";

/**
 * Win-probability scoring with a transparent, weighted breakdown
 * (the breakdown IS the audit trail / explainability the brief asks for).
 *
 *   Compliance fit ......... 50%
 *   Historical win rate .... 30%  (uses the 120-bid dataset)
 *   Deadline feasibility ... 20%
 */
export async function calculateWinProbability(
  compliance: MatchResult[],
  deadline: Date | null,
  domain: string | null
): Promise<ScoreResult> {
  const breakdown: ScoreResult["breakdown"] = [];

  // 1) Compliance fit
  const total = compliance.length || 1;
  const compliant = compliance.filter((c) => c.status === "COMPLIANT").length;
  const partial = compliance.filter((c) => c.status === "PARTIAL").length;
  const complianceScore = ((compliant + partial * 0.5) / total) * 50;
  breakdown.push({
    factor: "Capability / Compliance fit",
    score: Math.round(complianceScore),
    max: 50,
    note: `${compliant} fully + ${partial} partially met of ${total} requirements`,
  });

  // 2) Historical win rate in domain
  const past = domain ? await prisma.bidOutcome.findMany({ where: { domain } }) : [];
  const wins = past.filter((p) => p.outcome === "WON").length;
  const winRate = past.length ? wins / past.length : 0.4; // neutral prior
  const historyScore = winRate * 30;
  breakdown.push({
    factor: "Historical win rate in domain",
    score: Math.round(historyScore),
    max: 30,
    note: past.length ? `${wins}/${past.length} past bids won in ${domain}` : "No history - neutral prior",
  });

  // 3) Deadline feasibility
  let deadlineScore = 10;
  let dNote = "No deadline found - neutral";
  if (deadline) {
    const days = Math.max(0, (deadline.getTime() - Date.now()) / 864e5);
    deadlineScore = Math.min(20, (days / 30) * 20);
    dNote = `${Math.round(days)} days to deadline`;
  }
  breakdown.push({
    factor: "Deadline feasibility",
    score: Math.round(deadlineScore),
    max: 20,
    note: dNote,
  });

  const winProbability = Math.round(complianceScore + historyScore + deadlineScore);
  const goNoGo = winProbability >= 65 ? "GO" : winProbability >= 45 ? "REVIEW" : "NO-GO";

  return { winProbability, goNoGo, breakdown };
}
