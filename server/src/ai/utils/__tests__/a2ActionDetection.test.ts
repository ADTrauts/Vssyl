/**
 * A2 — Bounded action / mutation detection (communication, share, calendar, task).
 * Action recognition only; does not modify truth routing or execution.
 */
import { describe, expect, it } from 'vitest';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

describe('A2 — bounded action detection', () => {
  const actionTrue = [
    'Message Sarah.',
    'Please message Sarah.',
    'Can you message Sarah?',
    'Send Sarah a message.',
    'Send a message to Sarah.',
    "Tell Sarah I'll be late.",
    "Tell Sarah that I'll be late.",
    "Let Sarah know I'll be late.",
    'Notify Sarah that the meeting changed.',
    'Ask Sarah if she is available.',
    'Reply to Sarah.',
    'Respond to Sarah.',
    'Share this with Sarah.',
    'Share this file with Sarah.',
    'Send this file to Sarah.',
    'Send this to Sarah.',
    'Give Sarah access to this file.',
    'Grant Sarah access to this file.',
    'Share Q3 Staffing Notes.pdf with Sarah.',
    'Move my meeting to 3 PM.',
    'Reschedule my meeting.',
    'Cancel my meeting.',
    'Assign this task to Sarah.',
  ];

  const actionFalse = [
    'What did Sarah send me?',
    'Explain what Sarah sent me.',
    'What message did Sarah send me?',
    'What did Sarah tell me?',
    'What did Sarah share with me?',
    'What did Sarah assign me?',
    'What was the last thing Sarah gave me?',
    'Who messaged me?',
    'What did I send Sarah yesterday?',
    'What files did Sarah share with me?',
    'What is a message?',
    'How does messaging work?',
    'What makes a good message?',
    'How should I tell someone bad news?',
    'How does file sharing work?',
    'What does granting access mean?',
    'Tell me my email.',
    "What's my next meeting?",
    'What do I have scheduled today?',
    'Are we fully staffed?',
  ];

  it.each(actionTrue)('action true: %s', (q) => {
    expect(isActionMutationRequest(q)).toBe(true);
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.isActionRequest).toBe(true);
    expect(inferred.informationalAnswerEscape).not.toBe(true);
    expect(inferred.responseContract).not.toBe('grounded_answer');
  });

  it.each(actionFalse)('action false: %s', (q) => {
    expect(isActionMutationRequest(q)).toBe(false);
  });

  it('historical read stays authoritative grounded (A1)', () => {
    const q = 'What did Sarah send me?';
    expect(isActionMutationRequest(q)).toBe(false);
    expect(requiresAuthoritativeContext({ query: q })).toBe(true);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.isActionRequest).toBe(false);
    expect(inferred.requiresAuthoritativeContext).toBe(true);
    expect(inferred.responseContract).toBe('grounded_answer');
  });

  it('Drive read vs share action contrast (D2)', () => {
    expect(isActionMutationRequest('What files did Sarah share with me?')).toBe(false);
    expect(requiresAuthoritativeContext({ query: 'What files did Sarah share with me?' })).toBe(
      true
    );
    expect(isActionMutationRequest('Share this file with Sarah.')).toBe(true);
  });

  it('Calendar read vs move action contrast', () => {
    expect(isActionMutationRequest("What's my next meeting?")).toBe(false);
    expect(requiresAuthoritativeContext({ query: "What's my next meeting?" })).toBe(true);
    expect(isActionMutationRequest('Move my meeting.')).toBe(true);
  });

  it('B1 read remains non-action with businessId', () => {
    expect(isActionMutationRequest('Are we fully staffed?')).toBe(false);
    expect(requiresAuthoritativeContext({ query: 'Are we fully staffed?', businessId: BIZ })).toBe(
      true
    );
  });

  it('P1 read remains non-action', () => {
    expect(isActionMutationRequest('What was I working on?')).toBe(false);
    expect(requiresAuthoritativeContext({ query: 'What was I working on?' })).toBe(true);
  });

  it('escape before/after for known A2 misses', () => {
    const nowActions = [
      'Message Sarah.',
      "Tell Sarah I'll be late.",
      'Share this with Sarah.',
    ];
    for (const q of nowActions) {
      const inferred = inferStructuredResponseMode({ query: q });
      expect(inferred.isActionRequest, q).toBe(true);
      expect(inferred.informationalAnswerEscape, q).not.toBe(true);
    }
    const historical = inferStructuredResponseMode({ query: 'What did Sarah send me?' });
    expect(historical.isActionRequest).toBe(false);
    expect(historical.requiresAuthoritativeContext).toBe(true);
    const general = inferStructuredResponseMode({ query: 'What makes a good message?' });
    expect(general.isActionRequest).toBe(false);
    expect(general.informationalAnswerEscape).toBe(true);
  });

  it('referential share action without attachment still action', () => {
    expect(isActionMutationRequest('Share this with Sarah.')).toBe(true);
    expect(isActionMutationRequest('Send this to Sarah.')).toBe(true);
  });
});

/**
 * A2-R — Historical / embedded "tell" reads must not be communication actions.
 * Does not implement P-TRUTH (reqAuth may remain false for personal recall).
 */
describe('A2-R — historical tell/say vs communication action', () => {
  const actionTrue = [
    "Tell Sarah I'll be late.",
    "Can you tell Sarah I'll be late?",
    'Tell Sarah about the meeting.',
    'Please tell Sarah I will call tomorrow.',
    "Could you tell Sarah the file is ready?",
    "Let Sarah know I'll be late.",
    'Notify Sarah.',
    'Message Sarah.',
    'Ask Sarah if she is available.',
  ];

  const actionFalse = [
    'What did I tell Sarah?',
    'What did Sarah tell me?',
    'What house budget did I tell you?',
    'What budget did I tell you?',
    'What did I tell you my budget was?',
    'Tell me what my budget was.',
    'What did I message Sarah?',
    'Who did I tell about the meeting?',
    'When did I tell Sarah?',
    'What did Sarah say?',
    'What did I say to Sarah?',
    'What amount did I say I could spend?',
    'What message did I send Sarah?',
    'What did I send yesterday?',
    'Tell me my email.',
    'Tell me what EBITDA means.',
    'Tell me about mortgages.',
    'Tell me what I said earlier.',
    'Remind me what I said.',
  ];

  it.each(actionTrue)('imperative/polite action true: %s', (q) => {
    expect(isActionMutationRequest(q)).toBe(true);
  });

  it.each(actionFalse)('historical/tell-me action false: %s', (q) => {
    expect(isActionMutationRequest(q)).toBe(false);
  });

  it('house budget tell-you is not action; P-TRUTH not claimed', () => {
    const q = 'What house budget did I tell you?';
    expect(isActionMutationRequest(q)).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.isActionRequest).toBe(false);
    // Acceptable for A2-R: may remain non-authoritative until P-TRUTH.
    expect(inferred.requiresAuthoritativeContext).toBe(false);
    expect(inferred.informationalAnswerEscape).toBe(true);
    expect(inferred.responseContract).toBe('conversation');
  });
});
