/**
 * Phase 8 — Code-first Skill registry. No DB-executable behavior.
 */
import type {
  AISkillDefinition,
  AISkillIntentType,
  AISkillRegistryListItem,
  AISkillScope,
  AISkillVersionPointer,
} from 'vssyl-shared';
import { isExecutableStatus } from './skillLifecycle';

const definitions = new Map<string, AISkillDefinition>();
const activePointers = new Map<string, AISkillVersionPointer>();

function versionKey(key: string, version: string): string {
  return `${key}@${version}`;
}

export function clearSkillRegistryForTests(): void {
  definitions.clear();
  activePointers.clear();
}

export function registerSkillDefinition(def: AISkillDefinition): void {
  if (def.scope !== 'PLATFORM' && def.scope !== 'MODULE_INTERNAL') {
    throw new Error(`Skill scope ${def.scope} is inactive in Phase 8`);
  }
  const vk = versionKey(def.key, def.version);
  if (definitions.has(vk)) {
    throw new Error(`Duplicate skill registration: ${vk}`);
  }
  definitions.set(vk, Object.freeze({ ...def }));

  const pointer = activePointers.get(def.key) ?? {
    key: def.key,
    activeVersion: def.version,
    certifiedVersions: [],
  };
  if (def.status === 'CERTIFIED' || def.status === 'ACTIVE') {
    if (!pointer.certifiedVersions.includes(def.version)) {
      pointer.certifiedVersions = [...pointer.certifiedVersions, def.version];
    }
  }
  if (def.status === 'ACTIVE') {
    pointer.activeVersion = def.version;
  } else if (!activePointers.has(def.key)) {
    pointer.activeVersion = def.version;
  }
  activePointers.set(def.key, pointer);
}

export function getSkillDefinition(key: string, version?: string): AISkillDefinition | undefined {
  const v = version ?? activePointers.get(key)?.activeVersion;
  if (!v) return undefined;
  return definitions.get(versionKey(key, v));
}

export function listSkillDefinitions(filter?: {
  scope?: AISkillScope;
  intentType?: AISkillIntentType;
  executableOnly?: boolean;
  customerVisible?: boolean;
}): AISkillDefinition[] {
  const all = Array.from(definitions.values());
  return all.filter((d) => {
    if (filter?.scope && d.scope !== filter.scope) return false;
    if (filter?.intentType && !d.intentTypes.includes(filter.intentType)) return false;
    if (filter?.executableOnly && !isExecutableStatus(d.status)) return false;
    if (filter?.customerVisible === true && !d.customerVisible) return false;
    if (filter?.customerVisible === false && d.customerVisible) return false;
    return true;
  });
}

export function listSkillRegistryItems(opts?: {
  customerVisibleOnly?: boolean;
}): AISkillRegistryListItem[] {
  const items: AISkillRegistryListItem[] = [];
  for (const pointer of activePointers.values()) {
    const def = getSkillDefinition(pointer.key, pointer.activeVersion);
    if (!def) continue;
    if (opts?.customerVisibleOnly && !def.customerVisible) continue;
    items.push({
      key: def.key,
      name: def.name,
      description: def.description,
      activeVersion: pointer.activeVersion,
      status: def.status,
      scope: def.scope,
      owner: def.owner,
      intentTypes: def.intentTypes,
      customerVisible: def.customerVisible,
      tags: def.tags,
    });
  }
  return items.sort((a, b) => a.key.localeCompare(b.key));
}

export function listVersionsForKey(key: string): AISkillDefinition[] {
  return Array.from(definitions.values())
    .filter((d) => d.key === key)
    .sort((a, b) => a.version.localeCompare(b.version));
}

export function getActivePointer(key: string): AISkillVersionPointer | undefined {
  return activePointers.get(key);
}
