import { describe, expect, it } from 'vitest';
import {
  CORE_APP_MODULE_IDS,
  PLATFORM_MODULE_IDS,
  isCoreAppModuleId,
  isPlatformModuleId,
  isVisibleInMarketplace,
  isVisibleInModuleManager,
  partitionModuleCatalog,
} from 'shared/types';

describe('moduleClassification', () => {
  it('identifies platform module ids', () => {
    for (const id of PLATFORM_MODULE_IDS) {
      expect(isPlatformModuleId(id)).toBe(true);
    }
    expect(isPlatformModuleId('drive')).toBe(false);
  });

  it('identifies core app module ids', () => {
    for (const id of CORE_APP_MODULE_IDS) {
      expect(isCoreAppModuleId(id)).toBe(true);
    }
    expect(isCoreAppModuleId('todo')).toBe(false);
  });

  it('hides platform modules from module manager and marketplace', () => {
    for (const id of PLATFORM_MODULE_IDS) {
      expect(isVisibleInModuleManager(id, 'both', 'personal')).toBe(false);
      expect(isVisibleInMarketplace(id, 'both', 'personal')).toBe(false);
    }
  });

  it('shows core apps in module manager but not marketplace', () => {
    for (const id of CORE_APP_MODULE_IDS) {
      expect(isVisibleInModuleManager(id, 'both', 'personal')).toBe(true);
      expect(isVisibleInMarketplace(id, 'both', 'personal')).toBe(false);
    }
  });

  it('excludes business-only apps from personal browse', () => {
    expect(isVisibleInModuleManager('hr', 'business', 'personal')).toBe(false);
    expect(isVisibleInModuleManager('hr', 'business', 'business')).toBe(true);
  });

  it('partitions catalog into core and installable apps', () => {
    const modules = [
      { id: 'dashboard', name: 'Dashboard' },
      { id: 'drive', name: 'Drive' },
      { id: 'todo', name: 'Todo' },
      { id: 'hr', name: 'HR' },
    ];

    const personal = partitionModuleCatalog(modules, 'personal', () => 'both');
    expect(personal.coreApps.map((m) => m.id)).toEqual(['drive']);
    expect(personal.installedApps.map((m) => m.id)).toEqual(['todo']);

    const business = partitionModuleCatalog(modules, 'business', () => 'both');
    expect(business.coreApps.map((m) => m.id)).toEqual(['drive']);
    expect(business.installedApps.map((m) => m.id)).toEqual(['todo', 'hr']);
  });
});
