"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type RFPRecord } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  CheckCircle2,
  CircleSlash,
  AlertTriangle,
  CalendarClock,
  Wallet,
} from "lucide-react";
import type { MatchResult } from "@/types";


function tone(g: string | null) {
  if (g === "GO") return { ring: "stroke-emerald-400", text: "text-primary", label: "Pursue this bid" };
  if (g === "REVIEW") return { ring: "stroke-amber-400", text: "text-amber-400", label: "Needs review" };
  return { ring: "stroke-red-400", text: "text-destructive", label: "Likely not worth it" };
}

/** SVG circular gauge for win probability. */
function Gauge({ value, color }: { value: number; color: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} className="fill-none stroke-border" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={r}
          className={`fill-none ${color} transition-[stroke-dashoffset] duration-1000`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold">{value}%</span>
        <span className="text-xs text-muted-foreground">win probability</span>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: MatchResult["status"] }) {
  if (status === "COMPLIANT") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "PARTIAL") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  return <CircleSlash className="h-4 w-4 text-destructive" />;
}

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rfp, setRfp] = useState<RFPRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [exported, setExported] = useState(false);

  useEffect(() => {
    api
      .getRFP(id)
      .then((r) => {
        setRfp(r);
        setDraft(r.draftResponse ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load this RFP"));
  }, [id]);

  if (error)
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Back to dashboard
        </Button>
      </main>
    );

  if (!rfp) return <main className="px-6 py-16 text-muted-foreground">Loading…</main>;

  const t = tone(rfp.goNoGo);
  const compliance = rfp.compliance ?? [];
  const met = compliance.filter((c) => c.status === "COMPLIANT").length;
  const missing = compliance.filter((c) => c.status === "MISSING").length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <button
        onClick={() => router.push("/")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{rfp.title}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {rfp.domain && <span>{rfp.domain}</span>}
            {rfp.deadline && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                {new Date(rfp.deadline).toLocaleDateString()}
              </span>
            )}
            {(rfp.budgetMin || rfp.budgetMax) && (
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                {rfp.budgetMin?.toLocaleString() ?? "?"} – {rfp.budgetMax?.toLocaleString() ?? "?"}
              </span>
            )}
          </div>
        </div>
        <Badge variant="outline" className={`${t.text} border-current/30 px-3 py-1 text-sm`}>
          {rfp.goNoGo ?? "—"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">
            Compliance{compliance.length > 0 && ` (${compliance.length})`}
          </TabsTrigger>
          <TabsTrigger value="draft">Draft response</TabsTrigger>
        </TabsList>

        {/* Overview / win probability */}
        <TabsContent value="overview" className="mt-6">
          <Card className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-center sm:gap-10">
            <Gauge value={rfp.winProbability ?? 0} color={t.ring} />
            <div className="flex-1">
              <p className={`text-lg font-medium ${t.text}`}>{t.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {met} of {compliance.length} requirements fully met
                {missing > 0 && `, ${missing} with no evidence`}.
              </p>
            </div>
          </Card>

          {/* Score breakdown = audit trail */}
          <Card className="mt-4 p-6">
            <p className="mb-1 text-sm font-semibold">How this score was reached</p>
            <p className="mb-5 text-xs text-muted-foreground">
              Every factor is shown with its weight — this is the audit trail behind the
              recommendation.
            </p>
            <div className="space-y-5">
              {(rfp.scoreBreakdown ?? []).map((f) => (
                <div key={f.factor}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span>{f.factor}</span>
                    <span className="text-muted-foreground">
                      {f.score}/{f.max}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${(f.score / f.max) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Compliance checklist */}
        <TabsContent value="compliance" className="mt-6">
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-primary">{met} met</span>
            <span className="text-amber-400">
              {compliance.filter((c) => c.status === "PARTIAL").length} partial
            </span>
            <span className="text-destructive">{missing} missing</span>
          </div>
          <div className="space-y-3">
            {compliance.map((c, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <StatusIcon status={c.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.requirement}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.reasoning}</p>

                    {c.evidence.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.evidence.map((e) => (
                          <span
                            key={e}
                            className="inline-block whitespace-nowrap rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${c.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {c.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Draft */}
        <TabsContent value="draft" className="mt-6">
          <Card className="p-6">
            <p className="mb-1 text-sm font-semibold">AI-drafted proposal response</p>
            <p className="mb-4 text-xs text-muted-foreground">
              A starting point — review and edit before submission.
            </p>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={14}
              placeholder="The draft response will appear here once generated."
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              {exported && (
                <span className="text-xs text-primary">Exported ✓</span>
              )}
              <Button
               onClick={() => {
                  const safeTitle = (rfp.title || "proposal")
                    .replace(/[^a-z0-9]+/gi, "-")
                    .toLowerCase();

                  const doc = new jsPDF({ unit: "pt", format: "a4" });
                  const margin = 48;
                  const pageW = doc.internal.pageSize.getWidth();
                  const pageH = doc.internal.pageSize.getHeight();
                  const maxW = pageW - margin * 2;
                  let y = margin;

                  // Title
                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(16);
                  doc.text(rfp.title || "Proposal Response", margin, y);
                  y += 24;
                  doc.setDrawColor(200);
                  doc.line(margin, y, pageW - margin, y);
                  y += 18;

                  // Body — render markdown lightly: ### / ** become headings/bold
                  const lines = draft.split("\n");
                  for (const raw of lines) {
                    const line = raw.trimEnd();
                    const isHeading = line.startsWith("#");
                    const isBullet = /^\s*[-*]\s+/.test(line);
                    const clean = line
                      .replace(/^#+\s*/, "")
                      .replace(/\*\*/g, "")
                      .replace(/^\s*[-*]\s+/, "• ");

                    if (clean === "") {
                      y += 8;
                      continue;
                    }

                    doc.setFont("helvetica", isHeading ? "bold" : "normal");
                    doc.setFontSize(isHeading ? 13 : 10.5);

                    const wrapped = doc.splitTextToSize(clean, isBullet ? maxW - 12 : maxW);
                    for (const w of wrapped) {
                      if (y > pageH - margin) {
                        doc.addPage();
                        y = margin;
                      }
                      doc.text(w, isBullet ? margin + 12 : margin, y);
                      y += isHeading ? 18 : 15;
                    }
                    if (isHeading) y += 4;
                  }

                  doc.save(`${safeTitle}-proposal.pdf`);
                  setExported(true);
                }}
                disabled={!draft.trim()}
              >
                Approve &amp; export
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
