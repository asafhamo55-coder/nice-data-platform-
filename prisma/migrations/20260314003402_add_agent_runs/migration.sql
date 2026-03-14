-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);
