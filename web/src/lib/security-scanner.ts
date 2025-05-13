import { readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SecurityScanResult {
  score: number;
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    description: string;
    location: string;
  }>;
}

export class SecurityScanner {
  private async analyzeCode(modulePath: string): Promise<SecurityScanResult> {
    const issues: SecurityScanResult['issues'] = [];
    let score = 100;

    try {
      // Read module code
      const code = await readFile(modulePath, 'utf-8');

      // Check for common security issues
      if (code.includes('eval(')) {
        issues.push({
          severity: 'high',
          description: 'Use of eval() detected',
          location: 'module code'
        });
        score -= 20;
      }

      if (code.includes('require(')) {
        issues.push({
          severity: 'medium',
          description: 'Dynamic require() detected',
          location: 'module code'
        });
        score -= 10;
      }

      if (code.includes('process.env')) {
        issues.push({
          severity: 'medium',
          description: 'Direct access to process.env detected',
          location: 'module code'
        });
        score -= 10;
      }

      // Run ESLint with security rules
      const { stdout } = await execAsync(`npx eslint ${modulePath} --config .eslintrc.security.json`);
      const eslintIssues = JSON.parse(stdout);
      
      eslintIssues.forEach((issue: any) => {
        issues.push({
          severity: issue.severity === 2 ? 'high' : 'medium',
          description: issue.message,
          location: `${issue.file}:${issue.line}:${issue.column}`
        });
        score -= issue.severity === 2 ? 15 : 10;
      });

    } catch (error) {
      console.error('Error analyzing code:', error);
      issues.push({
        severity: 'high',
        description: 'Failed to analyze code',
        location: 'module code'
      });
      score = 0;
    }

    return { score: Math.max(0, score), issues };
  }

  private async analyzeManifest(manifestPath: string, permissions: string[], dependencies: Record<string, string>): Promise<SecurityScanResult> {
    const issues: SecurityScanResult['issues'] = [];
    let score = 100;

    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

      // Check permissions
      if (permissions.includes('admin')) {
        issues.push({
          severity: 'high',
          description: 'Admin permission requested',
          location: 'manifest'
        });
        score -= 20;
      }

      if (permissions.includes('system')) {
        issues.push({
          severity: 'high',
          description: 'System permission requested',
          location: 'manifest'
        });
        score -= 20;
      }

      // Check dependencies
      for (const [name, version] of Object.entries(dependencies)) {
        // Check for known vulnerable packages
        const { stdout } = await execAsync(`npm audit ${name}@${version} --json`);
        const audit = JSON.parse(stdout);
        
        if (audit.vulnerabilities) {
          Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
            issues.push({
              severity: vuln.severity,
              description: `Vulnerable dependency: ${pkg} (${vuln.title})`,
              location: 'dependencies'
            });
            score -= vuln.severity === 'high' ? 15 : 10;
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing manifest:', error);
      issues.push({
        severity: 'high',
        description: 'Failed to analyze manifest',
        location: 'manifest'
      });
      score = 0;
    }

    return { score: Math.max(0, score), issues };
  }

  async scanModule({ modulePath, manifestPath, permissions, dependencies }: {
    modulePath: string;
    manifestPath: string;
    permissions: string[];
    dependencies: Record<string, string>;
  }): Promise<SecurityScanResult> {
    const [codeAnalysis, manifestAnalysis] = await Promise.all([
      this.analyzeCode(modulePath),
      this.analyzeManifest(manifestPath, permissions, dependencies)
    ]);

    return {
      score: Math.round((codeAnalysis.score + manifestAnalysis.score) / 2),
      issues: [...codeAnalysis.issues, ...manifestAnalysis.issues]
    };
  }
} 