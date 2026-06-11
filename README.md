# AI Bid & Proposal Response Engine

Ingests an RFP/tender (PDF/DOCX), extracts mandatory requirements, matches them against a
Company Capability Library via RAG (embeddings + semantic retrieval + LLM verification), and
produces a compliance checklist, win-probability score, and GO/NO-GO recommendation — with
confidence scores, citations, and an audit trail (guardrails + explainability).

## Stack
Next.js 14 (App Router) · TypeScript · Prisma + Postgres · Groq (llama-3.3-70b) ·
Gemini embeddings · Tailwind + shadcn/ui · Playwright

## Architecture
```
src/
  app/          routes + API (thin controllers)
  components/   UI (ui primitives + feature components)
  lib/
    ai/         groq, embeddings, rag, scoring   <- the core
    db/         prisma client
    parsing/    pdf/docx text extraction
    notifications/  discord
    config/     validated env
  services/     bid-analysis orchestration (pipeline)
  types/        shared types
```

## Setup
```bash
npm install
cp .env.example .env          # fill DATABASE_URL, GROQ_API_KEY, GEMINI_API_KEY
npm run db:migrate -- --name init
npm run db:seed               # loads capability library + bid outcomes
npm run dev
```

## Pipeline
`POST /api/rfp` (upload) -> `POST /api/rfp/:id/analyze` (extract -> RAG match -> score -> notify)

## Notes
- Replace the sample seed data with the official hackathon dataset.
- The score breakdown is intentionally transparent — it is the audit trail.
