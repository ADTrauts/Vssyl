import { unzipSync } from 'fflate';
import { logger } from '../lib/logger';

export type SmartFindingSeverity = 'low' | 'medium' | 'high';
export type SmartVerdict = 'PASS' | 'WARN' | 'FAIL';

export interface SmartScanFinding {
  severity: SmartFindingSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface SmartScanResult {
  scanner: 'smart_v1';
  checkedAt: string;
  objectPath?: string;
  riskScore: number;
  verdict: SmartVerdict;
  findings: SmartScanFinding[];
}

const EXECUTABLE_EXTENSIONS = /\.(exe|dll|bat|cmd|ps1|msi|apk|ipa)$/i;
const SCRIPT_PATTERN = /\.(js|mjs|cjs|ts|tsx|jsx|html)$/i;
const HIGH_RISK_PATTERNS: Array<{
  code: string;
  regex: RegExp;
  token: string;
  message: string;
  severity: SmartFindingSeverity;
}> = [
  {
    code: 'obfuscated_eval_chain',
    regex: /eval\s*\(\s*atob\s*\(/i,
    token: 'eval(atob(',
    message: 'Suspicious obfuscated eval/atob chain detected',
    severity: 'high',
  },
  {
    code: 'dangerous_function_constructor',
    regex: /new\s+Function\s*\(/i,
    token: 'new function(',
    message: 'Dynamic function constructor detected',
    severity: 'medium',
  },
  {
    code: 'js_eval_usage',
    regex: /(^|[^a-zA-Z0-9_])eval\s*\(/i,
    token: 'eval(',
    message: 'eval() usage detected',
    severity: 'medium',
  },
  {
    code: 'insecure_http_reference',
    regex: /http:\/\/[^\s"'`<>]+/i,
    token: 'http://',
    message: 'Insecure HTTP resource reference detected',
    severity: 'low',
  },
];

function severityWeight(severity: SmartFindingSeverity): number {
  if (severity === 'high') return 45;
  if (severity === 'medium') return 20;
  return 8;
}

function buildResult(findings: SmartScanFinding[], objectPath?: string): SmartScanResult {
  const baseScore = findings.reduce((acc, f) => acc + severityWeight(f.severity), 0);
  const riskScore = Math.max(0, Math.min(100, baseScore));
  const hasHigh = findings.some(f => f.severity === 'high');
  const verdict: SmartVerdict = hasHigh || riskScore >= 80 ? 'FAIL' : riskScore >= 30 ? 'WARN' : 'PASS';

  return {
    scanner: 'smart_v1',
    checkedAt: new Date().toISOString(),
    objectPath,
    riskScore,
    verdict,
    findings,
  };
}

/**
 * Phase 1 SmartScan:
 * - Detect executable/binary-like artifacts in zip bundles
 * - Flag suspicious script patterns and insecure external references
 * - Produce advisory risk score/verdict for admin review
 */
export function runSmartModuleScan(zipBuffer: Buffer, context?: { objectPath?: string }): SmartScanResult {
  try {
    const u8 = new Uint8Array(zipBuffer);
    const files = unzipSync(u8);
    const names = Object.keys(files);
    const findings: SmartScanFinding[] = [];

    for (const name of names) {
      if (EXECUTABLE_EXTENSIONS.test(name)) {
        findings.push({
          severity: 'high',
          code: 'executable_artifact',
          message: 'Executable file extension found in artifact bundle',
          path: name,
        });
      }

      if (!SCRIPT_PATTERN.test(name)) {
        continue;
      }

      const fileBytes = files[name];
      const sample = Buffer.from(fileBytes).toString('utf8', 0, Math.min(fileBytes.length, 250_000));
      const sampleLower = sample.toLowerCase();

      for (const pattern of HIGH_RISK_PATTERNS) {
        if (pattern.regex.test(sample) || sampleLower.includes(pattern.token)) {
          findings.push({
            severity: pattern.severity,
            code: pattern.code,
            message: pattern.message,
            path: name,
          });
        }
      }
    }

    return buildResult(findings, context?.objectPath);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Smart module scan failed internally', {
      operation: 'module_artifact_smart_scan',
      error: { message: err.message, stack: err.stack },
    });

    return buildResult(
      [
        {
          severity: 'medium',
          code: 'smart_scan_internal_error',
          message: 'Smart scan failed internally; review manually',
        },
      ],
      context?.objectPath
    );
  }
}
