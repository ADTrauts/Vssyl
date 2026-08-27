import { describe, expect, it } from 'vitest';
import {
  REQUIRED_SOURCE_CLAIM_BOUNDARY_INSTRUCTION,
  applyRequiredSourceClaimBoundary,
  buildRequiredSourceFailureDisclosure,
  responseAssertsUnsupportedLiveClaims,
  responseDisclosesRequiredSourceLimitation,
} from '../requiredSourceClaimBoundary';
import { buildProviderUserPrompt } from '../../prompts/providerUserPrompt';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import type { AIAssembledContext } from '../../context/AIContextAssembler';

const minimalAssembled = {
  scope: 'general',
  intent: 'general',
  structuredResponseMode: 'conversation',
  usedModules: [],
  contextBlocks: [],
  evidence: [],
  assumptions: [],
  risks: ['Live public web search was unavailable this turn'],
  missingContext: [],
} as unknown as AIAssembledContext;

describe('requiredSourceClaimBoundary', () => {
  it('detects unsupported live claims like As of today + rates', () => {
    const bad =
      'As of today, average mortgage rates can vary, but generally 30-year fixed-rate mortgages are around 7.5% to 8%.';
    expect(responseAssertsUnsupportedLiveClaims(bad)).toBe(true);
    expect(responseDisclosesRequiredSourceLimitation(bad)).toBe(false);
  });

  it('keeps disclosed mixed answers without live numbers', () => {
    const ok =
      "I couldn't verify current mortgage rates right now because web search is unavailable. " +
      'A fixed-rate mortgage keeps the interest rate unchanged for the term of the loan.';
    expect(responseDisclosesRequiredSourceLimitation(ok)).toBe(true);
    expect(responseAssertsUnsupportedLiveClaims(ok)).toBe(false);
  });

  it('replaces unsupported current-rate answer when web_search required failed', () => {
    const bad =
      'As of today, average mortgage rates can vary depending on the type of loan, but generally 30-year fixed-rate mortgages are around 7.5% to 8%.';
    const out = applyRequiredSourceClaimBoundary({
      response: bad,
      requiredSourceFailures: ['web_search'],
    });
    expect(out.applied).toBe(true);
    expect(out.response).toBe(buildRequiredSourceFailureDisclosure(['web_search']));
    expect(out.response.toLowerCase()).toContain("couldn't verify");
    expect(responseAssertsUnsupportedLiveClaims(out.response)).toBe(false);
  });

  it('keeps cooperative disclosed answer for mixed question', () => {
    const ok =
      "I couldn't verify current mortgage rates because live web search is unavailable. " +
      'A fixed-rate mortgage keeps the interest rate unchanged for the term of the loan.';
    const out = applyRequiredSourceClaimBoundary({
      response: ok,
      requiredSourceFailures: ['web_search'],
    });
    expect(out.applied).toBe(false);
    expect(out.response).toBe(ok);
  });

  it('does nothing when no required source failures (optional failure path)', () => {
    const answer = 'EBITDA is earnings before interest, taxes, depreciation, and amortization.';
    const out = applyRequiredSourceClaimBoundary({
      response: answer,
      requiredSourceFailures: [],
    });
    expect(out.applied).toBe(false);
    expect(out.response).toBe(answer);
  });
});

describe('provider prompt — required source claim boundary', () => {
  it('conversation slim retains requiredSourceFailures and claim-boundary instruction', () => {
    const q = 'What are average mortgage rates today?';
    const structured = inferStructuredResponseMode({ query: q });
    expect(structured.responseContract).toBe('conversation');

    const prompt = buildProviderUserPrompt({
      requestQuery: q,
      data: {
        responseContract: 'conversation',
        userQuery: q,
        requiredSourceFailures: ['web_search'],
        assembledContext: minimalAssembled,
      },
    });

    expect(prompt).toContain(REQUIRED_SOURCE_CLAIM_BOUNDARY_INSTRUCTION);
    expect(prompt).toContain('web_search');
    expect(prompt).toContain('required_source_failed');
    expect(prompt).toContain('claimBoundary');
  });

  it('stable EBITDA conversation has no claim-boundary block', () => {
    const q = 'What is EBITDA?';
    const prompt = buildProviderUserPrompt({
      requestQuery: q,
      data: {
        responseContract: 'conversation',
        userQuery: q,
        assembledContext: minimalAssembled,
      },
    });
    expect(prompt).not.toContain(REQUIRED_SOURCE_CLAIM_BOUNDARY_INSTRUCTION);
    expect(prompt).not.toContain('claimBoundary');
  });
});
