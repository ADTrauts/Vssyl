import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export interface SecurityAudit {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceCheck {
  id: string;
  timestamp: Date;
  checkType: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'custom';
  status: 'pass' | 'fail' | 'warning';
  details: string;
  recommendations: string[];
  nextCheckDate: Date;
}

export interface DataPrivacyReport {
  id: string;
  timestamp: Date;
  dataTypes: string[];
  userConsentLevel: number; // percentage
  anonymizationLevel: string;
  dataRetentionCompliance: boolean;
  crossBorderTransfer: boolean;
  encryptionStatus: string;
  auditTrailCompleteness: number; // percentage
  recommendations: string[];
}

export class SecurityComplianceService {
  private prisma: PrismaClient;
  private auditLog: SecurityAudit[] = [];
  private complianceChecks: ComplianceCheck[] = [];
  private securityConfig = {
    maxLoginAttempts: 5,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    passwordMinLength: 12,
    requireMFA: true,
    encryptionAlgorithm: 'aes-256-gcm',
    dataRetentionDays: 90,
    auditLogRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Authenticate user with enhanced security
   */
  async authenticateUser(email: string, password: string, ipAddress: string, userAgent: string): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    error?: string;
    requiresMFA?: boolean;
  }> {
    try {
      // Check for brute force attempts
      const recentAttempts = await this.getRecentLoginAttempts(email, ipAddress);
      if (recentAttempts.failed >= this.securityConfig.maxLoginAttempts) {
        await this.logSecurityEvent('authentication', 'brute_force_detected', {
          email,
          ipAddress,
          failedAttempts: recentAttempts.failed,
          blocked: true
        });
        
        return {
          success: false,
          error: 'Account temporarily locked due to multiple failed attempts'
        };
      }

      // Verify user credentials
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, password: true, role: true }
      });

      if (!user) {
        await this.logFailedLogin(email, ipAddress, userAgent, 'user_not_found');
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password (in production, use proper hashing)
      if (user.password !== password) { // This should be bcrypt.compare in production
        await this.logFailedLogin(email, ipAddress, userAgent, 'invalid_password');
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if MFA is required
      const requiresMFA = this.securityConfig.requireMFA && user.role === 'ADMIN';
      
      if (requiresMFA) {
        return {
          success: true,
          userId: user.id,
          requiresMFA: true
        };
      }

      // Generate secure token
      const token = this.generateSecureToken(user.id);
      
      // Log successful authentication
      await this.logSecurityEvent('authentication', 'login_success', {
        userId: user.id,
        email,
        ipAddress,
        userAgent
      });

      return {
        success: true,
        userId: user.id,
        token
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication service unavailable' };
    }
  }

  /**
   * Verify user permissions for specific actions
   */
  async verifyPermission(userId: string, action: string, resource: string): Promise<{
    allowed: boolean;
    reason?: string;
    auditRequired: boolean;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true }
      });

      if (!user) {
        return { allowed: false, reason: 'User not found', auditRequired: true };
      }

      // Role-based access control
      const permissions = this.getRolePermissions(user.role);
      
      if (!permissions.includes(action)) {
        await this.logSecurityEvent('authorization', 'permission_denied', {
          userId,
          action,
          resource,
          userRole: user.role
        });
        
        return { allowed: false, reason: 'Insufficient permissions', auditRequired: true };
      }

      // Check for sensitive operations that require additional verification
      const auditRequired = this.isSensitiveOperation(action, resource);
      
      if (auditRequired) {
        await this.logSecurityEvent('authorization', 'sensitive_operation', {
          userId,
          action,
          resource,
          userRole: user.role
        });
      }

      return { allowed: true, auditRequired };

    } catch (error) {
      console.error('Permission verification error:', error);
      return { allowed: false, reason: 'Permission service unavailable', auditRequired: true };
    }
  }

  /**
   * Perform GDPR compliance check
   */
  async performGDPRComplianceCheck(): Promise<ComplianceCheck> {
    try {
      const checks = await Promise.all([
        this.checkDataMinimization(),
        this.checkUserConsent(),
        this.checkDataRetention(),
        this.checkRightToErasure(),
        this.checkDataPortability()
      ]);

      const failedChecks = checks.filter(check => check.status === 'fail');
      const warningChecks = checks.filter(check => check.status === 'warning');
      
      const overallStatus = failedChecks.length > 0 ? 'fail' : 
                           warningChecks.length > 0 ? 'warning' : 'pass';

      const recommendations = [
        ...failedChecks.flatMap(check => check.recommendations),
        ...warningChecks.flatMap(check => check.recommendations)
      ];

      const complianceCheck: ComplianceCheck = {
        id: `gdpr_check_${Date.now()}`,
        timestamp: new Date(),
        checkType: 'gdpr',
        status: overallStatus,
        details: `GDPR compliance check completed. ${failedChecks.length} failures, ${warningChecks.length} warnings.`,
        recommendations,
        nextCheckDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      this.complianceChecks.push(complianceCheck);
      return complianceCheck;

    } catch (error) {
      console.error('GDPR compliance check error:', error);
      return {
        id: `gdpr_check_error_${Date.now()}`,
        timestamp: new Date(),
        checkType: 'gdpr',
        status: 'fail',
        details: 'GDPR compliance check failed due to system error',
        recommendations: ['Investigate system error and retry compliance check'],
        nextCheckDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };
    }
  }

  /**
   * Generate data privacy report
   */
  async generateDataPrivacyReport(): Promise<DataPrivacyReport> {
    try {
      // Calculate user consent levels
      const totalUsers = await this.prisma.user.count();
      const consentingUsers = await this.prisma.userPrivacySettings.count({
        where: { allowCollectiveLearning: true }
      });
      const userConsentLevel = totalUsers > 0 ? (consentingUsers / totalUsers) * 100 : 0;

      // Check data retention compliance
      const dataRetentionCompliance = await this.checkDataRetentionCompliance();

      // Check encryption status
      const encryptionStatus = await this.checkEncryptionStatus();

      // Calculate audit trail completeness
      const auditTrailCompleteness = await this.calculateAuditTrailCompleteness();

      const recommendations = this.generatePrivacyRecommendations({
        userConsentLevel,
        dataRetentionCompliance,
        encryptionStatus,
        auditTrailCompleteness
      });

      const report: DataPrivacyReport = {
        id: `privacy_report_${Date.now()}`,
        timestamp: new Date(),
        dataTypes: ['user_behavior', 'learning_patterns', 'system_metrics', 'audit_logs'],
        userConsentLevel,
        anonymizationLevel: 'standard',
        dataRetentionCompliance,
        crossBorderTransfer: false,
        encryptionStatus,
        auditTrailCompleteness,
        recommendations
      };

      return report;

    } catch (error) {
      console.error('Data privacy report generation error:', error);
      throw new Error('Failed to generate data privacy report');
    }
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-key', 'utf8').slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return { encrypted, iv: iv.toString('hex') };
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string, iv: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-key', 'utf8').slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get security audit log
   */
  getSecurityAuditLog(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
    riskLevel?: string;
  } = {}): SecurityAudit[] {
    let filtered = this.auditLog;

    if (filters.startDate) {
      filtered = filtered.filter(audit => audit.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(audit => audit.timestamp <= filters.endDate!);
    }
    if (filters.userId) {
      filtered = filtered.filter(audit => audit.userId === filters.userId);
    }
    if (filters.action) {
      filtered = filtered.filter(audit => audit.action === filters.action);
    }
    if (filters.riskLevel) {
      filtered = filtered.filter(audit => audit.riskLevel === filters.riskLevel);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get compliance check history
   */
  getComplianceCheckHistory(): ComplianceCheck[] {
    return this.complianceChecks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Private helper methods
  private async getRecentLoginAttempts(email: string, ipAddress: string): Promise<{ failed: number; success: number }> {
    const recentTime = Date.now() - 15 * 60 * 1000; // Last 15 minutes
    
    const attempts = this.auditLog.filter(audit => 
      audit.action === 'login_attempt' &&
      audit.timestamp.getTime() > recentTime &&
      (audit.details?.email === email || audit.details?.ipAddress === ipAddress)
    );

    return {
      failed: attempts.filter(a => !a.success).length,
      success: attempts.filter(a => a.success).length
    };
  }

  private async logFailedLogin(email: string, ipAddress: string, userAgent: string, reason: string): Promise<void> {
    await this.logSecurityEvent('authentication', 'login_attempt', {
      email,
      ipAddress,
      userAgent,
      reason,
      success: false
    });
  }

  private async logSecurityEvent(action: string, eventType: string, details: any): Promise<void> {
    const audit: SecurityAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: details.userId || 'unknown',
      action: `${action}_${eventType}`,
      resource: details.resource || 'system',
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || 'unknown',
      success: details.success !== false,
      details,
      riskLevel: this.calculateRiskLevel(action, eventType, details)
    };

    this.auditLog.push(audit);
    
    // Keep only recent audit logs to prevent memory issues
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }

  private generateSecureToken(userId: string): string {
    const payload = {
      userId,
      timestamp: Date.now(),
      random: crypto.randomBytes(32).toString('hex')
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  private getRolePermissions(role: string): string[] {
    const permissions = {
      USER: ['read_own_data', 'update_own_profile'],
      ADMIN: ['read_all_data', 'update_all_data', 'delete_data', 'system_management', 'user_management'],
      MODERATOR: ['read_limited_data', 'update_limited_data', 'user_support']
    };
    
    return permissions[role as keyof typeof permissions] || [];
  }

  private isSensitiveOperation(action: string, resource: string): boolean {
    const sensitiveActions = ['delete', 'export', 'admin', 'system'];
    const sensitiveResources = ['user_data', 'system_config', 'audit_logs', 'encryption_keys'];
    
    return sensitiveActions.some(sa => action.includes(sa)) ||
           sensitiveResources.some(sr => resource.includes(sr));
  }

  private calculateRiskLevel(action: string, eventType: string, details: any): 'low' | 'medium' | 'high' | 'critical' {
    if (action.includes('authentication') && eventType.includes('brute_force')) return 'critical';
    if (action.includes('authorization') && eventType.includes('permission_denied')) return 'high';
    if (action.includes('sensitive_operation')) return 'high';
    if (details?.success === false) return 'medium';
    return 'low';
  }

  private async checkDataMinimization(): Promise<{ status: 'pass' | 'fail' | 'warning'; recommendations: string[] }> {
    // Check if we're collecting only necessary data
    const dataFields = await this.analyzeDataCollection();
    const unnecessaryFields = dataFields.filter(field => !this.isNecessaryField(field));
    
    if (unnecessaryFields.length === 0) {
      return { status: 'pass', recommendations: ['Data minimization compliance verified'] };
    } else if (unnecessaryFields.length <= 2) {
      return { 
        status: 'warning', 
        recommendations: [`Review ${unnecessaryFields.length} potentially unnecessary data fields`] 
      };
    } else {
      return { 
        status: 'fail', 
        recommendations: ['Remove unnecessary data fields to comply with data minimization principle'] 
      };
    }
  }

  private async checkUserConsent(): Promise<{ status: 'pass' | 'fail' | 'warning'; recommendations: string[] }> {
    const totalUsers = await this.prisma.user.count();
    const consentingUsers = await this.prisma.userPrivacySettings.count({
      where: { allowCollectiveLearning: true }
    });
    
    const consentRate = (consentingUsers / totalUsers) * 100;
    
    if (consentRate >= 80) {
      return { status: 'pass', recommendations: ['User consent rate is satisfactory'] };
    } else if (consentRate >= 60) {
      return { status: 'warning', recommendations: ['Improve user consent collection process'] };
    } else {
      return { status: 'fail', recommendations: ['User consent rate is too low for compliance'] };
    }
  }

  private async checkDataRetention(): Promise<{ status: 'pass' | 'fail' | 'warning'; recommendations: string[] }> {
    const retentionCompliance = await this.checkDataRetentionCompliance();
    
    if (retentionCompliance) {
      return { status: 'pass', recommendations: ['Data retention policies are compliant'] };
    } else {
      return { status: 'fail', recommendations: ['Implement proper data retention policies'] };
    }
  }

  private async checkRightToErasure(): Promise<{ status: 'pass' | 'fail' | 'warning'; recommendations: string[] }> {
    // Check if deletion requests are properly handled
    const deletionRequests = await this.prisma.dataDeletionRequest.count({
      where: { status: 'PENDING' }
    });
    
    if (deletionRequests === 0) {
      return { status: 'pass', recommendations: ['No pending deletion requests'] };
    } else if (deletionRequests <= 5) {
      return { status: 'warning', recommendations: [`Process ${deletionRequests} pending deletion requests`] };
    } else {
      return { status: 'fail', recommendations: ['Too many pending deletion requests - improve processing'] };
    }
  }

  private async checkDataPortability(): Promise<{ status: 'pass' | 'fail' | 'warning'; recommendations: string[] }> {
    // Check if data export functionality exists
    const hasExportFunctionality = true; // This would check actual implementation
    
    if (hasExportFunctionality) {
      return { status: 'pass', recommendations: ['Data portability functionality available'] };
    } else {
      return { status: 'fail', recommendations: ['Implement data export functionality for portability'] };
    }
  }

  private async analyzeDataCollection(): Promise<string[]> {
    // Mock analysis - in real implementation, this would analyze actual data collection
    return ['user_id', 'email', 'preferences', 'usage_patterns', 'system_metrics'];
  }

  private isNecessaryField(field: string): boolean {
    const necessaryFields = ['user_id', 'preferences', 'usage_patterns'];
    return necessaryFields.includes(field);
  }

  private async checkDataRetentionCompliance(): Promise<boolean> {
    // Check if data retention policies are properly implemented
    const oldData = await this.prisma.globalLearningEvent.count({
      where: {
        createdAt: {
          lt: new Date(Date.now() - this.securityConfig.dataRetentionDays * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    return oldData === 0; // No data older than retention period
  }

  private async checkEncryptionStatus(): Promise<string> {
    // Check encryption implementation
    const hasEncryption = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY !== 'default-key';
    
    if (hasEncryption) {
      return 'encrypted';
    } else {
      return 'not_encrypted';
    }
  }

  private async calculateAuditTrailCompleteness(): Promise<number> {
    // Calculate percentage of actions that are properly audited
    const totalActions = this.auditLog.length;
    const completeAudits = this.auditLog.filter(audit => 
      audit.userId && audit.action && audit.timestamp && audit.ipAddress
    ).length;
    
    return totalActions > 0 ? (completeAudits / totalActions) * 100 : 100;
  }

  private generatePrivacyRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.userConsentLevel < 80) {
      recommendations.push('Improve user consent collection and communication');
    }
    
    if (!data.dataRetentionCompliance) {
      recommendations.push('Implement automated data retention policies');
    }
    
    if (data.encryptionStatus === 'not_encrypted') {
      recommendations.push('Implement data encryption for sensitive information');
    }
    
    if (data.auditTrailCompleteness < 95) {
      recommendations.push('Improve audit trail completeness and consistency');
    }
    
    return recommendations;
  }
}
