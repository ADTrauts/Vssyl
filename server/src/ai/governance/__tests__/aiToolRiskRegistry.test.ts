import { describe, expect, it } from 'vitest';
import { resolveApprovalRequired, type AIActionRiskDeclaration } from 'vssyl-shared';
import {
  ACTIVE_AI_TOOL_RISK_REGISTRY,
  getToolRiskDeclaration,
  toolRequiresApproval,
} from '../aiToolRiskRegistry';
import { hashToolArguments, buildDefaultIdempotencyKey, stableStringify } from '../aiActionIdempotency';

describe('AI tool risk registry (Phase 1)', () => {
  it('classifies all registered Twin tools', () => {
    const names = Object.keys(ACTIVE_AI_TOOL_RISK_REGISTRY);
    expect(names).toContain('share_file');
    expect(names).toContain('create_todo');
    expect(names).toContain('list_drive_files');
    expect(names.length).toBe(8);
  });

  it('requires approval for share_file (EXTERNAL_VISIBILITY)', () => {
    expect(toolRequiresApproval('share_file')).toBe(true);
    const decl = getToolRiskDeclaration('share_file')!;
    expect(decl.riskCategory).toBe('EXTERNAL_VISIBILITY');
    expect(resolveApprovalRequired(decl)).toBe(true);
  });

  it('does not require approval for create_todo (LOW_RISK_REVERSIBLE)', () => {
    expect(toolRequiresApproval('create_todo')).toBe(false);
  });

  it('does not require approval for read-only tools', () => {
    expect(toolRequiresApproval('list_drive_files')).toBe(false);
    expect(toolRequiresApproval('search_places')).toBe(false);
  });

  it('fails closed for unknown tools', () => {
    expect(toolRequiresApproval('delete_everything')).toBe(true);
  });

  it('ALWAYS / NEVER policies override category', () => {
    const always: AIActionRiskDeclaration = {
      canonicalName: 'x',
      domainOwner: 'test',
      riskCategory: 'READ_ONLY',
      mutating: false,
      externalVisibility: false,
      reversible: true,
      approvalPolicy: 'ALWAYS',
      idempotencyRequired: false,
      auditRequired: true,
      businessScopeRequired: false,
    };
    const never: AIActionRiskDeclaration = {
      ...always,
      riskCategory: 'DESTRUCTIVE',
      approvalPolicy: 'NEVER',
    };
    expect(resolveApprovalRequired(always)).toBe(true);
    expect(resolveApprovalRequired(never)).toBe(false);
  });
});

describe('AI action idempotency helpers', () => {
  it('hashes args stably regardless of key order', () => {
    expect(hashToolArguments({ a: 1, b: 2 })).toBe(hashToolArguments({ b: 2, a: 1 }));
    expect(stableStringify({ z: 1, a: { y: 2, x: 3 } })).toBe(
      stableStringify({ a: { x: 3, y: 2 }, z: 1 })
    );
  });

  it('builds scoped idempotency keys', () => {
    const key = buildDefaultIdempotencyKey({
      userId: 'u1',
      businessId: 'b1',
      actionName: 'create_todo',
      argsHash: 'abc',
      approvalId: null,
    });
    expect(key).toContain('u1');
    expect(key).toContain('b1');
    expect(key).toContain('create_todo');
    expect(key).toContain('none');
  });
});
