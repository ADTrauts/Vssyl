import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  type: 'soc2' | 'iso27001' | 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'pci_dss';
  status: 'not_started' | 'in_progress' | 'audit_in_progress' | 'certified' | 'expired';
  certificationDate?: Date;
  expiryDate?: Date;
  auditor?: string;
  scope: string[];
  controls: ComplianceControl[];
  riskAssessment: RiskAssessment;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  category: 'access_control' | 'data_protection' | 'incident_response' | 'business_continuity' | 'risk_management';
  status: 'implemented' | 'partially_implemented' | 'not_implemented' | 'not_applicable';
  evidence: string[];
  lastTested: Date;
  nextTestDate: Date;
  responsibleParty: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  remediationPlan?: string;
  remediationDeadline?: Date;
}

export interface RiskAssessment {
  id: string;
  assessmentDate: Date;
  nextAssessmentDate: Date;
  assessedBy: string;
  risks: Risk[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  actionItems: ActionItem[];
}

export interface Risk {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'operational' | 'business' | 'compliance' | 'third_party';
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
  impact: 'negligible' | 'minor' | 'moderate' | 'major' | 'catastrophic';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
  residualRisk: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  reviewDate: Date;
}

export interface ActionItem {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  dueDate: Date;
  completedDate?: Date;
  notes?: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  category: 'data_breach' | 'unauthorized_access' | 'malware' | 'phishing' | 'ddos' | 'other';
  affectedSystems: string[];
  affectedUsers: number;
  discoveredAt: Date;
  reportedAt: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  rootCause?: string;
  remediation?: string;
  lessonsLearned?: string;
  assignedTo: string;
  stakeholders: string[];
  complianceImpact: string[];
  reportableToRegulators: boolean;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAudit {
  id: string;
  type: 'internal' | 'external' | 'regulatory' | 'penetration_test';
  title: string;
  description: string;
  scope: string[];
  auditor: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  findings: AuditFinding[];
  recommendations: string[];
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  complianceStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
  nextAuditDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'access_control' | 'data_protection' | 'network_security' | 'application_security' | 'physical_security';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  remediation: string;
  dueDate: Date;
  assignedTo: string;
  evidence?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DataPrivacyReport {
  id: string;
  reportDate: Date;
  period: string;
  dataSubject: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  description: string;
  dataProcessed: string[];
  legalBasis: string;
  retentionPeriod: string;
  thirdPartySharing: boolean;
  thirdParties?: string[];
  automatedDecisionMaking: boolean;
  profiling: boolean;
  response: string;
  responseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityMetrics {
  id: string;
  date: Date;
  metrics: {
    activeIncidents: number;
    resolvedIncidents: number;
    meanTimeToDetect: number; // minutes
    meanTimeToResolve: number; // minutes
    securityScore: number; // 0-100
    complianceScore: number; // 0-100
    riskScore: number; // 0-100
    vulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    accessControl: {
      failedLogins: number;
      suspiciousActivities: number;
      privilegeEscalations: number;
    };
    dataProtection: {
      dataBreaches: number;
      unauthorizedAccess: number;
      dataExfiltration: number;
    };
  };
  trends: {
    incidentTrend: 'increasing' | 'decreasing' | 'stable';
    riskTrend: 'increasing' | 'decreasing' | 'stable';
    complianceTrend: 'improving' | 'declining' | 'stable';
  };
  createdAt: Date;
}

export class EnterpriseSecurityService extends EventEmitter {
  private prisma: PrismaClient;
  private complianceFrameworks: Map<string, ComplianceFramework> = new Map();
  private securityIncidents: Map<string, SecurityIncident> = new Map();
  private securityAudits: Map<string, SecurityAudit> = new Map();
  private dataPrivacyReports: Map<string, DataPrivacyReport> = new Map();
  private securityMetrics: Map<string, SecurityMetrics> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.initializeComplianceFrameworks();
  }

  /**
   * Initialize compliance frameworks
   */
  private async initializeComplianceFrameworks(): Promise<void> {
    try {
      const frameworks: ComplianceFramework[] = [
        {
          id: 'soc2_type2',
          name: 'SOC 2 Type II',
          version: '2017',
          type: 'soc2',
          status: 'in_progress',
          scope: ['AI Learning System', 'User Management', 'Data Processing'],
          controls: this.getSOC2Controls(),
          riskAssessment: this.getDefaultRiskAssessment(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'iso27001_2013',
          name: 'ISO 27001:2013',
          version: '2013',
          type: 'iso27001',
          status: 'not_started',
          scope: ['Information Security Management System'],
          controls: this.getISO27001Controls(),
          riskAssessment: this.getDefaultRiskAssessment(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'gdpr_compliance',
          name: 'GDPR Compliance',
          version: '2018',
          type: 'gdpr',
          status: 'in_progress',
          scope: ['Data Protection', 'Privacy Rights', 'Consent Management'],
          controls: this.getGDPRControls(),
          riskAssessment: this.getDefaultRiskAssessment(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      frameworks.forEach(framework => {
        this.complianceFrameworks.set(framework.id, framework);
      });

      console.log(`✅ Initialized ${frameworks.length} compliance frameworks`);

    } catch (error) {
      console.error('Error initializing compliance frameworks:', error);
    }
  }

  /**
   * Get all compliance frameworks
   */
  async getComplianceFrameworks(): Promise<ComplianceFramework[]> {
    return Array.from(this.complianceFrameworks.values());
  }

  /**
   * Get compliance framework by ID
   */
  async getComplianceFramework(frameworkId: string): Promise<ComplianceFramework | null> {
    return this.complianceFrameworks.get(frameworkId) || null;
  }

  /**
   * Create new compliance framework
   */
  async createComplianceFramework(
    frameworkData: Omit<ComplianceFramework, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ComplianceFramework> {
    try {
      const framework: ComplianceFramework = {
        ...frameworkData,
        id: `framework_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.complianceFrameworks.set(framework.id, framework);
      this.emit('framework_created', framework);

      console.log(`✅ Created compliance framework: ${framework.name}`);
      return framework;

    } catch (error) {
      console.error('Error creating compliance framework:', error);
      throw error;
    }
  }

  /**
   * Update compliance framework
   */
  async updateComplianceFramework(
    frameworkId: string,
    updates: Partial<ComplianceFramework>
  ): Promise<ComplianceFramework> {
    try {
      const framework = this.complianceFrameworks.get(frameworkId);
      if (!framework) {
        throw new Error(`Framework ${frameworkId} not found`);
      }

      const updatedFramework: ComplianceFramework = {
        ...framework,
        ...updates,
        updatedAt: new Date()
      };

      this.complianceFrameworks.set(frameworkId, updatedFramework);
      this.emit('framework_updated', updatedFramework);

      console.log(`✅ Updated compliance framework: ${updatedFramework.name}`);
      return updatedFramework;

    } catch (error) {
      console.error('Error updating compliance framework:', error);
      throw error;
    }
  }

  /**
   * Create security incident
   */
  async createSecurityIncident(
    incidentData: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SecurityIncident> {
    try {
      const incident: SecurityIncident = {
        ...incidentData,
        id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.securityIncidents.set(incident.id, incident);
      this.emit('incident_created', incident);

      // Check if incident needs immediate attention
      if (incident.severity === 'critical' || incident.severity === 'high') {
        await this.escalateIncident(incident);
      }

      // Update security metrics
      await this.updateSecurityMetrics();

      console.log(`🚨 Created security incident: ${incident.title}`);
      return incident;

    } catch (error) {
      console.error('Error creating security incident:', error);
      throw error;
    }
  }

  /**
   * Update security incident
   */
  async updateSecurityIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): Promise<SecurityIncident> {
    try {
      const incident = this.securityIncidents.get(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const updatedIncident: SecurityIncident = {
        ...incident,
        ...updates,
        updatedAt: new Date()
      };

      this.securityIncidents.set(incidentId, updatedIncident);
      this.emit('incident_updated', updatedIncident);

      // Check if incident was resolved
      if (updatedIncident.status === 'resolved' && incident.status !== 'resolved') {
        await this.handleIncidentResolution(updatedIncident);
      }

      console.log(`✅ Updated security incident: ${updatedIncident.title}`);
      return updatedIncident;

    } catch (error) {
      console.error('Error updating security incident:', error);
      throw error;
    }
  }

  /**
   * Get security incidents
   */
  async getSecurityIncidents(filters: {
    status?: string;
    severity?: string;
    category?: string;
    limit?: number;
  } = {}): Promise<SecurityIncident[]> {
    try {
      let incidents = Array.from(this.securityIncidents.values());

      // Apply filters
      if (filters.status) {
        incidents = incidents.filter(i => i.status === filters.status);
      }
      if (filters.severity) {
        incidents = incidents.filter(i => i.severity === filters.severity);
      }
      if (filters.category) {
        incidents = incidents.filter(i => i.category === filters.category);
      }

      // Sort by severity and creation date
      incidents.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // Apply limit
      if (filters.limit) {
        incidents = incidents.slice(0, filters.limit);
      }

      return incidents;

    } catch (error) {
      console.error('Error getting security incidents:', error);
      return [];
    }
  }

  /**
   * Create security audit
   */
  async createSecurityAudit(
    auditData: Omit<SecurityAudit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SecurityAudit> {
    try {
      const audit: SecurityAudit = {
        ...auditData,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.securityAudits.set(audit.id, audit);
      this.emit('audit_created', audit);

      console.log(`🔍 Created security audit: ${audit.title}`);
      return audit;

    } catch (error) {
      console.error('Error creating security audit:', error);
      throw error;
    }
  }

  /**
   * Create data privacy report
   */
  async createDataPrivacyReport(
    reportData: Omit<DataPrivacyReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataPrivacyReport> {
    try {
      const report: DataPrivacyReport = {
        ...reportData,
        id: `privacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.dataPrivacyReports.set(report.id, report);
      this.emit('privacy_report_created', report);

      // Check if this is a data subject request that needs immediate attention
      if (report.requestType === 'erasure' || report.requestType === 'access') {
        await this.handleDataSubjectRequest(report);
      }

      console.log(`📋 Created data privacy report: ${report.requestType} request`);
      return report;

    } catch (error) {
      console.error('Error creating data privacy report:', error);
      throw error;
    }
  }

  /**
   * Get compliance status overview
   */
  async getComplianceStatus(): Promise<{
    frameworks: ComplianceFramework[];
    overallStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
    criticalIssues: number;
    upcomingAudits: SecurityAudit[];
    recentIncidents: SecurityIncident[];
  }> {
    try {
      const frameworks = Array.from(this.complianceFrameworks.values());
      const incidents = Array.from(this.securityIncidents.values());
      const audits = Array.from(this.securityAudits.values());

      // Calculate overall compliance status
      const implementedControls = frameworks.reduce((total, framework) => {
        return total + framework.controls.filter(c => c.status === 'implemented').length;
      }, 0);

      const totalControls = frameworks.reduce((total, framework) => {
        return total + framework.controls.length;
      }, 0);

      let overallStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
      if (implementedControls === totalControls) {
        overallStatus = 'compliant';
      } else if (implementedControls === 0) {
        overallStatus = 'non_compliant';
      } else {
        overallStatus = 'partially_compliant';
      }

      // Get critical issues
      const criticalIssues = incidents.filter(i => 
        i.severity === 'critical' && i.status !== 'resolved'
      ).length;

      // Get upcoming audits
      const upcomingAudits = audits
        .filter(a => a.status === 'planned' && a.startDate > new Date())
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .slice(0, 5);

      // Get recent incidents
      const recentIncidents = incidents
        .filter(i => i.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      return {
        frameworks,
        overallStatus,
        criticalIssues,
        upcomingAudits,
        recentIncidents
      };

    } catch (error) {
      console.error('Error getting compliance status:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(frameworkId: string): Promise<{
    framework: ComplianceFramework;
    summary: {
      totalControls: number;
      implementedControls: number;
      compliancePercentage: number;
      riskLevel: string;
      nextReviewDate: Date;
    };
    controls: ComplianceControl[];
    recommendations: string[];
    actionItems: ActionItem[];
  }> {
    try {
      const framework = this.complianceFrameworks.get(frameworkId);
      if (!framework) {
        throw new Error(`Framework ${frameworkId} not found`);
      }

      const totalControls = framework.controls.length;
      const implementedControls = framework.controls.filter(c => c.status === 'implemented').length;
      const compliancePercentage = Math.round((implementedControls / totalControls) * 100);

      // Generate recommendations based on control status
      const recommendations: string[] = [];
      const actionItems: ActionItem[] = [];

      framework.controls.forEach(control => {
        if (control.status === 'not_implemented' || control.status === 'partially_implemented') {
          recommendations.push(`Implement control: ${control.name}`);
          
          actionItems.push({
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: `Implement ${control.name} control`,
            priority: control.riskLevel === 'critical' ? 'critical' : 'high',
            status: 'open',
            assignedTo: control.responsibleParty,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            notes: control.remediationPlan
          });
        }
      });

      return {
        framework,
        summary: {
          totalControls,
          implementedControls,
          compliancePercentage,
          riskLevel: framework.riskAssessment.overallRiskLevel,
          nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
        },
        controls: framework.controls,
        recommendations,
        actionItems
      };

    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(dateRange: { start: Date; end: Date }): Promise<SecurityMetrics[]> {
    try {
      const metrics = Array.from(this.securityMetrics.values())
        .filter(m => m.date >= dateRange.start && m.date <= dateRange.end)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return metrics;

    } catch (error) {
      console.error('Error getting security metrics:', error);
      return [];
    }
  }

  /**
   * Update security metrics
   */
  private async updateSecurityMetrics(): Promise<void> {
    try {
      const incidents = Array.from(this.securityIncidents.values());
      const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed');
      const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

      // Calculate metrics
      const metrics: SecurityMetrics = {
        id: `metrics_${Date.now()}`,
        date: new Date(),
        metrics: {
          activeIncidents: activeIncidents.length,
          resolvedIncidents: resolvedIncidents.length,
          meanTimeToDetect: this.calculateMeanTimeToDetect(incidents),
          meanTimeToResolve: this.calculateMeanTimeToResolve(resolvedIncidents),
          securityScore: this.calculateSecurityScore(),
          complianceScore: this.calculateComplianceScore(),
          riskScore: this.calculateRiskScore(),
          vulnerabilities: {
            critical: 0, // Would be populated from vulnerability scanner
            high: 0,
            medium: 0,
            low: 0
          },
          accessControl: {
            failedLogins: 0, // Would be populated from auth logs
            suspiciousActivities: 0,
            privilegeEscalations: 0
          },
          dataProtection: {
            dataBreaches: activeIncidents.filter(i => i.category === 'data_breach').length,
            unauthorizedAccess: activeIncidents.filter(i => i.category === 'unauthorized_access').length,
            dataExfiltration: 0
          }
        },
        trends: {
          incidentTrend: this.calculateIncidentTrend(),
          riskTrend: this.calculateRiskTrend(),
          complianceTrend: this.calculateComplianceTrend()
        },
        createdAt: new Date()
      };

      this.securityMetrics.set(metrics.id, metrics);
      this.emit('metrics_updated', metrics);

    } catch (error) {
      console.error('Error updating security metrics:', error);
    }
  }

  // Private helper methods
  private getSOC2Controls(): ComplianceControl[] {
    return [
      {
        id: 'cc1.1',
        name: 'Control Environment',
        description: 'The entity demonstrates a commitment to integrity and ethical values',
        category: 'access_control',
        status: 'implemented',
        evidence: ['Code of conduct', 'Ethics training', 'Tone at the top'],
        lastTested: new Date(),
        nextTestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        responsibleParty: 'Management',
        riskLevel: 'low'
      },
      {
        id: 'cc2.1',
        name: 'Communication and Information',
        description: 'The entity communicates information to support the functioning of internal control',
        category: 'data_protection',
        status: 'implemented',
        evidence: ['Security policies', 'Training materials', 'Communication channels'],
        lastTested: new Date(),
        nextTestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        responsibleParty: 'IT Security',
        riskLevel: 'low'
      }
    ];
  }

  private getISO27001Controls(): ComplianceControl[] {
    return [
      {
        id: 'a.6.1.1',
        name: 'Information Security Policies',
        description: 'A set of policies for information security should be defined',
        category: 'data_protection',
        status: 'implemented',
        evidence: ['Security policy document', 'Policy review process'],
        lastTested: new Date(),
        nextTestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        responsibleParty: 'IT Security',
        riskLevel: 'low'
      }
    ];
  }

  private getGDPRControls(): ComplianceControl[] {
    return [
      {
        id: 'gdpr_1',
        name: 'Lawful Basis for Processing',
        description: 'Personal data is processed on a lawful basis',
        category: 'data_protection',
        status: 'implemented',
        evidence: ['Consent management', 'Contract processing', 'Legitimate interest assessment'],
        lastTested: new Date(),
        nextTestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        responsibleParty: 'Legal',
        riskLevel: 'medium'
      }
    ];
  }

  private getDefaultRiskAssessment(): RiskAssessment {
    return {
      id: `risk_${Date.now()}`,
      assessmentDate: new Date(),
      nextAssessmentDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      assessedBy: 'Security Team',
      risks: [],
      overallRiskLevel: 'medium',
      recommendations: [],
      actionItems: []
    };
  }

  private async escalateIncident(incident: SecurityIncident): Promise<void> {
    // In a real implementation, this would send notifications to stakeholders
    console.log(`🚨 Escalating critical incident: ${incident.title}`);
    this.emit('incident_escalated', incident);
  }

  private async handleIncidentResolution(incident: SecurityIncident): Promise<void> {
    // In a real implementation, this would trigger post-incident review
    console.log(`✅ Incident resolved: ${incident.title}`);
    this.emit('incident_resolved', incident);
  }

  private async handleDataSubjectRequest(report: DataPrivacyReport): Promise<void> {
    // In a real implementation, this would trigger data subject request workflow
    console.log(`📋 Processing data subject request: ${report.requestType}`);
    this.emit('data_subject_request_received', report);
  }

  private calculateMeanTimeToDetect(incidents: SecurityIncident[]): number {
    // Mock calculation - in real implementation, this would use actual timestamps
    return 120; // 2 hours
  }

  private calculateMeanTimeToResolve(resolvedIncidents: SecurityIncident[]): number {
    // Mock calculation - in real implementation, this would use actual timestamps
    return 1440; // 24 hours
  }

  private calculateSecurityScore(): number {
    // Mock calculation - in real implementation, this would use actual metrics
    return 85;
  }

  private calculateComplianceScore(): number {
    // Mock calculation - in real implementation, this would use actual metrics
    return 78;
  }

  private calculateRiskScore(): number {
    // Mock calculation - in real implementation, this would use actual metrics
    return 65;
  }

  private calculateIncidentTrend(): 'increasing' | 'decreasing' | 'stable' {
    // Mock calculation - in real implementation, this would use actual metrics
    return 'stable';
  }

  private calculateRiskTrend(): 'increasing' | 'decreasing' | 'stable' {
    // Mock calculation - in real implementation, this would use actual metrics
    return 'decreasing';
  }

  private calculateComplianceTrend(): 'improving' | 'declining' | 'stable' {
    // Mock calculation - in real implementation, this would use actual metrics
    return 'improving';
  }
}
