import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  SecurityPolicy,
  SecurityPolicyRule,
  ComplianceFramework,
  ComplianceRequirement,
  SecurityPolicyViolation,
  PolicyEnforcementResult
} from '../../../shared/dist/types/policies';

/**
 * Security Policies Service
 * Manages security policies, compliance frameworks, and policy enforcement
 * Following our Service Architecture Standards
 */
export class SecurityPoliciesService extends EventEmitter {
  private prisma: PrismaClient;
  private securityPolicies: Map<string, SecurityPolicy> = new Map();
  private complianceFrameworks: Map<string, ComplianceFramework> = new Map();
  private readonly POLICY_UPDATE_INTERVAL = 3600000; // 1 hour

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.initializeSecurityPolicies();
    this.initializeComplianceFrameworks();
    this.startPolicyUpdateScheduler();
  }

  /**
   * Get security policy for a module
   * @param moduleId - ID of the module
   * @param moduleData - Module configuration
   * @returns Security policy applicable to the module
   */
  async getSecurityPolicyForModule(moduleId: string, moduleData: Record<string, unknown>): Promise<SecurityPolicy | null> {
    try {
      const moduleCategory = moduleData.category as string;
      const modulePermissions = (moduleData.manifest as Record<string, unknown>)?.permissions as string[] || [];
      
      // Find applicable security policies
      const applicablePolicies = Array.from(this.securityPolicies.values()).filter(policy => 
        policy.enabled && this.isPolicyApplicable(policy, moduleCategory, modulePermissions)
      );
      
      if (applicablePolicies.length === 0) {
        return null;
      }
      
      // Return the most restrictive policy (highest enforcement level)
      const sortedPolicies = applicablePolicies.sort((a, b) => {
        const enforcementOrder = { 'strict': 3, 'moderate': 2, 'advisory': 1 };
        return enforcementOrder[b.enforcement] - enforcementOrder[a.enforcement];
      });
      
      return sortedPolicies[0];
      
    } catch (error) {
      console.error(`❌ Error getting security policy for module ${moduleId}:`, error);
      await logger.error('Security policy retrieval failed', {
        operation: 'security_policy_retrieval',
        moduleId,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

  /**
   * Check module compliance against security policies
   * @param moduleId - ID of the module
   * @param moduleData - Module configuration
   * @returns Policy enforcement result
   */
  async checkModuleCompliance(moduleId: string, moduleData: Record<string, unknown>): Promise<PolicyEnforcementResult> {
    try {
      console.log(`🔍 Checking compliance for module: ${moduleId}`);
      
      const securityPolicy = await this.getSecurityPolicyForModule(moduleId, moduleData);
      const complianceFrameworks = await this.getApplicableComplianceFrameworks(moduleId, moduleData);
      
      const result: PolicyEnforcementResult = {
        moduleId,
        compliant: true,
        violations: [],
        warnings: [],
        recommendations: [],
        policyApplied: securityPolicy?.id || null,
        frameworksApplied: complianceFrameworks.map(f => f.id),
        checkedAt: new Date().toISOString(),
        score: 100
      };
      
      // Check security policy compliance
      if (securityPolicy) {
        const policyResult = await this.checkSecurityPolicyCompliance(moduleId, moduleData, securityPolicy);
        result.violations.push(...policyResult.violations);
        result.warnings.push(...policyResult.warnings);
        result.recommendations.push(...policyResult.recommendations);
      }
      
      // Check compliance framework compliance
      for (const framework of complianceFrameworks) {
        const frameworkResult = await this.checkComplianceFrameworkCompliance(moduleId, moduleData, framework);
        result.violations.push(...frameworkResult.violations);
        result.warnings.push(...frameworkResult.warnings);
        result.recommendations.push(...frameworkResult.recommendations);
      }
      
      // Calculate compliance score
      result.compliant = result.violations.length === 0;
      result.score = this.calculateComplianceScore(result.violations, result.warnings);
      
      this.emit('complianceChecked', { moduleId, result });
      
      await logger.info('Module compliance checked', {
        operation: 'module_compliance_check',
        moduleId,
        compliant: result.compliant,
        violations: result.violations.length,
        warnings: result.warnings.length,
        score: result.score
      });
      
      console.log(`✅ Compliance check completed for module ${moduleId}. Score: ${result.score}/100`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error checking compliance for module ${moduleId}:`, error);
      await logger.error('Module compliance check failed', {
        operation: 'module_compliance_check',
        moduleId,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

  /**
   * Create a new security policy
   * @param policyData - Security policy data
   * @returns Created security policy
   */
  async createSecurityPolicy(policyData: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    try {
      console.log(`📝 Creating security policy: ${policyData.name}`);
      
      const policy: SecurityPolicy = {
        id: `policy_${Date.now()}`,
        ...policyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.securityPolicies.set(policy.id, policy);
      
      this.emit('securityPolicyCreated', { policy });
      
      await logger.info('Security policy created', {
        operation: 'security_policy_creation',
        policyId: policy.id,
        policyName: policy.name,
        category: policy.category,
        enforcement: policy.enforcement
      });
      
      console.log(`✅ Security policy created: ${policy.name}`);
      return policy;
      
    } catch (error) {
      console.error('❌ Error creating security policy:', error);
      await logger.error('Security policy creation failed', {
        operation: 'security_policy_creation',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

  /**
   * Update an existing security policy
   * @param policyId - ID of the policy to update
   * @param updates - Policy updates
   * @returns Updated security policy
   */
  async updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    try {
      console.log(`📝 Updating security policy: ${policyId}`);
      
      const existingPolicy = this.securityPolicies.get(policyId);
      if (!existingPolicy) {
        throw new Error(`Security policy not found: ${policyId}`);
      }
      
      const updatedPolicy: SecurityPolicy = {
        ...existingPolicy,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      this.securityPolicies.set(policyId, updatedPolicy);
      
      this.emit('securityPolicyUpdated', { policyId, updates, updatedPolicy });
      
      await logger.info('Security policy updated', {
        operation: 'security_policy_update',
        policyId,
        updates: Object.keys(updates)
      });
      
      console.log(`✅ Security policy updated: ${policyId}`);
      return updatedPolicy;
      
    } catch (error) {
      console.error(`❌ Error updating security policy ${policyId}:`, error);
      await logger.error('Security policy update failed', {
        operation: 'security_policy_update',
        policyId,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

  /**
   * Initialize default security policies
   */
  private initializeSecurityPolicies(): void {
    // Data Protection Policy
    const dataProtectionPolicy: SecurityPolicy = {
      id: 'data_protection_policy',
      name: 'Data Protection Policy',
      description: 'Ensures modules comply with data protection requirements',
      category: 'data_protection',
      rules: [
        {
          id: 'no_pii_collection',
          name: 'No PII Collection',
          description: 'Modules must not collect personally identifiable information',
          condition: 'dataType.includes("pii")',
          action: 'deny',
          severity: 'high',
          parameters: { dataTypes: ['email', 'phone', 'ssn', 'address'] }
        },
        {
          id: 'data_encryption',
          name: 'Data Encryption',
          description: 'All data transmission must be encrypted',
          condition: 'encryption === false',
          action: 'deny',
          severity: 'critical',
          parameters: { encryptionRequired: true }
        }
      ],
      enforcement: 'strict',
      applicableModules: ['*'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabled: true
    };

    // Access Control Policy
    const accessControlPolicy: SecurityPolicy = {
      id: 'access_control_policy',
      name: 'Access Control Policy',
      description: 'Controls module access to system resources',
      category: 'access_control',
      rules: [
        {
          id: 'minimal_permissions',
          name: 'Minimal Permissions',
          description: 'Modules must request only necessary permissions',
          condition: 'permissions.length > 5',
          action: 'warn',
          severity: 'medium',
          parameters: { maxPermissions: 5 }
        },
        {
          id: 'no_system_access',
          name: 'No System Access',
          description: 'Modules cannot access system-level resources',
          condition: 'permission.includes("system")',
          action: 'deny',
          severity: 'critical',
          parameters: { blockedPermissions: ['system', 'admin', 'root'] }
        }
      ],
      enforcement: 'strict',
      applicableModules: ['*'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabled: true
    };

    // Performance Policy
    const performancePolicy: SecurityPolicy = {
      id: 'performance_policy',
      name: 'Performance Policy',
      description: 'Ensures modules meet performance requirements',
      category: 'performance',
      rules: [
        {
          id: 'memory_limit',
          name: 'Memory Limit',
          description: 'Modules must not exceed memory limits',
          condition: 'memoryUsage > 100MB',
          action: 'warn',
          severity: 'medium',
          parameters: { maxMemory: '100MB' }
        },
        {
          id: 'cpu_limit',
          name: 'CPU Limit',
          description: 'Modules must not exceed CPU limits',
          condition: 'cpuUsage > 80%',
          action: 'warn',
          severity: 'medium',
          parameters: { maxCpu: 80 }
        }
      ],
      enforcement: 'moderate',
      applicableModules: ['*'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabled: true
    };

    // Store policies
    this.securityPolicies.set(dataProtectionPolicy.id, dataProtectionPolicy);
    this.securityPolicies.set(accessControlPolicy.id, accessControlPolicy);
    this.securityPolicies.set(performancePolicy.id, performancePolicy);
  }

  /**
   * Initialize compliance frameworks
   */
  private initializeComplianceFrameworks(): void {
    // GDPR Compliance Framework
    const gdprFramework: ComplianceFramework = {
      id: 'gdpr_compliance',
      name: 'GDPR Compliance',
      description: 'General Data Protection Regulation compliance framework',
      version: '1.0',
      requirements: [
        {
          id: 'data_minimization',
          name: 'Data Minimization',
          description: 'Collect only necessary data',
          category: 'data_privacy',
          mandatory: true,
          checkFunction: 'checkDataMinimization',
          remediation: 'Remove unnecessary data collection'
        },
        {
          id: 'consent_management',
          name: 'Consent Management',
          description: 'Proper consent management for data processing',
          category: 'data_privacy',
          mandatory: true,
          checkFunction: 'checkConsentManagement',
          remediation: 'Implement proper consent mechanisms'
        }
      ],
      applicableModules: ['*'],
      auditFrequency: 365, // days
      lastAudit: new Date().toISOString(),
      nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'compliant'
    };

    // SOC 2 Compliance Framework
    const soc2Framework: ComplianceFramework = {
      id: 'soc2_compliance',
      name: 'SOC 2 Compliance',
      description: 'SOC 2 Type II compliance framework',
      version: '1.0',
      requirements: [
        {
          id: 'security_controls',
          name: 'Security Controls',
          description: 'Adequate security controls implementation',
          category: 'security',
          mandatory: true,
          checkFunction: 'checkSecurityControls',
          remediation: 'Implement required security controls'
        },
        {
          id: 'access_controls',
          name: 'Access Controls',
          description: 'Proper access control implementation',
          category: 'security',
          mandatory: true,
          checkFunction: 'checkAccessControls',
          remediation: 'Implement proper access controls'
        }
      ],
      applicableModules: ['*'],
      auditFrequency: 365, // days
      lastAudit: new Date().toISOString(),
      nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'compliant'
    };

    // Store frameworks
    this.complianceFrameworks.set(gdprFramework.id, gdprFramework);
    this.complianceFrameworks.set(soc2Framework.id, soc2Framework);
  }

  /**
   * Check if policy is applicable to module
   */
  private isPolicyApplicable(policy: SecurityPolicy, moduleCategory: string, modulePermissions: string[]): boolean {
    if (policy.applicableModules.includes('*')) {
      return true;
    }
    
    return policy.applicableModules.includes(moduleCategory) || 
           policy.applicableModules.some(app => modulePermissions.some(perm => perm.includes(app)));
  }

  /**
   * Get applicable compliance frameworks
   */
  private async getApplicableComplianceFrameworks(moduleId: string, moduleData: Record<string, unknown>): Promise<ComplianceFramework[]> {
    const moduleCategory = moduleData.category as string;
    
    return Array.from(this.complianceFrameworks.values()).filter(framework =>
      framework.applicableModules.includes('*') || framework.applicableModules.includes(moduleCategory)
    );
  }

  /**
   * Check security policy compliance
   */
  private async checkSecurityPolicyCompliance(
    moduleId: string, 
    moduleData: Record<string, unknown>, 
    policy: SecurityPolicy
  ): Promise<{ violations: SecurityPolicyViolation[]; warnings: string[]; recommendations: string[] }> {
    const violations: SecurityPolicyViolation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    for (const rule of policy.rules) {
      const ruleResult = await this.evaluatePolicyRule(moduleId, moduleData, rule);
      
      if (ruleResult.violation) {
        violations.push(ruleResult.violation);
      }
      
      if (ruleResult.warning) {
        warnings.push(ruleResult.warning);
      }
      
      if (ruleResult.recommendation) {
        recommendations.push(ruleResult.recommendation);
      }
    }
    
    return { violations, warnings, recommendations };
  }

  /**
   * Check compliance framework compliance
   */
  private async checkComplianceFrameworkCompliance(
    moduleId: string, 
    moduleData: Record<string, unknown>, 
    framework: ComplianceFramework
  ): Promise<{ violations: SecurityPolicyViolation[]; warnings: string[]; recommendations: string[] }> {
    const violations: SecurityPolicyViolation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    for (const requirement of framework.requirements) {
      const requirementResult = await this.evaluateComplianceRequirement(moduleId, moduleData, requirement);
      
      if (!requirementResult.compliant) {
        violations.push({
          type: 'compliance_violation',
          severity: requirement.mandatory ? 'high' : 'medium',
          description: `Non-compliance with ${requirement.name}`,
          timestamp: new Date().toISOString(),
          details: {
            framework: framework.name,
            requirement: requirement.name,
            remediation: requirement.remediation
          }
        });
        
        recommendations.push(requirement.remediation);
      }
    }
    
    return { violations, warnings, recommendations };
  }

  /**
   * Evaluate policy rule
   */
  private async evaluatePolicyRule(
    moduleId: string, 
    moduleData: Record<string, unknown>, 
    rule: SecurityPolicyRule
  ): Promise<{ violation?: SecurityPolicyViolation; warning?: string; recommendation?: string }> {
    // Simple rule evaluation (in a real implementation, this would be more sophisticated)
    const isViolation = this.evaluateRuleCondition(moduleData, rule.condition);
    
    if (isViolation) {
      return {
        violation: {
          type: rule.id,
          severity: rule.severity,
          description: rule.description,
          timestamp: new Date().toISOString(),
          details: {
            rule: rule,
            moduleData: moduleData,
            condition: rule.condition
          }
        },
        recommendation: `Address violation: ${rule.description}`
      };
    }
    
    return {};
  }

  /**
   * Evaluate compliance requirement
   */
  private async evaluateComplianceRequirement(
    moduleId: string, 
    moduleData: Record<string, unknown>, 
    requirement: ComplianceRequirement
  ): Promise<{ compliant: boolean; details: string }> {
    // Simple compliance check (in a real implementation, this would call the checkFunction)
    return {
      compliant: true, // Placeholder - always compliant for now
      details: `Compliance check for ${requirement.name}`
    };
  }

  /**
   * Evaluate rule condition
   */
  private evaluateRuleCondition(moduleData: Record<string, unknown>, condition: string): boolean {
    try {
      // Simple condition evaluation (in a real implementation, this would be more sophisticated)
      switch (condition) {
        case 'dataType.includes("pii")':
          const dataTypes = moduleData.dataTypes as string[] || [];
          return dataTypes.includes('pii');
        case 'encryption === false':
          return moduleData.encryption === false;
        case 'permissions.length > 5':
          const permissions = (moduleData.manifest as Record<string, unknown>)?.permissions as string[] || [];
          return permissions.length > 5;
        case 'permission.includes("system")':
          const perms = (moduleData.manifest as Record<string, unknown>)?.permissions as string[] || [];
          return perms.some(p => p.includes('system'));
        case 'memoryUsage > 100MB':
          return (moduleData.memoryUsage as number) > 100 * 1024 * 1024;
        case 'cpuUsage > 80%':
          return (moduleData.cpuUsage as number) > 80;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating rule condition:', error);
      return false;
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(violations: SecurityPolicyViolation[], warnings: string[]): number {
    let score = 100;
    
    // Deduct points for violations
    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    
    // Deduct points for warnings
    score -= warnings.length * 2;
    
    return Math.max(score, 0);
  }

  /**
   * Start policy update scheduler
   */
  private startPolicyUpdateScheduler(): void {
    setInterval(async () => {
      await this.updatePoliciesFromDatabase();
    }, this.POLICY_UPDATE_INTERVAL);
  }

  /**
   * Update policies from database
   */
  private async updatePoliciesFromDatabase(): Promise<void> {
    try {
      // In a real implementation, this would fetch policies from the database
      console.log('🔄 Updating security policies from database...');
    } catch (error) {
      console.error('❌ Error updating policies from database:', error);
    }
  }
}
