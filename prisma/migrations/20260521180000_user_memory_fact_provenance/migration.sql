-- UserMemoryFact provenance and category (Phase 1B)

ALTER TABLE "user_memory_facts" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'explicit_user';
ALTER TABLE "user_memory_facts" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "user_memory_facts" ADD COLUMN "isExplicit" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "user_memory_facts_userId_sourceType_idx" ON "user_memory_facts"("userId", "sourceType");
