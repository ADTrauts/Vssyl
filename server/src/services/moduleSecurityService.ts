import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  ModuleSecurityValidation,
  SecurityValidationResult,
  MalwareScanResult,
  VulnerabilityCheckResult,
  ModulePermissionAudit,
  ModuleSubmissionSecurityContext
} from '../../../shared/src/types/security';

/**
 * Module Security Service
 * Handles security validation, malware scanning, and vulnerability checks for module submissions
 * Following our Service Architecture Standards
 */
export class ModuleSecurityService extends EventEmitter {
  private prisma: PrismaClient;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * Validate module submission for security compliance
   * @param submissionData - Module submission data
   * @returns Security validation result
   */
  async validateModuleSubmission(submissionData: Record<string, unknown>): Promise<SecurityValidationResult> {
    try {
      console.log('🔒 Starting module security validation...');
      
      const validationDetails: ModuleSecurityValidation = {
        staticCodeAnalysis: {
          malwareScan: false,
          vulnerabilityCheck: false,
          codeQualityScore: 0,
          dependencyAudit: []
        },
        sandboxTesting: {
          behaviorAnalysis: false,
          networkTrafficMonitoring: false,
          performanceMetrics: {},
          securityViolations: []
        },
        humanReview: {
          codeReview: false,
          permissionAudit: false,
          policyCompliance: false,
          reviewerNotes: ''
        },
        securityStatus: 'pending',
        securityScore: 0,
        validatedAt: new Date().toISOString(),
        validatedBy: 'system'
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // 1. URL Validation
      const urlValidationResult = await this.validateModuleUrl(submissionData);
      if (!urlValidationResult.isValid) {
        errors.push(...urlValidationResult.errors);
        warnings.push(...urlValidationResult.warnings);
      }

      // 2. Manifest Validation
      const manifestValidationResult = await this.validateModuleManifest(submissionData);
      if (!manifestValidationResult.isValid) {
        errors.push(...manifestValidationResult.errors);
        warnings.push(...manifestValidationResult.warnings);
      }

      // 3. Permission Audit
      const permissionAuditResult = await this.auditModulePermissions(submissionData);
      validationDetails.humanReview.permissionAudit = true;
      if (permissionAuditResult.riskLevel === 'high') {
        errors.push('High-risk permissions detected');
      } else if (permissionAuditResult.riskLevel === 'medium') {
        warnings.push('Medium-risk permissions detected');
      }

      // 4. Basic Malware Scan (placeholder for now)
      const malwareScanResult = await this.performBasicMalwareScan(submissionData);
      validationDetails.staticCodeAnalysis.malwareScan = malwareScanResult.isClean;
      if (!malwareScanResult.isClean) {
        errors.push('Malware detected in module');
      }

      // 5. Vulnerability Check (placeholder for now)
      const vulnerabilityResult = await this.checkVulnerabilities(submissionData);
      validationDetails.staticCodeAnalysis.vulnerabilityCheck = !vulnerabilityResult.hasVulnerabilities;
      if (vulnerabilityResult.hasVulnerabilities) {
        warnings.push(`${vulnerabilityResult.vulnerabilities.length} vulnerabilities detected`);
      }

      // Calculate security score
      let securityScore = 100;
      securityScore -= errors.length * 20; // -20 points per error
      securityScore -= warnings.length * 10; // -10 points per warning
      securityScore = Math.max(0, securityScore);

      validationDetails.securityScore = securityScore;
      validationDetails.securityStatus = errors.length > 0 ? 'failed' : 
                                        warnings.length > 0 ? 'warning' : 'passed';

      // Generate recommendations
      if (securityScore < 80) {
        recommendations.push('Consider reviewing module permissions and dependencies');
      }
      if (warnings.length > 0) {
        recommendations.push('Address security warnings before approval');
      }

      const result: SecurityValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        securityScore,
        recommendations,
        validationDetails
      };

      this.emit('validationComplete', { submissionData, result });
      
      await logger.info('Module security validation completed', {
        operation: 'module_security_validation',
        securityScore,
        errorsCount: errors.length,
        warningsCount: warnings.length
      });

      console.log(`✅ Module security validation completed. Score: ${securityScore}/100`);
      return result;

    } catch (error) {
      console.error('❌ Error in module security validation:', error);
      await logger.error('Module security validation failed', {
        operation: 'module_security_validation',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

  /**
   * Validate module URL for security compliance
   */
  private async validateModuleUrl(submissionData: Record<string, unknown>): Promise<{isValid: boolean; errors: string[]; warnings: string[]}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const manifest = submissionData.manifest as Record<string, unknown>;
      const entryUrl = manifest?.frontend?.entryUrl as string;

      if (!entryUrl || typeof entryUrl !== 'string') {
        errors.push('manifest.frontend.entryUrl is required');
        return { isValid: false, errors, warnings };
      }

      const parsed = new URL(entryUrl);
      
      // Check HTTPS requirement
      if (parsed.protocol !== 'https:') {
        errors.push('frontend.entryUrl must use HTTPS');
      }

      // Check for localhost (development only)
      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
      if (isLocalhost) {
        warnings.push('Localhost URLs are only allowed for development');
      }

      // Check for suspicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'short.link'];
      if (suspiciousDomains.some(domain => parsed.hostname.includes(domain))) {
        warnings.push('URL shortening services are not recommended');
      }

      return { isValid: errors.length === 0, errors, warnings };

    } catch (error) {
      errors.push('Invalid frontend.entryUrl format');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate module manifest for security compliance
   */
  private async validateModuleManifest(submissionData: Record<string, unknown>): Promise<{isValid: boolean; errors: string[]; warnings: string[]}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const manifest = submissionData.manifest as Record<string, unknown>;

      if (!manifest) {
        errors.push('Module manifest is required');
        return { isValid: false, errors, warnings };
      }

      // Check required manifest fields
      const requiredFields = ['name', 'version', 'description', 'author', 'license'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          errors.push(`Manifest field '${field}' is required`);
        }
      }

      // Validate permissions
      const permissions = manifest.permissions as string[];
      if (permissions && Array.isArray(permissions)) {
        const dangerousPermissions = ['file-system', 'network-access', 'process-spawn'];
        const hasDangerousPermissions = permissions.some(perm => 
          dangerousPermissions.some(dangerous => perm.includes(dangerous))
        );
        
        if (hasDangerousPermissions) {
          warnings.push('Module requests potentially dangerous permissions');
        }
      }

      return { isValid: errors.length === 0, errors, warnings };

    } catch (error) {
      errors.push('Invalid manifest format');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Audit module permissions for security risks
   */
  private async auditModulePermissions(submissionData: Record<string, unknown>): Promise<ModulePermissionAudit> {
    const manifest = submissionData.manifest as Record<string, unknown>;
    const permissions = manifest?.permissions as string[] || [];

    const requestedPermissions = permissions;
    const approvedPermissions: string[] = [];
    const rejectedPermissions: string[] = [];
    const justification: Record<string, string> = {};

    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Define permission risk levels
    const lowRiskPermissions = ['read', 'display', 'notifications'];
    const mediumRiskPermissions = ['storage', 'api-access', 'user-data'];
    const highRiskPermissions = ['file-system', 'network-access', 'process-spawn', 'system-access'];

    for (const permission of requestedPermissions) {
      if (lowRiskPermissions.some(low => permission.includes(low))) {
        approvedPermissions.push(permission);
        justification[permission] = 'Low risk permission';
      } else if (mediumRiskPermissions.some(med => permission.includes(med))) {
        approvedPermissions.push(permission);
        justification[permission] = 'Medium risk permission - manual review required';
        if (riskLevel === 'low') riskLevel = 'medium';
      } else if (highRiskPermissions.some(high => permission.includes(high))) {
        rejectedPermissions.push(permission);
        justification[permission] = 'High risk permission - requires admin approval';
        riskLevel = 'high';
      } else {
        // Unknown permission - treat as medium risk
        approvedPermissions.push(permission);
        justification[permission] = 'Unknown permission - manual review required';
        if (riskLevel === 'low') riskLevel = 'medium';
      }
    }

    return {
      requestedPermissions,
      approvedPermissions,
      rejectedPermissions,
      justification,
      riskLevel
    };
  }

  /**
   * Perform basic malware scan (placeholder implementation)
   */
  private async performBasicMalwareScan(submissionData: Record<string, unknown>): Promise<MalwareScanResult> {
    // Placeholder implementation - in Phase 2, this will integrate with VirusTotal API
    console.log('🔍 Performing basic malware scan...');
    
    // For now, we'll do basic checks
    const manifest = submissionData.manifest as Record<string, unknown>;
    const entryUrl = manifest?.frontend?.entryUrl as string;
    
    // Check for suspicious patterns in URL
    const suspiciousPatterns = ['malware', 'virus', 'trojan', 'backdoor'];
    const hasSuspiciousPatterns = suspiciousPatterns.some(pattern => 
      entryUrl?.toLowerCase().includes(pattern)
    );

    return {
      isClean: !hasSuspiciousPatterns,
      scanId: `scan_${Date.now()}`,
      scanDate: new Date().toISOString(),
      detectedThreats: hasSuspiciousPatterns ? ['Suspicious URL patterns detected'] : [],
      scanProvider: 'basic-scanner',
      confidence: hasSuspiciousPatterns ? 60 : 95
    };
  }

  /**
   * Check for vulnerabilities (placeholder implementation)
   */
  private async checkVulnerabilities(submissionData: Record<string, unknown>): Promise<VulnerabilityCheckResult> {
    // Placeholder implementation - in Phase 2, this will integrate with npm audit or similar
    console.log('🔍 Checking for vulnerabilities...');
    
    const manifest = submissionData.manifest as Record<string, unknown>;
    const dependencies = manifest?.dependencies as string[] || [];

    // For now, we'll do basic checks
    const knownVulnerableDependencies = ['vulnerable-package', 'old-library', 'deprecated-module'];
    const vulnerabilities = dependencies.filter(dep => 
      knownVulnerableDependencies.some(vuln => dep.includes(vuln))
    ).map(dep => ({
      id: `vuln_${dep}`,
      severity: 'medium' as const,
      description: `Known vulnerability in ${dep}`,
      affectedDependencies: [dep]
    }));

    return {
      hasVulnerabilities: vulnerabilities.length > 0,
      vulnerabilities,
      scanDate: new Date().toISOString()
    };
  }

  /**
   * Create security context for module submission
   */
  async createSecurityContext(submissionId: string, moduleId: string, submitterId: string): Promise<ModuleSubmissionSecurityContext> {
    const securityContext: ModuleSubmissionSecurityContext = {
      submissionId,
      moduleId,
      submitterId,
      validationStatus: 'pending',
      securityChecks: {
        malwareScan: null,
        vulnerabilityCheck: null,
        permissionAudit: null,
        urlValidation: false,
        manifestValidation: false
      },
      reviewHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, we would store this in the database
    // For now, we'll just return it
    return securityContext;
  }
}
