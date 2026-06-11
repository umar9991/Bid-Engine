import { prisma } from "@/lib/db/prisma";
import { groq, MODEL } from "@/lib/ai/groq";
import { embed, cosineSimilarity } from "@/lib/ai/embeddings";
import type { MatchResult } from "@/types";

const SIMILARITY_FLOOR = 0.55; // retrieval guardrail
const TOP_K = 3;

interface CapVector {
  id: string;
  title: string;
  text: string;
  vec: number[];
}

// Capability vectors are stable during a run -> embed once, cache in memory.
let capCache: CapVector[] | null = null;

async function getCapabilityVectors(): Promise<CapVector[]> {
  if (capCache) return capCache;
  const caps = await prisma.capability.findMany();
  capCache = await Promise.all(
    caps.map(async (c) => {
      const text = `${c.title}. ${c.description}. Domain: ${c.domain}. ${c.certification ?? ""}`;
      return { id: c.id, title: c.title, text, vec: await embed(text) };
    })
  );
  return capCache;
}

/** Clear the cache after seeding new capabilities. */
export function invalidateCapabilityCache() {
  capCache = null;
}

/**
 * RAG: retrieve top-K semantically similar capabilities per requirement,
 * then have the LLM make a grounded COMPLIANT/PARTIAL/MISSING judgment
 * with a confidence score and citation (explainability + guardrails).
 */
export async function matchCapabilities(requirements: string[]): Promise<MatchResult[]> {
  const caps = await getCapabilityVectors();
  const results: MatchResult[] = [];

  for (const req of requirements) {
    const reqVec = await embed(req);
    const ranked = caps
      .map((c) => ({ ...c, score: cosineSimilarity(reqVec, c.vec) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const top = ranked[0];

    // Guardrail: weak retrieval -> MISSING, never fabricate a match.
    if (!top || top.score < SIMILARITY_FLOOR) {
      results.push({
        requirement: req,
        status: "MISSING",
        confidence: Math.round((top?.score ?? 0) * 100),
        evidence: [],
        reasoning: "No capability in the library semantically matches this requirement.",
      });
      continue;
    }

    const verifyPrompt = `Requirement: "${req}"

Candidate company capabilities:
${ranked.map((r, i) => `${i + 1}. ${r.text}`).join("\n")}

Decide if the company satisfies this requirement based ONLY on the capabilities above.
Return ONLY JSON: {"status":"COMPLIANT|PARTIAL|MISSING","confidence":0-100,"evidence":["capability title"],"reasoning":"one sentence"}`;

    try {
      const r = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: verifyPrompt }],
      });
      const parsed = JSON.parse(r.choices[0].message.content!);

      // Normalize evidence: only keep titles that actually exist in the
      // retrieved candidates, and clear evidence entirely for MISSING.
      const candidateTitles = ranked.map((r) => r.title);
      let evidence: string[] = Array.isArray(parsed.evidence) ? parsed.evidence : [];
      evidence = evidence
        .flatMap((e: string) =>
          // split accidental concatenations, then match to real candidate titles
          candidateTitles.filter((t) => e.includes(t))
        )
        .filter((t, i, arr) => arr.indexOf(t) === i); // de-dupe

      if (parsed.status === "MISSING") evidence = [];
      else if (evidence.length === 0) evidence = candidateTitles.slice(0, 2);

      results.push({
        requirement: req,
        status: parsed.status,
        confidence: parsed.confidence,
        evidence,
        reasoning: parsed.reasoning,
      });
    } catch {
      results.push({
        requirement: req,
        status: top.score > 0.7 ? "COMPLIANT" : "PARTIAL",
        confidence: Math.round(top.score * 100),
        evidence: ranked.slice(0, 2).map((r) => r.title),
        reasoning: `Matched on semantic similarity (score ${top.score.toFixed(2)}).`,
      });
    }
  }
  return results;
}
