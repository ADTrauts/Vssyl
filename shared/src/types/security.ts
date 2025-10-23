/**
 * Security validation types for module submissions
 * Following our Type Safety Standards - zero `any` types
 */

export interface ModuleSecurityValidation {
  // Static Analysis Results
  staticCodeAnalysis: {
    malwareScan: boolean;
    vulnerabilityCheck: boolean;
    codeQualityScore: number;
    dependencyAudit: string[];
  };
  
  // Dynamic Analysis Results
  sandboxTesting: {
    behaviorAnalysis: boolean;
    networkTrafficMonitoring: boolean;
    performanceMetrics: Record<string, unknown>;
    securityViolations: string[];
  };
  
  // Manual Review Results
  humanReview: {
    codeReview: boolean;
    permissionAudit: boolean;
    policyCompliance: boolean;
    reviewerNotes: string;
  };
  
  // Overall Security Status
  securityStatus: 'pending' | 'passed' | 'failed' | 'warning';
  securityScore: number; // 0-100
  validatedAt: string;
  validatedBy: string;
}

export interface ModuleManifestSecurity {
  // URL Security Validation
  urlValidation: {
    httpsOnly: boolean;
    domainWhitelist: string[];
    certificateValidation: boolean;
    contentSecurityPolicy: boolean;
  };
  
  // Manifest Security
  manifestSecurity: {
    permissionAudit: boolean;
    capabilityRestrictions: boolean;
    dependencyValidation: boolean;
    versionCompatibility: boolean;
  };
  
  // Content Security
  contentSecurity: {
    malwareScan: boolean;
    codeInspection: boolean;
    dependencyAudit: boolean;
    vulnerabilityCheck: boolean;
  };
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number;
  recommendations: string[];
  validationDetails: ModuleSecurityValidation;
}

export interface MalwareScanResult {
  isClean: boolean;
  scanId: string;
  scanDate: string;
  detectedThreats: string[];
  scanProvider: string;
  confidence: number; // 0-100
  details?: {
    urlScan: Partial<MalwareScanResult>;
    contentScan: Partial<MalwareScanResult>;
    scanDuration: number;
  };
}

export interface VulnerabilityCheckResult {
  hasVulnerabilities: boolean;
  vulnerabilities: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    cve?: string;
    affectedDependencies: string[];
  }>;
  scanDate: string;
  summary: {
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
  };
}

export interface ModulePermissionAudit {
  requestedPermissions: string[];
  approvedPermissions: string[];
  rejectedPermissions: string[];
  justification: Record<string, string>;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  appliesTo: string[]; // module categories
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'validation' | 'restriction' | 'requirement';
  condition: string;
  action: 'allow' | 'deny' | 'warn';
  message: string;
}

export interface ModuleSubmissionSecurityContext {
  submissionId: string;
  moduleId: string;
  submitterId: string;
  validationStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  securityChecks: {
    malwareScan: MalwareScanResult | null;
    vulnerabilityCheck: VulnerabilityCheckResult | null;
    permissionAudit: ModulePermissionAudit | null;
    urlValidation: boolean;
    manifestValidation: boolean;
  };
  reviewHistory: Array<{
    reviewerId: string;
    reviewDate: string;
    reviewType: 'automated' | 'manual';
    result: 'passed' | 'failed' | 'warning';
    notes: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityScanReport {
  moduleId: string;
  moduleName: string;
  scanDate: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  securityScore: number;
  malwareScan: MalwareScanResult;
  vulnerabilityCheck: VulnerabilityCheckResult;
  recommendations: string[];
  nextSteps: string[];
}
