import express, { Router } from 'express';
import { ModuleSecurityService } from '../services/moduleSecurityService';
import { BehavioralMonitoringService } from '../services/behavioralMonitoringService';
import { SecurityPoliciesService } from '../services/securityPoliciesService';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router: express.Router = express.Router();

// Initialize services
const securityService = new ModuleSecurityService(prisma);
const monitoringService = new BehavioralMonitoringService(prisma);
const policiesService = new SecurityPoliciesService(prisma);

// Get security metrics
router.get('/metrics', async (req, res) => {
  try {
    console.log('📊 Loading security metrics...');
    
    // Get basic metrics from database
    const totalModules = await prisma.module.count();
    const approvedModules = await prisma.module.count({
      where: { status: 'APPROVED' }
    });
    
    // Mock metrics for now - in production, these would come from real monitoring data
    const metrics = {
      totalModules,
      monitoredModules: approvedModules,
      securityViolations: Math.floor(Math.random() * 10),
      criticalAlerts: Math.floor(Math.random() * 3),
      complianceScore: Math.floor(Math.random() * 20) + 80, // 80-100%
      threatLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low'
    };

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error loading security metrics:', error);
    await logger.error('Security metrics loading failed', {
      operation: 'security_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to load security metrics' });
  }
});

// Get security alerts
router.get('/alerts', async (req, res) => {
  try {
    console.log('🚨 Loading security alerts...');
    
    // Mock alerts for now - in production, these would come from real monitoring data
    const alerts = [
      {
        id: 'alert_1',
        moduleId: 'drive',
        type: 'performance_anomaly',
        severity: 'medium',
        title: 'High CPU Usage Detected',
        description: 'Module is consuming more CPU than expected',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        status: 'new'
      },
      {
        id: 'alert_2',
        moduleId: 'chat',
        type: 'security_violation',
        severity: 'low',
        title: 'Suspicious Network Request',
        description: 'Module made request to external domain',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        status: 'acknowledged'
      }
    ];

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error loading security alerts:', error);
    await logger.error('Security alerts loading failed', {
      operation: 'security_alerts',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to load security alerts' });
  }
});

// Get monitoring status
router.get('/monitoring', async (req, res) => {
  try {
    console.log('🔍 Loading monitoring status...');
    
    // Get approved modules
    const modules = await prisma.module.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true
      }
    });

    // Mock monitoring status for each module
    const monitoringStatus = modules.map(module => ({
      moduleId: module.id,
      moduleName: module.name,
      status: Math.random() > 0.5 ? 'monitoring' : 'stopped',
      lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time in last hour
      riskLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low',
      violations: Math.floor(Math.random() * 5),
      uptime: `${Math.floor(Math.random() * 100)}%`
    }));

    res.json({ success: true, data: monitoringStatus });
  } catch (error) {
    console.error('Error loading monitoring status:', error);
    await logger.error('Monitoring status loading failed', {
      operation: 'monitoring_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to load monitoring status' });
  }
});

// Start monitoring for a module
router.post('/monitoring/:moduleId/start', async (req, res) => {
  try {
    const { moduleId } = req.params;
    console.log(`🔍 Starting monitoring for module: ${moduleId}`);
    
    // Get module data
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    // Start monitoring
    await monitoringService.startMonitoringModule(moduleId, {
      id: module.id,
      name: module.name,
      category: module.category,
      manifest: module.manifest
    });

    res.json({ 
      success: true, 
      message: `Monitoring started for module: ${module.name}` 
    });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    await logger.error('Monitoring start failed', {
      operation: 'monitoring_start',
      moduleId: req.params.moduleId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to start monitoring' });
  }
});

// Stop monitoring for a module
router.post('/monitoring/:moduleId/stop', async (req, res) => {
  try {
    const { moduleId } = req.params;
    console.log(`🛑 Stopping monitoring for module: ${moduleId}`);
    
    // Stop monitoring
    await monitoringService.stopMonitoringModule(moduleId);

    res.json({ 
      success: true, 
      message: `Monitoring stopped for module: ${moduleId}` 
    });
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    await logger.error('Monitoring stop failed', {
      operation: 'monitoring_stop',
      moduleId: req.params.moduleId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to stop monitoring' });
  }
});

// Run security test for a module
router.post('/test/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    console.log(`🔒 Running security test for module: ${moduleId}`);
    
    // Get module data
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    // Run comprehensive security test
    const testResult = await securityService.performEnterpriseSecurityTest({
      id: module.id,
      name: module.name,
      category: module.category,
      manifest: module.manifest,
      developer: module.developer
    });

    res.json({ 
      success: true, 
      message: `Security test completed for module: ${module.name}`,
      data: testResult
    });
  } catch (error) {
    console.error('Error running security test:', error);
    await logger.error('Security test failed', {
      operation: 'security_test',
      moduleId: req.params.moduleId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to run security test' });
  }
});

// Get security policies
router.get('/policies', async (req, res) => {
  try {
    console.log('📋 Loading security policies...');
    
    // Mock policies for now - in production, these would come from the policies service
    const policies = [
      {
        id: 'data_protection_policy',
        name: 'Data Protection Policy',
        description: 'Ensures modules comply with data protection requirements',
        category: 'data_protection',
        enforcement: 'strict',
        enabled: true
      },
      {
        id: 'access_control_policy',
        name: 'Access Control Policy',
        description: 'Controls module access to system resources',
        category: 'access_control',
        enforcement: 'strict',
        enabled: true
      },
      {
        id: 'performance_policy',
        name: 'Performance Policy',
        description: 'Ensures modules meet performance requirements',
        category: 'performance',
        enforcement: 'moderate',
        enabled: true
      }
    ];

    res.json({ success: true, data: policies });
  } catch (error) {
    console.error('Error loading security policies:', error);
    await logger.error('Security policies loading failed', {
      operation: 'security_policies',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to load security policies' });
  }
});

export default router;
