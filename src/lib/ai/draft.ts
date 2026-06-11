import { groq, MODEL } from "@/lib/ai/groq";
import type { ExtractedRFP, MatchResult } from "@/types";

/**
 * Generate a structured, GROUNDED proposal draft.
 * The model may only claim capabilities backed by RAG evidence; gaps are
 * surfaced honestly with a mitigation plan (no fabricated certifications).
 */
export async function generateDraftResponse(
  extracted: ExtractedRFP,
  compliance: MatchResult[]
): Promise<string> {
  const supported = compliance.filter((c) => c.status !== "MISSING");
  const gaps = compliance.filter((c) => c.status === "MISSING");

  const evidenceBlock =
    supported
      .map(
        (c) =>
          `- Requirement: ${c.requirement}\n  Match: ${c.status}\n  Evidence: ${
            c.evidence.join("; ") || "n/a"
          }`
      )
      .join("\n") || "None";

  const gapsBlock = gaps.map((c) => `- ${c.requirement}`).join("\n") || "None";

  const prompt = `You are a senior bid and proposal writer. Draft a professional, structured proposal response for the tender below.

TENDER: ${extracted.title}
DOMAIN: ${extracted.domain ?? "N/A"}

REQUIREMENTS WE CAN SUPPORT (use ONLY this evidence — never invent certifications, experience, or capabilities):
${evidenceBlock}

REQUIREMENTS WITH NO SUPPORTING EVIDENCE (address honestly; propose partnering or subcontracting, do NOT claim we already have them):
${gapsBlock}

Write the proposal in clean Markdown with these sections:
1. Executive Summary
2. Understanding of Requirements
3. Our Proposed Approach — map our capabilities to each supported requirement and reference the evidence
4. Compliance Statement — a brief statement of which mandatory requirements are fully met
5. Identified Gaps & Mitigation — honestly address the gaps with a concrete mitigation plan

Keep it concise, formal, and credible. Do not fabricate anything not present in the evidence above.`;

  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0]?.message?.content ?? "";
}