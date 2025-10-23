/**
 * Runtime behavioral monitoring types for module security
 * Following our Type Safety Standards - zero `any` types
 */

export interface BehavioralMonitoringEvent {
  id: string;
  moduleId: string;
  type: 'network_request' | 'file_access' | 'api_call' | 'performance_metric' | 'suspicious_activity' | 'unauthorized_access' | 'data_exfiltration' | 'performance_anomaly';
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, unknown>;
  metadata: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    source: 'client' | 'server' | 'system';
  };
}

export interface SecurityViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  details: Record<string, unknown>;
  remediation?: string;
  status?: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export interface ThreatDetectionResult {
  threatsDetected: boolean;
  threatTypes: string[];
  confidence: number; // 0-100
  timestamp: string;
  details: {
    eventsAnalyzed: number;
    suspiciousEvents: number;
    unauthorizedEvents: number;
    riskFactors: string[];
  };
}

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  type: 'network' | 'filesystem' | 'performance' | 'api' | 'behavioral';
  condition: string;
  timeWindow: number; // milliseconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'alert' | 'block' | 'log' | 'escalate';
  enabled: boolean;
  parameters?: Record<string, unknown>;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  compliant: boolean;
  details: string;
  timestamp: string;
  violations?: string[];
  recommendations?: string[];
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  factors: string[];
  timestamp: string;
  recommendations: string[];
  mitigationStrategies?: string[];
}

export interface MonitoringConfiguration {
  moduleId: string;
  permissions: string[];
  rules: MonitoringRule[];
  monitoringStarted: string;
  configuration: {
    networkMonitoring: boolean;
    fileSystemMonitoring: boolean;
    performanceMonitoring: boolean;
    apiMonitoring: boolean;
    behavioralMonitoring: boolean;
  };
}

export interface SecurityAlert {
  id: string;
  moduleId: string;
  type: 'security_violation' | 'threat_detection' | 'compliance_violation' | 'risk_assessment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  assignedTo?: string;
  details: Record<string, unknown>;
  actions: SecurityAlertAction[];
}

export interface SecurityAlertAction {
  id: string;
  type: 'disable_module' | 'notify_admin' | 'escalate' | 'log_event' | 'custom';
  description: string;
  timestamp: string;
  executedBy: string;
  result: 'success' | 'failure' | 'pending';
  details?: Record<string, unknown>;
}

export interface BehavioralTrend {
  moduleId: string;
  timeWindow: string;
  metrics: {
    totalEvents: number;
    suspiciousEvents: number;
    securityViolations: number;
    performanceIssues: number;
    riskScore: number;
  };
  trends: {
    eventFrequency: 'increasing' | 'decreasing' | 'stable';
    riskTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
  };
  timestamp: string;
}

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

export interface SecurityIncident {
  id: string;
  moduleId: string;
  type: 'security_breach' | 'data_leak' | 'unauthorized_access' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  title: string;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  timeline: SecurityIncidentEvent[];
  impact: {
    affectedUsers: number;
    dataCompromised: boolean;
    serviceDisruption: boolean;
    financialImpact?: number;
  };
  remediation: {
    immediateActions: string[];
    longTermActions: string[];
    preventionMeasures: string[];
  };
}

export interface SecurityIncidentEvent {
  id: string;
  timestamp: string;
  type: 'detection' | 'investigation' | 'containment' | 'resolution';
  description: string;
  performedBy: string;
  details: Record<string, unknown>;
}

export interface SecurityMetrics {
  moduleId: string;
  timeWindow: string;
  metrics: {
    totalAlerts: number;
    criticalAlerts: number;
    securityViolations: number;
    complianceViolations: number;
    riskScore: number;
    uptime: number;
    performanceScore: number;
  };
  trends: {
    alertTrend: 'increasing' | 'decreasing' | 'stable';
    riskTrend: 'increasing' | 'decreasing' | 'stable';
    complianceTrend: 'improving' | 'degrading' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
  };
  timestamp: string;
}

export interface MonitoringDashboard {
  moduleId: string;
  overview: {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    lastUpdated: string;
    uptime: number;
    riskScore: number;
  };
  recentAlerts: SecurityAlert[];
  performanceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkRequests: number;
    responseTime: number;
  };
  securityMetrics: {
    totalViolations: number;
    criticalViolations: number;
    complianceScore: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  trends: BehavioralTrend;
  compliance: {
    frameworks: ComplianceFramework[];
    overallCompliance: 'compliant' | 'non_compliant' | 'under_review';
    nextAudit: string;
  };
}
