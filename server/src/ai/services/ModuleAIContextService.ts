/**
 * MODULE AI CONTEXT SERVICE
 * 
 * Manages the Module AI Context Registry - the fast lookup system
 * that enables the AI to dynamically understand and work with any module.
 * 
 * This service provides:
 * - Registry management (register/update/delete module contexts)
 * - Fast module discovery via keyword/pattern matching
 * - Live context fetching from module endpoints
 * - Performance tracking and analytics
 * 
 * NOTE: TypeScript errors for Prisma models (moduleAIContextRegistry, etc.) will be resolved
 * after running: npx prisma migrate dev --name add_module_ai_context_registry
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import type {
  ModuleAIContext,
  ModuleAIContextRegistryEntry,
  AIQueryAnalysis,
  ModuleContextResponse,
} from '../../../../shared/src/types/module-ai-context';

const prisma = new PrismaClient();

export class ModuleAIContextService {
  /**
   * Register a module's AI context when it's installed
   * Called during module installation
   */
  async registerModuleContext(
    moduleId: string,
    moduleName: string,
    aiContext: ModuleAIContext
  ): Promise<ModuleAIContextRegistryEntry> {
    try {
      // Check if registry entry already exists
      const existing = await prisma.moduleAIContextRegistry.findUnique({
        where: { moduleId },
      });

      if (existing) {
        // Update existing entry
        const updated = await prisma.moduleAIContextRegistry.update({
          where: { moduleId },
          data: {
            moduleName,
            purpose: aiContext.purpose,
            category: aiContext.category,
            keywords: aiContext.keywords,
            patterns: aiContext.patterns,
            concepts: aiContext.concepts,
            entities: aiContext.entities as any,
            actions: aiContext.actions as any,
            contextProviders: aiContext.contextProviders as any,
            queryableData: aiContext.queryableData as any,
            relationships: aiContext.relationships as any,
            fullAIContext: aiContext as any,
            lastUpdated: new Date(),
          },
        });

        console.log(`✅ Updated AI context registry for module: ${moduleName}`);
        return updated as unknown as ModuleAIContextRegistryEntry;
      } else {
        // Create new entry
        const created = await prisma.moduleAIContextRegistry.create({
          data: {
            moduleId,
            moduleName,
            purpose: aiContext.purpose,
            category: aiContext.category,
            keywords: aiContext.keywords,
            patterns: aiContext.patterns,
            concepts: aiContext.concepts,
            entities: aiContext.entities as any,
            actions: aiContext.actions as any,
            contextProviders: aiContext.contextProviders as any,
            queryableData: aiContext.queryableData as any,
            relationships: aiContext.relationships as any,
            fullAIContext: aiContext as any,
          },
        });

        console.log(`✅ Registered AI context for module: ${moduleName}`);
        return created as unknown as ModuleAIContextRegistryEntry;
      }
    } catch (error) {
      console.error(`❌ Error registering module AI context for ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a module's AI context when it's uninstalled globally
   * Note: This only removes from registry when NO users have the module installed
   */
  async unregisterModuleContext(moduleId: string): Promise<void> {
    try {
      // Check if any users still have this module installed
      const installCount = await prisma.moduleInstallation.count({
        where: { moduleId },
      });

      if (installCount === 0) {
        // No users have this module, safe to remove from registry
        await prisma.moduleAIContextRegistry.delete({
          where: { moduleId },
        });

        console.log(`✅ Unregistered AI context for module: ${moduleId}`);
      } else {
        console.log(`ℹ️  Module ${moduleId} still has ${installCount} installations. Keeping registry entry.`);
      }
    } catch (error) {
      console.error(`❌ Error unregistering module AI context:`, error);
      throw error;
    }
  }

  /**
   * Analyze a user query and find relevant modules
   * This is the FAST LAYER 1 lookup
   */
  async analyzeQuery(query: string, userId: string): Promise<AIQueryAnalysis> {
    try {
      const queryLower = query.toLowerCase();
      const words = queryLower.split(/\s+/);

      // Get user's installed modules
      const userModules = await prisma.moduleInstallation.findMany({
        where: { userId, enabled: true },
        select: { moduleId: true },
      });

      const installedModuleIds = userModules.map((m) => m.moduleId);

      // Get all registry entries for installed modules
      const registryEntries = await prisma.moduleAIContextRegistry.findMany({
        where: {
          moduleId: { in: installedModuleIds },
        },
      });

      // Score each module based on keyword/pattern matching
      const matchedModules = registryEntries
        .map((entry: any) => {
          let score = 0;
          const matchedKeywords: string[] = [];
          const matchedPatterns: string[] = [];

          // Check keyword matches
          entry.keywords.forEach((keyword: string) => {
            if (queryLower.includes(keyword.toLowerCase())) {
              score += 10;
              matchedKeywords.push(keyword);
            }
          });

          // Check concept matches
          entry.concepts.forEach((concept: string) => {
            if (queryLower.includes(concept.toLowerCase())) {
              score += 5;
            }
          });

          // Check pattern matches (basic wildcard matching)
          entry.patterns.forEach((pattern: string) => {
            const regex = new RegExp(
              pattern.replace(/\*/g, '.*').toLowerCase()
            );
            if (regex.test(queryLower)) {
              score += 15;
              matchedPatterns.push(pattern);
            }
          });

          // Check if any query words match module name
          if (words.some((word) => entry.moduleName.toLowerCase().includes(word))) {
            score += 20;
          }

          return {
            moduleId: entry.moduleId,
            moduleName: entry.moduleName,
            confidence: Math.min(score / 50, 1), // Normalize to 0-1
            matchedKeywords,
            matchedPatterns,
            relevance: (score >= 20 ? 'high' : score >= 10 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
            score,
            contextProviders: entry.contextProviders as any,
          };
        })
        .filter((match: any) => match.score > 0) // Only include modules with some match
        .sort((a: any, b: any) => b.score - a.score); // Sort by score descending

      // Get suggested context providers for high-relevance matches
      const suggestedContextProviders = matchedModules
        .filter((m: any) => m.relevance === 'high' || m.relevance === 'medium')
        .flatMap((m: any) =>
          (m.contextProviders as any[]).map((provider: any) => ({
            moduleId: m.moduleId,
            providerName: provider.name,
            endpoint: provider.endpoint.replace(':id', m.moduleId),
          }))
        );

      return {
        query,
        matchedModules: matchedModules.map(({ contextProviders, score, ...rest }: any) => rest),
        suggestedContextProviders,
      };
    } catch (error) {
      console.error('❌ Error analyzing query:', error);
      throw error;
    }
  }

  /**
   * Fetch live context from a module's context provider endpoint
   * This is the SLOW LAYER 2 fetch (only called for relevant modules)
   */
  async fetchModuleContext(
    moduleId: string,
    providerName: string,
    userId: string,
    parameters?: Record<string, any>
  ): Promise<ModuleContextResponse> {
    const startTime = Date.now();

    try {
      // Get the context provider configuration from registry
      const registry = await prisma.moduleAIContextRegistry.findUnique({
        where: { moduleId },
      });

      if (!registry) {
        throw new Error(`Module ${moduleId} not found in AI context registry`);
      }

      const contextProviders = registry.contextProviders as any;
      const provider = contextProviders.find((p: any) => p.name === providerName);

      if (!provider) {
        throw new Error(`Context provider ${providerName} not found for module ${moduleId}`);
      }

      // Check cache first
      const installation = await prisma.moduleInstallation.findUnique({
        where: {
          moduleId_userId: { moduleId, userId },
        },
      });

      const cacheDuration = provider.cacheDuration || 900000; // Default 15 minutes
      const isCacheValid =
        installation?.contextCachedAt &&
        Date.now() - installation.contextCachedAt.getTime() < cacheDuration;

      if (isCacheValid && installation?.cachedContext) {
        console.log(`✅ Cache hit for ${moduleId}.${providerName}`);
        return {
          moduleId,
          providerName,
          data: installation.cachedContext,
          timestamp: new Date(),
          cached: true,
          latency: Date.now() - startTime,
        };
      }

      // Cache miss - fetch from module endpoint
      console.log(`🔄 Fetching live context from ${moduleId}.${providerName}`);
      
      const endpoint = provider.endpoint.replace(':id', moduleId);
      const response = await axios.get(endpoint, {
        params: {
          userId,
          ...parameters,
        },
        timeout: 5000, // 5 second timeout
      });

      // Cache the result
      await prisma.moduleInstallation.update({
        where: {
          moduleId_userId: { moduleId, userId },
        },
        data: {
          cachedContext: response.data as any,
          contextCachedAt: new Date(),
        },
      });

      const latency = Date.now() - startTime;

      // Track performance metrics
      await this.trackPerformanceMetric(moduleId, {
        contextFetchCount: 1,
        totalQueries: 1,
        successfulQueries: 1,
        averageLatency: latency,
        averageContextSize: JSON.stringify(response.data).length / 1024, // KB
      });

      return {
        moduleId,
        providerName,
        data: response.data,
        timestamp: new Date(),
        cached: false,
        latency,
      };
    } catch (error: any) {
      console.error(`❌ Error fetching module context:`, error.message);

      // Track failure
      await this.trackPerformanceMetric(moduleId, {
        contextFetchErrors: 1,
        failedQueries: 1,
        totalQueries: 1,
      });

      throw error;
    }
  }

  /**
   * Get all modules in a specific category
   */
  async getModulesByCategory(category: string): Promise<ModuleAIContextRegistryEntry[]> {
    const entries = await prisma.moduleAIContextRegistry.findMany({
      where: { category },
    });

    return entries as unknown as ModuleAIContextRegistryEntry[];
  }

  /**
   * Search registry by keywords
   */
  async searchByKeywords(keywords: string[]): Promise<ModuleAIContextRegistryEntry[]> {
    const entries = await prisma.moduleAIContextRegistry.findMany({
      where: {
        keywords: {
          hasSome: keywords,
        },
      },
    });

    return entries as unknown as ModuleAIContextRegistryEntry[];
  }

  /**
   * Track performance metrics for a module
   */
  private async trackPerformanceMetric(
    moduleId: string,
    metrics: Partial<{
      totalQueries: number;
      successfulQueries: number;
      failedQueries: number;
      averageLatency: number;
      contextFetchCount: number;
      contextFetchErrors: number;
      averageContextSize: number;
      cacheHitRate: number;
      positiveRatings: number;
      negativeRatings: number;
      learningEventsGenerated: number;
      patternsContributed: number;
    }>
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Upsert today's metrics
      await prisma.moduleAIPerformanceMetric.upsert({
        where: {
          moduleId_date: {
            moduleId,
            date: today,
          },
        },
        create: {
          moduleId,
          date: today,
          ...metrics,
        },
        update: {
          totalQueries: { increment: metrics.totalQueries || 0 },
          successfulQueries: { increment: metrics.successfulQueries || 0 },
          failedQueries: { increment: metrics.failedQueries || 0 },
          contextFetchCount: { increment: metrics.contextFetchCount || 0 },
          contextFetchErrors: { increment: metrics.contextFetchErrors || 0 },
          positiveRatings: { increment: metrics.positiveRatings || 0 },
          negativeRatings: { increment: metrics.negativeRatings || 0 },
          learningEventsGenerated: { increment: metrics.learningEventsGenerated || 0 },
          patternsContributed: { increment: metrics.patternsContributed || 0 },
          
          // Update averages (simplified - real implementation would use weighted average)
          averageLatency: metrics.averageLatency || undefined,
          averageContextSize: metrics.averageContextSize || undefined,
          cacheHitRate: metrics.cacheHitRate || undefined,
        },
      });
    } catch (error) {
      console.error('❌ Error tracking performance metric:', error);
      // Don't throw - metrics shouldn't break the main flow
    }
  }

  /**
   * Get performance analytics for a module
   */
  async getModuleAnalytics(moduleId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await prisma.moduleAIPerformanceMetric.findMany({
      where: {
        moduleId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate aggregates
    const totalQueries = metrics.reduce((sum: number, m: any) => sum + m.totalQueries, 0);
    const successfulQueries = metrics.reduce((sum: number, m: any) => sum + m.successfulQueries, 0);
    const totalLatency = metrics.reduce((sum: number, m: any) => sum + (m.averageLatency * m.totalQueries), 0);

    return {
      moduleId,
      totalQueries,
      successRate: totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0,
      averageLatency: totalQueries > 0 ? totalLatency / totalQueries : 0,
      metrics,
    };
  }

  /**
   * Clear user's context cache
   */
  async clearUserContextCache(userId: string): Promise<void> {
    await prisma.userAIContextCache.deleteMany({
      where: { userId },
    });

    // Also clear module installation caches
    await prisma.moduleInstallation.updateMany({
      where: { userId },
      data: {
        cachedContext: null,
        contextCachedAt: null,
      },
    });

    console.log(`✅ Cleared AI context cache for user: ${userId}`);
  }

  /**
   * Invalidate cache for a specific module
   */
  async invalidateModuleCache(moduleId: string): Promise<void> {
    await prisma.moduleInstallation.updateMany({
      where: { moduleId },
      data: {
        cachedContext: null,
        contextCachedAt: null,
      },
    });

    console.log(`✅ Invalidated cache for module: ${moduleId}`);
  }
}

export const moduleAIContextService = new ModuleAIContextService();

