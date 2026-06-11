-- CreateEnum
CREATE TYPE "RFPStatus" AS ENUM ('UPLOADED', 'EXTRACTING', 'MATCHING', 'SCORING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "RFP" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "RFPStatus" NOT NULL DEFAULT 'UPLOADED',
    "requirements" JSONB,
    "criteria" JSONB,
    "deadline" TIMESTAMP(3),
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "domain" TEXT,
    "compliance" JSONB,
    "winProbability" INTEGER,
    "scoreBreakdown" JSONB,
    "goNoGo" TEXT,
    "draftResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "certification" TEXT,
    "year" INTEGER,
    "contractValue" DOUBLE PRECISION,
    "clientType" TEXT,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidOutcome" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "bidValue" DOUBLE PRECISION,
    "evalScore" DOUBLE PRECISION,

    CONSTRAINT "BidOutcome_pkey" PRIMARY KEY ("id")
);
