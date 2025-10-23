/**
 * Sandbox testing types for module security validation
 * Following our Type Safety Standards - zero `any` types
 */

export interface SandboxTestEnvironment {
  container: {
    type: 'docker' | 'vm' | 'iframe';
    isolation: 'network' | 'filesystem' | 'process';
    resourceLimits: {
      cpu: number;
      memory: number;
      disk: number;
      network: string[];
    };
  };
  
  monitoring: {
    networkTraffic: boolean;
    fileSystemAccess: boolean;
    apiCalls: boolean;
    performanceMetrics: boolean;
    securityViolations: boolean;
  };
  
  testScenarios: {
    normalOperation: boolean;
    edgeCases: boolean;
    errorHandling: boolean;
    securityBoundaries: boolean;
  };

  moduleUrl: string;
}

export interface SandboxTestScenario {
  id: string;
  name: string;
  description: string;
  testType: 'functional' | 'security' | 'performance' | 'compatibility';
  expectedBehavior: string;
  timeout: number;
  parameters?: Record<string, unknown>;
}

export interface NetworkTrafficLog {
  url: string;
  method: string;
  timestamp: string;
  headers: Record<string, string>;
  blocked: boolean;
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: string;
  };
}

export interface SecurityViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  executionTime: number;
  networkRequests: number;
  diskUsage?: number;
  responseTime?: number;
}

export interface BehaviorAnalysis {
  suspiciousActivities: string[];
  apiCalls: Array<{
    endpoint: string;
    method: string;
    timestamp: string;
    response: number;
  }>;
  fileOperations: Array<{
    operation: 'read' | 'write' | 'delete';
    path: string;
    timestamp: string;
    success: boolean;
  }>;
  networkConnections: Array<{
    host: string;
    port: number;
    protocol: string;
    timestamp: string;
    established: boolean;
  }>;
}

export interface SandboxTestResult {
  testId: string;
  moduleId: string;
  environment: SandboxTestEnvironment;
  scenarios: SandboxTestScenario[];
  results: {
    networkTraffic: NetworkTrafficLog[];
    securityViolations: SecurityViolation[];
    performanceMetrics: PerformanceMetrics;
    behaviorAnalysis: BehaviorAnalysis;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface SandboxConfiguration {
  enabled: boolean;
  timeout: number;
  maxMemory: number;
  maxCpu: number;
  allowedNetworks: string[];
  blockedDomains: string[];
  securityPolicies: SecurityPolicy[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'block' | 'warn';
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  type: 'url' | 'header' | 'content' | 'behavior';
  condition: 'contains' | 'matches' | 'starts_with' | 'ends_with';
  caseSensitive: boolean;
}

export interface SandboxTestReport {
  testId: string;
  moduleId: string;
  moduleName: string;
  testDate: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  securityScore: number;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warnings: number;
    criticalIssues: number;
  };
  details: {
    networkAnalysis: {
      totalRequests: number;
      blockedRequests: number;
      suspiciousRequests: number;
      domains: string[];
    };
    securityAnalysis: {
      violations: SecurityViolation[];
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    };
    performanceAnalysis: {
      metrics: PerformanceMetrics;
      bottlenecks: string[];
      recommendations: string[];
    };
    behaviorAnalysis: {
      suspiciousActivities: string[];
      riskAssessment: 'low' | 'medium' | 'high';
      recommendations: string[];
    };
  };
  recommendations: string[];
  nextSteps: string[];
}

export interface SandboxTestRequest {
  moduleId: string;
  moduleData: Record<string, unknown>;
  testConfiguration: {
    scenarios: string[];
    timeout: number;
    monitoring: {
      network: boolean;
      performance: boolean;
      security: boolean;
      behavior: boolean;
    };
  };
  priority: 'low' | 'medium' | 'high';
}

export interface SandboxTestQueue {
  queueId: string;
  requests: SandboxTestRequest[];
  status: 'idle' | 'processing' | 'paused';
  currentTest: SandboxTestRequest | null;
  processingStarted: string | null;
  estimatedCompletion: string | null;
}
