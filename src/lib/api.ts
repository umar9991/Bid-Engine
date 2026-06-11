import type { MatchResult, ScoreFactor, GoNoGo } from "@/types";

/** RFP record as returned by the API (Prisma JSON fields typed). */
export interface RFPRecord {
  id: string;
  title: string;
  filename: string;
  status: string;
  domain: string | null;
  deadline: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  requirements: string[] | null;
  compliance: MatchResult[] | null;
  winProbability: number | null;
  scoreBreakdown: ScoreFactor[] | null;
  goNoGo: GoNoGo | null;
  draftResponse: string | null;
  createdAt: string;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listRFPs: () => fetch("/api/rfp").then(asJson<RFPRecord[]>),

  getRFP: (id: string) => fetch(`/api/rfp/${id}`).then(asJson<RFPRecord>),

  uploadRFP: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch("/api/rfp", { method: "POST", body: form }).then(asJson<RFPRecord>);
  },

  analyzeRFP: (id: string) =>
    fetch(`/api/rfp/${id}/analyze`, { method: "POST" }).then(asJson<unknown>),
};
