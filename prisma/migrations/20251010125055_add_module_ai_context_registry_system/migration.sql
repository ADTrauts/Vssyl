-- Add module tracking fields to AILearningEvent
ALTER TABLE "ai_learning_events" ADD COLUMN IF NOT EXISTS "sourceModule" TEXT;
ALTER TABLE "ai_learning_events" ADD COLUMN IF NOT EXISTS "sourceModuleVersion" TEXT;
ALTER TABLE "ai_learning_events" ADD COLUMN IF NOT EXISTS "moduleActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ai_learning_events" ADD COLUMN IF NOT EXISTS "moduleSpecificData" JSONB;

-- Add indexes for module filtering
CREATE INDEX IF NOT EXISTS "ai_learning_events_sourceModule_idx" ON "ai_learning_events"("sourceModule");
CREATE INDEX IF NOT EXISTS "ai_learning_events_moduleActive_idx" ON "ai_learning_events"("moduleActive");

-- Add module tracking fields to GlobalLearningEvent
ALTER TABLE "global_learning_events" ADD COLUMN IF NOT EXISTS "sourceModule" TEXT;
ALTER TABLE "global_learning_events" ADD COLUMN IF NOT EXISTS "moduleCategory" TEXT;

-- Add indexes for global learning
CREATE INDEX IF NOT EXISTS "global_learning_events_sourceModule_idx" ON "global_learning_events"("sourceModule");
CREATE INDEX IF NOT EXISTS "global_learning_events_moduleCategory_idx" ON "global_learning_events"("moduleCategory");

-- Add module tracking fields to GlobalPattern
ALTER TABLE "global_patterns" ADD COLUMN IF NOT EXISTS "primaryModule" TEXT;
ALTER TABLE "global_patterns" ADD COLUMN IF NOT EXISTS "moduleCategory" TEXT;

-- Add indexes for global patterns
CREATE INDEX IF NOT EXISTS "global_patterns_primaryModule_idx" ON "global_patterns"("primaryModule");
CREATE INDEX IF NOT EXISTS "global_patterns_moduleCategory_idx" ON "global_patterns"("moduleCategory");

-- Create ModuleAIContextRegistry table
CREATE TABLE IF NOT EXISTS "module_ai_context_registry" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "moduleVersion" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "keywords" TEXT[],
    "patterns" TEXT[],
    "concepts" TEXT[],
    "entities" JSONB,
    "actions" JSONB,
    "contextProviders" JSONB,
    "relationships" JSONB,
    "fullAIContext" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_ai_context_registry_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes for registry
CREATE UNIQUE INDEX IF NOT EXISTS "module_ai_context_registry_moduleId_key" ON "module_ai_context_registry"("moduleId");
CREATE INDEX IF NOT EXISTS "module_ai_context_registry_category_idx" ON "module_ai_context_registry"("category");
CREATE INDEX IF NOT EXISTS "module_ai_context_registry_keywords_idx" ON "module_ai_context_registry" USING GIN ("keywords");
CREATE INDEX IF NOT EXISTS "module_ai_context_registry_patterns_idx" ON "module_ai_context_registry" USING GIN ("patterns");
CREATE INDEX IF NOT EXISTS "module_ai_context_registry_isActive_idx" ON "module_ai_context_registry"("isActive");

-- Create UserAIContextCache table
CREATE TABLE IF NOT EXISTS "user_ai_context_cache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextData" JSONB NOT NULL,
    "moduleContexts" JSONB NOT NULL,
    "lastRefreshed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ai_context_cache_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes for cache
CREATE UNIQUE INDEX IF NOT EXISTS "user_ai_context_cache_userId_key" ON "user_ai_context_cache"("userId");
CREATE INDEX IF NOT EXISTS "user_ai_context_cache_expiresAt_idx" ON "user_ai_context_cache"("expiresAt");

-- Create ModuleAIPerformanceMetric table
CREATE TABLE IF NOT EXISTS "module_ai_performance_metrics" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "queryCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "averageConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "lastQueried" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_ai_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes for performance metrics
CREATE UNIQUE INDEX IF NOT EXISTS "module_ai_performance_metrics_moduleId_key" ON "module_ai_performance_metrics"("moduleId");
CREATE INDEX IF NOT EXISTS "module_ai_performance_metrics_lastQueried_idx" ON "module_ai_performance_metrics"("lastQueried");

-- Add cached context fields to ModuleInstallation
ALTER TABLE "module_installations" ADD COLUMN IF NOT EXISTS "cachedContext" JSONB;
ALTER TABLE "module_installations" ADD COLUMN IF NOT EXISTS "contextCachedAt" TIMESTAMP(3);

-- Add foreign key constraints
ALTER TABLE "module_ai_context_registry" ADD CONSTRAINT "module_ai_context_registry_moduleId_fkey" 
    FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_ai_context_cache" ADD CONSTRAINT "user_ai_context_cache_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "module_ai_performance_metrics" ADD CONSTRAINT "module_ai_performance_metrics_moduleId_fkey" 
    FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

