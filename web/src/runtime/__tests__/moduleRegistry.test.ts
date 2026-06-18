import { describe, expect, it } from 'vitest';
import {
  getModuleDefinition,
  getModulesForContext,
  getModuleDisplayName,
  getUnknownModuleFallback,
} from '../modules/moduleRegistry';
import { MODULE_ICONS } from '../../config/moduleIcons';

describe('moduleRegistry', () => {
  it('filters business-only modules for business context', () => {
    const businessModules = getModulesForContext('business');
    const ids = businessModules.map((m) => m.id);
    expect(ids).toContain('hr');
    expect(ids).toContain('scheduling');
    expect(ids).toContain('members');
    expect(ids).toContain('analytics');
    expect(ids).toContain('place');
  });

  it('excludes business-scoped modules from personal context', () => {
    const personalModules = getModulesForContext('personal');
    const ids = personalModules.map((m) => m.id);
    expect(ids).not.toContain('hr');
    expect(ids).not.toContain('scheduling');
    expect(ids).not.toContain('admin');
    expect(ids).toContain('drive');
    expect(ids).toContain('chat');
    expect(ids).toContain('place');
  });

  it('returns undefined for unknown module', () => {
    expect(getModuleDefinition('not-a-real-module')).toBeUndefined();
  });

  it('provides unknown module fallback display name', () => {
    const fallback = getUnknownModuleFallback('custom-widget-x');
    expect(fallback.id).toBe('custom-widget-x');
    expect(fallback.name).toBe('Custom-widget-x');
  });

  it('normalizes connections to members', () => {
    expect(getModuleDefinition('connections')?.id).toBe('members');
    expect(getModuleDisplayName('connections')).toBe('Members');
  });

  it('exposes place display name and dashboard icon (Wave 3A)', () => {
    expect(getModuleDisplayName('place')).toBe('Place');
    expect(MODULE_ICONS.place).toBeDefined();
    expect(getModuleDefinition('place')?.capabilities).toContain('businessWorkspace');
  });

  it('marks core modules with source core', () => {
    const drive = getModuleDefinition('drive');
    expect(drive?.source).toBe('core');
    expect(drive?.status).toBe('active');
  });

  it('exposes notebook as active facade and hides legacy notes from lists', () => {
    const notebook = getModuleDefinition('notebook');
    expect(notebook?.status).toBe('active');
    expect(notebook?.widgets).toContain('notebook');

    const personal = getModulesForContext('personal');
    expect(personal.map((m) => m.id)).toContain('notebook');
    expect(personal.map((m) => m.id)).not.toContain('notes');
  });
});
