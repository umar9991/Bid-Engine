import Groq from "groq-sdk";
import { env } from "@/lib/config/env";
import { safeJsonParse } from "@/lib/utils";
import type { ExtractedRFP } from "@/types";

export const groq = new Groq({ apiKey: env.GROQ_API_KEY });
export const MODEL = "llama-3.3-70b-versatile";

const EXTRACT_PROMPT = `You are a procurement and bid-analysis expert. Analyze this RFP/tender document and extract structured data.

Return ONLY a valid JSON object (no markdown, no commentary) with this exact shape:
{
  "title": "short title of the RFP",
  "requirements": ["mandatory requirement phrase 1", "requirement 2"],
  "criteria": [{"name": "evaluation criterion", "weight": 0}],
  "deadline": "YYYY-MM-DD or null",
  "budgetMin": number or null,
  "budgetMax": number or null,
  "domain": "one of: IT Services, Construction, Logistics, or best-fit sector"
}

Rules:
- Extract EVERY mandatory/compliance requirement you can find.
- If a value is absent, use null. Never invent values.
- Convert budget figures to plain numbers (e.g. "PKR 5 million" -> 5000000).

RFP DOCUMENT:
{text}`;

export async function extractRequirements(text: string): Promise<ExtractedRFP> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: EXTRACT_PROMPT.replace("{text}", text.slice(0, 40000)) }],
  });
  return safeJsonParse<ExtractedRFP>(res.choices[0]?.message?.content ?? "");
}
