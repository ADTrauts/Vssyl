import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import Docker from 'dockerode';
import {
  SandboxTestResult,
  SandboxTestEnvironment,
  SandboxTestScenario,
  NetworkTrafficLog,
  SecurityViolation,
  PerformanceMetrics
} from '../../../shared/dist/types/sandbox';

/**
 * Sandbox Testing Service
 * Handles isolated testing of submitted modules in secure containers
 * Following our Service Architecture Standards
 */
export class SandboxService extends EventEmitter {
  private prisma: PrismaClient;
  private docker: Docker;
  private readonly SANDBOX_TIMEOUT = 300000; // 5 minutes
  private readonly MAX_CONTAINER_MEMORY = 512 * 1024 * 1024; // 512MB
  private readonly MAX_CONTAINER_CPU = 0.5; // 50% CPU

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.docker = new Docker();
  }

  /**
   * Test a module in a sandbox environment
   * @param moduleData - Module submission data
   * @returns Sandbox test results
   */
  async testModuleInSandbox(moduleData: Record<string, unknown>): Promise<SandboxTestResult> {
    try {
      console.log('🏗️ Starting sandbox testing for module...');
      
      const testEnvironment = await this.createSandboxEnvironment(moduleData);
      const testScenarios = this.generateTestScenarios(moduleData);
      
      const results: SandboxTestResult = {
        testId: `test_${Date.now()}`,
        moduleId: moduleData.id as string || 'unknown',
        environment: testEnvironment,
        scenarios: testScenarios,
        results: {
          networkTraffic: [],
          securityViolations: [],
          performanceMetrics: {
            cpuUsage: 0,
            memoryUsage: 0,
            executionTime: 0,
            networkRequests: 0
          },
          behaviorAnalysis: {
            suspiciousActivities: [],
            apiCalls: [],
            fileOperations: [],
            networkConnections: []
          }
        },
        status: 'running',
        startedAt: new Date().toISOString(),
        completedAt: null,
        error: null
      };

      // Start container and run tests
      const container = await this.createTestContainer(moduleData);
      await this.runTestScenarios(container, testScenarios, results);
      await this.cleanupContainer(container);

      results.status = 'completed';
      results.completedAt = new Date().toISOString();

      this.emit('sandboxTestComplete', { moduleData, results });
      
      await logger.info('Sandbox testing completed', {
        operation: 'sandbox_testing',
        testId: results.testId,
        status: results.status,
        violations: results.results.securityViolations.length
      });

      console.log(`✅ Sandbox testing completed for module ${moduleData.name}`);
      return results;

    } catch (error) {
      console.error('❌ Error in sandbox testing:', error);
      await logger.error('Sandbox testing failed', {
        operation: 'sandbox_testing',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

  /**
   * Create sandbox environment configuration
   */
  private async createSandboxEnvironment(moduleData: Record<string, unknown>): Promise<SandboxTestEnvironment> {
    const manifest = moduleData.manifest as Record<string, unknown>;
    const frontend = manifest?.frontend as Record<string, unknown>;
    const entryUrl = frontend?.entryUrl as string;

    return {
      container: {
        type: 'docker',
        isolation: 'network',
        resourceLimits: {
          cpu: this.MAX_CONTAINER_CPU,
          memory: this.MAX_CONTAINER_MEMORY,
          disk: 1024 * 1024 * 1024, // 1GB
          network: ['http', 'https']
        }
      },
      monitoring: {
        networkTraffic: true,
        fileSystemAccess: true,
        apiCalls: true,
        performanceMetrics: true,
        securityViolations: true
      },
      testScenarios: {
        normalOperation: true,
        edgeCases: true,
        errorHandling: true,
        securityBoundaries: true
      },
      moduleUrl: entryUrl || 'unknown'
    };
  }

  /**
   * Generate test scenarios based on module data
   */
  private generateTestScenarios(moduleData: Record<string, unknown>): SandboxTestScenario[] {
    const scenarios: SandboxTestScenario[] = [
      {
        id: 'normal_operation',
        name: 'Normal Operation Test',
        description: 'Test module under normal operating conditions',
        testType: 'functional',
        expectedBehavior: 'module loads and functions correctly',
        timeout: 60000 // 1 minute
      },
      {
        id: 'error_handling',
        name: 'Error Handling Test',
        description: 'Test module behavior under error conditions',
        testType: 'security',
        expectedBehavior: 'module handles errors gracefully',
        timeout: 30000 // 30 seconds
      },
      {
        id: 'network_security',
        name: 'Network Security Test',
        description: 'Test network requests and security boundaries',
        testType: 'security',
        expectedBehavior: 'module respects network security policies',
        timeout: 45000 // 45 seconds
      },
      {
        id: 'performance_test',
        name: 'Performance Test',
        description: 'Test module performance and resource usage',
        testType: 'performance',
        expectedBehavior: 'module performs within acceptable limits',
        timeout: 90000 // 1.5 minutes
      }
    ];

    return scenarios;
  }

  /**
   * Create Docker container for testing
   */
  private async createTestContainer(moduleData: Record<string, unknown>): Promise<Docker.Container> {
    const manifest = moduleData.manifest as Record<string, unknown>;
    const frontend = manifest?.frontend as Record<string, unknown>;
    const entryUrl = frontend?.entryUrl as string;

    const containerConfig = {
      Image: 'node:18-alpine',
      name: `sandbox_test_${Date.now()}`,
      Cmd: ['node', '-e', `
        const puppeteer = require('puppeteer');
        const fs = require('fs');
        
        async function testModule() {
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          const page = await browser.newPage();
          
          // Monitor network requests
          page.on('request', request => {
            console.log('NETWORK_REQUEST:', JSON.stringify({
              url: request.url(),
              method: request.method(),
              headers: request.headers()
            }));
          });
          
          // Monitor console logs
          page.on('console', msg => {
            console.log('CONSOLE_LOG:', JSON.stringify({
              type: msg.type(),
              text: msg.text()
            }));
          });
          
          try {
            await page.goto('${entryUrl}', { timeout: 30000 });
            await page.waitForTimeout(5000); // Wait 5 seconds for module to load
          } catch (error) {
            console.log('MODULE_ERROR:', JSON.stringify({
              error: error.message
            }));
          }
          
          await browser.close();
        }
        
        testModule().catch(console.error);
      `],
      HostConfig: {
        Memory: this.MAX_CONTAINER_MEMORY,
        CpuQuota: Math.floor(this.MAX_CONTAINER_CPU * 100000),
        CpuPeriod: 100000,
        NetworkMode: 'bridge',
        RestartPolicy: { Name: 'no' },
        SecurityOpt: ['no-new-privileges:true'],
        CapDrop: ['ALL'],
        CapAdd: ['NET_BIND_SERVICE']
      },
      Env: [
        'NODE_ENV=test',
        'SANDBOX_MODE=true'
      ],
      Labels: {
        'sandbox.test': 'true',
        'module.id': moduleData.id as string || 'unknown'
      }
    };

    const container = await this.docker.createContainer(containerConfig);
    await container.start();
    
    return container;
  }

  /**
   * Run test scenarios in the container
   */
  private async runTestScenarios(
    container: Docker.Container, 
    scenarios: SandboxTestScenario[], 
    results: SandboxTestResult
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Wait for container to complete or timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Sandbox test timeout')), this.SANDBOX_TIMEOUT);
      });

      const containerPromise = new Promise<void>((resolve) => {
        container.wait((err: Error | null, data: unknown) => {
          if (err) {
            console.error('Container wait error:', err);
          }
          resolve();
        });
      });

      await Promise.race([containerPromise, timeoutPromise]);

      // Get container logs and analyze
      const logs = await this.getContainerLogs(container);
      await this.analyzeContainerLogs(logs, results);

      // Get container stats
      const stats = await this.getContainerStats(container);
      await this.analyzeContainerStats(stats, results);

    } catch (error) {
      if (error instanceof Error && error.message === 'Sandbox test timeout') {
        results.results.securityViolations.push({
          type: 'timeout',
          severity: 'high',
          description: 'Module test exceeded maximum timeout',
          timestamp: new Date().toISOString(),
          details: { timeout: this.SANDBOX_TIMEOUT }
        });
      } else {
        results.results.securityViolations.push({
          type: 'execution_error',
          severity: 'high',
          description: 'Error during module execution',
          timestamp: new Date().toISOString(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    } finally {
      results.results.performanceMetrics.executionTime = Date.now() - startTime;
    }
  }

  /**
   * Get container logs and analyze them
   */
  private async getContainerLogs(container: Docker.Container): Promise<string> {
    try {
      const logs = await container.logs({ stdout: true, stderr: true });
      return logs.toString();
    } catch (error) {
      console.error('Error getting container logs:', error);
      return '';
    }
  }

  /**
   * Analyze container logs for security violations and behavior
   */
  private async analyzeContainerLogs(logs: string, results: SandboxTestResult): Promise<void> {
    const lines = logs.split('\n');
    
    for (const line of lines) {
      try {
        if (line.includes('NETWORK_REQUEST:')) {
          const networkData = JSON.parse(line.split('NETWORK_REQUEST:')[1]);
          results.results.networkTraffic.push({
            url: networkData.url,
            method: networkData.method,
            timestamp: new Date().toISOString(),
            headers: networkData.headers,
            blocked: this.isSuspiciousRequest(networkData)
          });
          
          if (this.isSuspiciousRequest(networkData)) {
            results.results.securityViolations.push({
              type: 'suspicious_network_request',
              severity: 'medium',
              description: `Suspicious network request to: ${networkData.url}`,
              timestamp: new Date().toISOString(),
              details: networkData
            });
          }
        }

        if (line.includes('MODULE_ERROR:')) {
          const errorData = JSON.parse(line.split('MODULE_ERROR:')[1]);
          results.results.securityViolations.push({
            type: 'module_error',
            severity: 'low',
            description: `Module execution error: ${errorData.error}`,
            timestamp: new Date().toISOString(),
            details: errorData
          });
        }

        if (line.includes('CONSOLE_LOG:')) {
          const consoleData = JSON.parse(line.split('CONSOLE_LOG:')[1]);
          if (this.isSuspiciousConsoleLog(consoleData)) {
            results.results.securityViolations.push({
              type: 'suspicious_console_log',
              severity: 'low',
              description: `Suspicious console log: ${consoleData.text}`,
              timestamp: new Date().toISOString(),
              details: consoleData
            });
          }
        }
      } catch (error) {
        // Ignore JSON parsing errors for malformed log entries
      }
    }
  }

  /**
   * Check if network request is suspicious
   */
  private isSuspiciousRequest(request: any): boolean {
    const suspiciousPatterns = [
      /malware/i,
      /virus/i,
      /trojan/i,
      /backdoor/i,
      /phishing/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(request.url));
  }

  /**
   * Check if console log is suspicious
   */
  private isSuspiciousConsoleLog(log: any): boolean {
    const suspiciousPatterns = [
      /eval\(/i,
      /document\.write/i,
      /innerHTML/i,
      /outerHTML/i,
      /window\.location/i,
      /document\.cookie/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(log.text));
  }

  /**
   * Get container statistics
   */
  private async getContainerStats(container: Docker.Container): Promise<Record<string, unknown>> {
    try {
      const stats = await container.stats();
      return stats as unknown as Record<string, unknown>;
    } catch (error) {
      console.error('Error getting container stats:', error);
      return {};
    }
  }

  /**
   * Analyze container statistics for performance metrics
   */
  private async analyzeContainerStats(stats: Record<string, unknown>, results: SandboxTestResult): Promise<void> {
    if (stats && stats.cpu_stats && stats.memory_stats) {
      results.results.performanceMetrics.cpuUsage = this.calculateCpuUsage(stats.cpu_stats as Record<string, unknown>);
      results.results.performanceMetrics.memoryUsage = (stats.memory_stats as Record<string, unknown>).usage as number || 0;
    }

    results.results.performanceMetrics.networkRequests = results.results.networkTraffic.length;
  }

  /**
   * Calculate CPU usage from Docker stats
   */
  private calculateCpuUsage(cpuStats: Record<string, unknown>): number {
    const cpuUsage = cpuStats.cpu_usage as Record<string, unknown>;
    const systemCpuUsage = cpuStats.system_cpu_usage as number;
    const precpuStats = cpuStats.precpu_stats as Record<string, unknown>;
    
    if (!cpuUsage || !systemCpuUsage) {
      return 0;
    }

    const cpuDelta = (cpuUsage.total_usage as number) - ((precpuStats?.cpu_usage as Record<string, unknown>)?.total_usage as number || 0);
    const systemDelta = systemCpuUsage - (precpuStats?.system_cpu_usage as number || 0);
    
    if (systemDelta === 0) return 0;
    
    return (cpuDelta / systemDelta) * 100;
  }

  /**
   * Cleanup test container
   */
  private async cleanupContainer(container: Docker.Container): Promise<void> {
    try {
      await container.stop();
      await container.remove();
      console.log('✅ Sandbox container cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up sandbox container:', error);
    }
  }
}
