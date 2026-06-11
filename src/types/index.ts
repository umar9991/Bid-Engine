/** Shared domain types - single source of truth across AI, services, and UI. */

export interface ExtractedRFP {
  title: string;
  requirements: string[];
  criteria: { name: string; weight: number }[];
  deadline: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  domain: string | null;
}

export type ComplianceStatus = "COMPLIANT" | "PARTIAL" | "MISSING";

export interface MatchResult {
  requirement: string;
  status: ComplianceStatus;
  confidence: number; // 0-100 (guardrail)
  evidence: string[]; // citations -> capability titles
  reasoning: string; // explainability
}

export interface ScoreFactor {
  factor: string;
  score: number;
  max: number;
  note: string;
}

export type GoNoGo = "GO" | "NO-GO" | "REVIEW";

export interface ScoreResult {
  winProbability: number;
  goNoGo: GoNoGo;
  breakdown: ScoreFactor[];
}

export interface AnalysisResult {
  extracted: ExtractedRFP;
  compliance: MatchResult[];
  score: ScoreResult;
}
