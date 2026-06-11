"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type RFPRecord } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  FileText,
  Loader2,
  CalendarClock,
  AlertCircle,
} from "lucide-react";

const STAGES = ["Extracting requirements", "Matching capabilities", "Scoring & GO/NO-GO"];

function goNoGoStyle(g: string | null) {
  if (g === "GO") return "bg-primary/15 text-primary border-primary/30";
  if (g === "REVIEW") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (g === "NO-GO") return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-muted text-muted-foreground border-border";
}

function probColor(p: number | null) {
  if (p === null) return "text-muted-foreground";
  if (p >= 65) return "text-primary";
  if (p >= 45) return "text-amber-400";
  return "text-destructive";
}

export default function Dashboard() {
  const router = useRouter();
  const [rfps, setRfps] = useState<RFPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setRfps(await api.listRFPs());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load RFPs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      setStage(0);
      const rfp = await api.uploadRFP(file);
      // Real pipeline: extract -> RAG match -> score. Stages animate as a UX hint.
      setStage(1);
      const tick = setTimeout(() => setStage(2), 1200);
      await api.analyzeRFP(rfp.id);
      clearTimeout(tick);
      setStage(-1);
      router.push(`/rfp/${rfp.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't process this document — try a different PDF or DOCX."
      );
      setStage(-1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Bid Engine
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Read every tender in minutes, not days.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Upload an RFP and the engine extracts mandatory requirements, matches them against your
          capability library, and tells you whether the bid is worth chasing.
        </p>
      </header>

      {/* Upload */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) handleFile(f);
        }}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {busy ? (
          <div className="w-full max-w-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <div className="mt-5 space-y-2 text-left">
              {STAGES.map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  {i < stage ? (
                    <span className="text-primary">✓</span>
                  ) : i === stage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <span className="text-muted-foreground">○</span>
                  )}
                  <span className={i <= stage ? "text-foreground" : "text-muted-foreground"}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-medium">Drop an RFP here, or browse</p>
            <p className="mt-1 text-sm text-muted-foreground">PDF or DOCX · up to 80 pages</p>
            <Button className="mt-5" onClick={() => inputRef.current?.click()}>
              Upload RFP
            </Button>
          </>
        )}
      </Card>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* List */}
      <section className="mt-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Analyzed bids
        </h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rfps.length === 0 ? (
          <Card className="flex flex-col items-center p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No bids analyzed yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your first tender to see its win probability.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rfps.map((rfp) => (
              <Card
                key={rfp.id}
                onClick={() => router.push(`/rfp/${rfp.id}`)}
                className="cursor-pointer p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{rfp.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {rfp.domain ?? "Uncategorized"}
                    </p>
                  </div>
                  {rfp.goNoGo && (
                    <Badge variant="outline" className={goNoGoStyle(rfp.goNoGo)}>
                      {rfp.goNoGo}
                    </Badge>
                  )}
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className={`text-3xl font-semibold ${probColor(rfp.winProbability)}`}>
                      {rfp.winProbability ?? "—"}
                      {rfp.winProbability !== null && (
                        <span className="text-base font-normal text-muted-foreground">%</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">win probability</p>
                  </div>
                  {rfp.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(rfp.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
