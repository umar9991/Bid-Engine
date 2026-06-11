import { env } from "@/lib/config/env";
import type { AnalysisResult } from "@/types";

/** Fire-and-forget Discord alert when an RFP analysis completes. */
export async function notifyAnalysisComplete(rfpTitle: string, result: AnalysisResult) {
  if (!env.DISCORD_WEBHOOK_URL) return;

  const { score, compliance } = result;
  const missing = compliance.filter((c) => c.status === "MISSING").length;
  const emoji = score.goNoGo === "GO" ? "🟢" : score.goNoGo === "REVIEW" ? "🟡" : "🔴";

  const content =
    `${emoji} **RFP analyzed: ${rfpTitle}**\n` +
    `Win probability: **${score.winProbability}%** — Recommendation: **${score.goNoGo}**\n` +
    (missing > 0 ? `⚠️ ${missing} mandatory requirement(s) have no capability evidence.` : "✅ All requirements have evidence.");

  try {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.error("Discord notification failed:", err);
  }
}
