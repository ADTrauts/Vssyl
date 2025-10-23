/**
 * Security policies and compliance types for module security
 * Following our Type Safety Standards - zero `any` types
 */

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'access_control' | 'data_protection' | 'performance' | 'compliance' | 'behavioral';
  rules: SecurityPolicyRule[];
  enforcement: 'strict' | 'moderate' | 'advisory';
  applicableModules: string[]; // module categories or specific modules
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface SecurityPolicyRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'log';
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameters: Record<string, unknown>;
}

export interface SecurityPolicyViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  details: Record<string, unknown>;
  remediation?: string;
  status?: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export interface PolicyEnforcementResult {
  moduleId: string;
  compliant: boolean;
  violations: SecurityPolicyViolation[];
  warnings: string[];
  recommendations: string[];
  policyApplied: string | null;
  frameworksApplied: string[];
  checkedAt: string;
  score: number; // 0-100
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  requirements: ComplianceRequirement[];
  applicableModules: string[];
  auditFrequency: number; // days
  lastAudit: string;
  nextAudit: string;
  status: 'compliant' | 'non_compliant' | 'under_review';
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: 'data_privacy' | 'security' | 'performance' | 'accessibility';
  mandatory: boolean;
  checkFunction: string; // function to check compliance
  remediation: string;
}

export interface ComplianceAudit {
  id: string;
  frameworkId: string;
  moduleId: string;
  auditDate: string;
  auditor: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  results: {
    compliant: boolean;
    score: number;
    violations: ComplianceViolation[];
    recommendations: string[];
  };
  nextAudit: string;
}

export interface ComplianceViolation {
  id: string;
  requirementId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved';
  dueDate: string;
}

export interface SecurityPolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: SecurityPolicy;
  applicableTo: string[]; // module categories
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export interface PolicyException {
  id: string;
  moduleId: string;
  policyId: string;
  ruleId: string;
  reason: string;
  requestedBy: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface PolicyAuditLog {
  id: string;
  policyId: string;
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable';
  performedBy: string;
  timestamp: string;
  changes: Record<string, unknown>;
  reason: string;
}

export interface SecurityPolicyMetrics {
  policyId: string;
  timeWindow: string;
  metrics: {
    totalViolations: number;
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
    complianceRate: number;
    averageScore: number;
  };
  trends: {
    violationTrend: 'increasing' | 'decreasing' | 'stable';
    complianceTrend: 'improving' | 'degrading' | 'stable';
    enforcementTrend: 'more_strict' | 'less_strict' | 'stable';
  };
  timestamp: string;
}

export interface PolicyComplianceReport {
  moduleId: string;
  reportDate: string;
  overallCompliance: 'compliant' | 'non_compliant' | 'partial';
  overallScore: number;
  policies: Array<{
    policyId: string;
    policyName: string;
    compliant: boolean;
    score: number;
    violations: SecurityPolicyViolation[];
    recommendations: string[];
  }>;
  frameworks: Array<{
    frameworkId: string;
    frameworkName: string;
    compliant: boolean;
    score: number;
    violations: ComplianceViolation[];
    recommendations: string[];
  }>;
  summary: {
    totalPolicies: number;
    compliantPolicies: number;
    totalFrameworks: number;
    compliantFrameworks: number;
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
  };
  recommendations: string[];
  nextAudit: string;
}

export interface PolicyEnforcementAction {
  id: string;
  moduleId: string;
  policyId: string;
  ruleId: string;
  action: 'allow' | 'deny' | 'warn' | 'log' | 'escalate';
  reason: string;
  timestamp: string;
  performedBy: string;
  details: Record<string, unknown>;
}

export interface SecurityPolicyConfiguration {
  defaultPolicies: string[];
  enforcementMode: 'strict' | 'moderate' | 'advisory';
  autoRemediation: boolean;
  notificationSettings: {
    emailAlerts: boolean;
    slackAlerts: boolean;
    webhookAlerts: boolean;
  };
  auditSettings: {
    auditFrequency: number; // days
    retentionPeriod: number; // days
    autoAudit: boolean;
  };
}
