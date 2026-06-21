import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { describe, expect, it } from 'vitest';
import { listRegisteredAdapters, listSupportedEntityTypes } from '../adapterRegistry.js';

const CONTEXT_GRAPH_ROOT = join(process.cwd(), 'src/context-graph');

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      files.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

const SOURCE_FILES = collectTsFiles(CONTEXT_GRAPH_ROOT);
const SOURCE_CONTENT = SOURCE_FILES.map((f) => ({
  path: relative(CONTEXT_GRAPH_ROOT, f),
  content: readFileSync(f, 'utf8'),
}));

describe('context graph federation & constitutional validation (CG-1C)', () => {
  it('registry has eight adapters covering eleven entity types', () => {
    expect(listRegisteredAdapters()).toHaveLength(8);
    expect(listSupportedEntityTypes()).toHaveLength(11);
  });

  it('context-graph layer has no write persistence calls', () => {
    const writePatterns = [
      /\.create\s*\(/,
      /\.update\s*\(/,
      /\.delete\s*\(/,
      /\.upsert\s*\(/,
      /\.createMany\s*\(/,
      /\.updateMany\s*\(/,
      /\.deleteMany\s*\(/,
    ];
    for (const file of SOURCE_CONTENT) {
      for (const pattern of writePatterns) {
        expect(file.content, `${file.path} must not contain writes`).not.toMatch(pattern);
      }
    }
  });

  it('does not reference ContextNode or graph database constructs', () => {
    const forbidden = [/ContextNode/i, /neo4j/i, /graphDatabase/i, /universalRelationship/i];
    for (const file of SOURCE_CONTENT) {
      for (const pattern of forbidden) {
        expect(file.content, `${file.path}`).not.toMatch(pattern);
      }
    }
  });

  it('does not implement AI memory graph ownership', () => {
    const combined = SOURCE_CONTENT.map((f) => f.content).join('\n');
    expect(combined).not.toMatch(/UserMemoryFact/);
    expect(combined).not.toMatch(/aiMemoryGraph/i);
  });

  it('tag index is read-only and does not own tag SoR', () => {
    const tagFiles = SOURCE_CONTENT.filter(
      (f) =>
        f.path.startsWith('tag') ||
        f.path.includes('tagProvider') ||
        f.path.includes('tagIndex') ||
        f.path.includes('tagMetadata')
    );
    expect(tagFiles.length).toBeGreaterThan(0);
    const combined = tagFiles.map((f) => f.content).join('\n');
    expect(combined).toMatch(/read-only|never owns|module-owned/i);
    expect(combined).not.toMatch(/\.create\s*\(/);
    expect(combined).not.toMatch(/\.update\s*\(/);
    expect(combined).not.toMatch(/Tag\.create|tagAssignment\.create/i);
  });

  it('adapters only expose read contract methods', () => {
    const adapterFiles = SOURCE_CONTENT.filter((f) => f.path.startsWith('adapters/') && f.path.endsWith('Adapter.ts'));
    expect(adapterFiles.length).toBeGreaterThanOrEqual(8);
    for (const file of adapterFiles) {
      expect(file.content).toMatch(/getNode/);
      expect(file.content).toMatch(/getNeighbors/);
      expect(file.content).toMatch(/getPermissions/);
      expect(file.content).toMatch(/getSummary/);
      expect(file.content).not.toMatch(/createNode|updateNode|deleteNode|persistNode/);
    }
  });

  it('edge types are constitutional only', () => {
    const combined = SOURCE_CONTENT.map((f) => f.content).join('\n');
    const allowedEdgeTypes = ['vlink.attachment', 'notebook.link', 'notebook.containment'];
    const edgeTypeMatches = combined.match(/edgeType:\s*['"]([^'"]+)['"]/g) ?? [];
    const types = edgeTypeMatches.map((m) => m.replace(/edgeType:\s*['"]|['"]/g, ''));
    for (const type of types) {
      expect(allowedEdgeTypes, `unexpected edge type ${type}`).toContain(type);
    }
  });

  it('bundle resolver imports adapters via registry not cross-module prisma', () => {
    const bundleContent = SOURCE_CONTENT.find((f) => f.path === 'bundleResolver.ts')?.content ?? '';
    expect(bundleContent).toMatch(/getAdapterForEntity/);
    expect(bundleContent).not.toMatch(/prisma\./);
  });
});
