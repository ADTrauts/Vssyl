/**
 * MODULE REGISTRY SYNC SERVICE
 * 
 * Keeps the Module AI Context Registry synchronized with module updates.
 * 
 * Functions:
 * - Nightly sync of all modules
 * - Real-time sync when developer updates a module
 * - Cleanup of deleted modules
 * - Version tracking and diff detection
 */

import { PrismaClient } from '@prisma/client';
import type { ModuleAIContext } from '../../../shared/src/types/module-ai-context';

export class ModuleRegistrySyncService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Sync all modules in the database with the registry
   * Called by nightly cron job
   */
  async syncAllModules(): Promise<{
    success: boolean;
    added: number;
    updated: number;
    removed: number;
    errors: number;
    details: Array<{ moduleId: string; action: string; status: string; error?: string }>;
  }> {
    console.log('\n🔄 ============================================');
    console.log('🔄 Module AI Context Registry - Full Sync');
    console.log('🔄 ============================================\n');

    const results = {
      success: true,
      added: 0,
      updated: 0,
      removed: 0,
      errors: 0,
      details: [] as Array<{ moduleId: string; action: string; status: string; error?: string }>,
    };

    try {
      // Step 1: Get all approved modules from database
      const modules = await this.prisma.module.findMany({
        where: {
          status: 'APPROVED',
        },
        select: {
          id: true,
          name: true,
          version: true,
          manifest: true,
        },
      });

      console.log(`📦 Found ${modules.length} active modules to check\n`);

      // Step 2: Sync each module
      for (const module of modules) {
        try {
          const syncResult = await this.syncModule(module.id);
          
          if (syncResult.action === 'added') {
            results.added++;
            results.details.push({
              moduleId: module.id,
              action: 'added',
              status: 'success',
            });
          } else if (syncResult.action === 'updated') {
            results.updated++;
            results.details.push({
              moduleId: module.id,
              action: 'updated',
              status: 'success',
            });
          } else {
            // No change
            results.details.push({
              moduleId: module.id,
              action: 'no_change',
              status: 'success',
            });
          }
        } catch (error) {
          console.error(`   ❌ Error syncing ${module.name}:`, error);
          results.errors++;
          results.success = false;
          results.details.push({
            moduleId: module.id,
            action: 'error',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Step 3: Cleanup orphaned entries (modules that were deleted)
      const cleanupResult = await this.cleanupOrphanedEntries();
      results.removed = cleanupResult.removed;

      // Summary
      console.log('\n📊 Sync Summary:');
      console.log(`   ✅ Added: ${results.added}`);
      console.log(`   🔄 Updated: ${results.updated}`);
      console.log(`   🗑️  Removed: ${results.removed}`);
      console.log(`   ❌ Errors: ${results.errors}`);
      console.log('');

      if (results.errors === 0) {
        console.log('✅ Module registry sync completed successfully!\n');
      } else {
        console.warn(`⚠️  Sync completed with ${results.errors} errors. Check logs for details.\n`);
      }

      return results;
    } catch (error) {
      console.error('❌ Fatal error during module sync:', error);
      results.success = false;
      results.errors++;
      return results;
    }
  }

  /**
   * Sync a specific module
   * Called when a developer publishes a module update
   */
  async syncModule(moduleId: string): Promise<{
    action: 'added' | 'updated' | 'no_change' | 'skipped';
    reason?: string;
  }> {
    try {
      // Get the module from database
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        select: {
          id: true,
          name: true,
          version: true,
          manifest: true,
          status: true,
        },
      });

      if (!module) {
        console.log(`   ⚠️  Module '${moduleId}' not found in database`);
        return { action: 'skipped', reason: 'module_not_found' };
      }

      if (module.status !== 'APPROVED') {
        console.log(`   ⚠️  Module '${module.name}' is not approved (status: ${module.status})`);
        return { action: 'skipped', reason: 'module_not_approved' };
      }

      // Extract AI context from module manifest
      const aiContext = this.extractAIContextFromManifest(module.manifest);

      if (!aiContext) {
        console.log(`   ⚠️  Module '${module.name}' has no AI context in manifest`);
        return { action: 'skipped', reason: 'no_ai_context' };
      }

      // Check if already in registry
      const existing = await this.prisma.moduleAIContextRegistry.findUnique({
        where: { moduleId: module.id },
      });

      if (!existing) {
        // Add to registry
        await this.addModuleToRegistry(module.id, module.name, module.version, aiContext);
        console.log(`   ✅ Added ${module.name} to registry`);
        return { action: 'added' };
      }

      // Check if AI context changed
      const hasChanges = this.detectChanges(existing, aiContext, module.version);

      if (!hasChanges) {
        return { action: 'no_change' };
      }

      // Update registry
      await this.updateModuleInRegistry(module.id, module.name, module.version, aiContext);
      console.log(`   🔄 Updated ${module.name} in registry`);
      return { action: 'updated' };
    } catch (error) {
      console.error(`Error syncing module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Remove registry entries for deleted modules
   */
  async cleanupOrphanedEntries(): Promise<{ removed: number }> {
    try {
      console.log('🧹 Cleaning up orphaned registry entries...');

      // Get all registry entries
      const registryEntries = await this.prisma.moduleAIContextRegistry.findMany({
        select: { moduleId: true },
      });

      // Get all approved module IDs
      const approvedModules = await this.prisma.module.findMany({
        where: { status: 'APPROVED' },
        select: { id: true },
      });

      const approvedModuleIds = new Set(approvedModules.map(m => m.id));

      // Find orphaned entries
      const orphanedEntries = registryEntries.filter(
        entry => !approvedModuleIds.has(entry.moduleId)
      );

      if (orphanedEntries.length === 0) {
        console.log('   ✅ No orphaned entries found');
        return { removed: 0 };
      }

      // Remove orphaned entries
      await this.prisma.moduleAIContextRegistry.deleteMany({
        where: {
          moduleId: {
            in: orphanedEntries.map(e => e.moduleId),
          },
        },
      });

      console.log(`   🗑️  Removed ${orphanedEntries.length} orphaned entries`);
      return { removed: orphanedEntries.length };
    } catch (error) {
      console.error('Error cleaning up orphaned entries:', error);
      return { removed: 0 };
    }
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    totalModules: number;
    registeredModules: number;
    unregisteredModules: number;
    orphanedEntries: number;
    lastSync?: Date;
  }> {
    try {
      const [totalModules, registeredModules, registryEntries, approvedModules] = await Promise.all([
        this.prisma.module.count({ where: { status: 'APPROVED' } }),
        this.prisma.moduleAIContextRegistry.count(),
        this.prisma.moduleAIContextRegistry.findMany({ select: { moduleId: true } }),
        this.prisma.module.findMany({
          where: { status: 'APPROVED' },
          select: { id: true },
        }),
      ]);

      const approvedIds = new Set(approvedModules.map(m => m.id));
      const orphanedEntries = registryEntries.filter(
        entry => !approvedIds.has(entry.moduleId)
      ).length;

      const unregisteredModules = totalModules - registeredModules + orphanedEntries;

      // Get last sync time from most recent registry update
      const lastUpdated = await this.prisma.moduleAIContextRegistry.findFirst({
        orderBy: { lastUpdated: 'desc' },
        select: { lastUpdated: true },
      });

      return {
        totalModules,
        registeredModules,
        unregisteredModules,
        orphanedEntries,
        lastSync: lastUpdated?.lastUpdated,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Extract AI context from module manifest
   */
  private extractAIContextFromManifest(manifest: any): ModuleAIContext | null {
    try {
      // Check if manifest has aiContext field
      if (!manifest || typeof manifest !== 'object') {
        return null;
      }

      const aiContext = manifest.aiContext || manifest.ai_context;

      if (!aiContext) {
        return null;
      }

      // Validate required fields
      if (!aiContext.purpose || !aiContext.category || !aiContext.keywords) {
        console.warn('Invalid AI context: missing required fields (purpose, category, or keywords)');
        return null;
      }

      return aiContext as ModuleAIContext;
    } catch (error) {
      console.error('Error extracting AI context from manifest:', error);
      return null;
    }
  }

  /**
   * Detect if AI context has changed
   */
  private detectChanges(
    existing: any,
    newContext: ModuleAIContext,
    newVersion: string
  ): boolean {
    // Check version first (simplest check)
    if (existing.version !== newVersion) {
      return true;
    }

    // Deep comparison of key fields
    const fieldsToCheck: (keyof ModuleAIContext)[] = [
      'purpose',
      'category',
      'keywords',
      'patterns',
      'concepts',
    ];

    for (const field of fieldsToCheck) {
      const existingValue = JSON.stringify(existing[field]);
      const newValue = JSON.stringify(newContext[field]);

      if (existingValue !== newValue) {
        return true;
      }
    }

    // Check context providers (compare by name and endpoint)
    const existingProviders = JSON.stringify(existing.contextProviders);
    const newProviders = JSON.stringify(newContext.contextProviders);

    if (existingProviders !== newProviders) {
      return true;
    }

    return false;
  }

  /**
   * Add a module to the registry
   */
  private async addModuleToRegistry(
    moduleId: string,
    moduleName: string,
    version: string,
    aiContext: ModuleAIContext
  ): Promise<void> {
    await this.prisma.moduleAIContextRegistry.create({
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
        relationships: (aiContext.relationships || []) as any,
        fullAIContext: aiContext as any,
        version,
      },
    });
  }

  /**
   * Update a module in the registry
   */
  private async updateModuleInRegistry(
    moduleId: string,
    moduleName: string,
    version: string,
    aiContext: ModuleAIContext
  ): Promise<void> {
    await this.prisma.moduleAIContextRegistry.update({
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
        relationships: (aiContext.relationships || []) as any,
        fullAIContext: aiContext as any,
        version,
        lastUpdated: new Date(),
      },
    });
  }
}

// Export singleton instance
export const moduleRegistrySyncService = new ModuleRegistrySyncService();

