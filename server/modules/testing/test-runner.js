const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const { ModuleRuntime } = require('../runtime/module-runtime');
const { SecurityPolicyManager } = require('../security/policy-manager');
const { ModuleMonitor } = require('../monitoring/monitor');
const chalk = require('chalk');

class ModuleTestRunner extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.runtime = new ModuleRuntime(config.runtime);
    this.securityManager = new SecurityPolicyManager(config.security);
    this.monitor = new ModuleMonitor(config.monitoring);
  }

  async initialize() {
    await this.runtime.initialize();
    await this.securityManager.initialize();
    await this.monitor.initialize();

    // Forward events
    this.runtime.on('moduleLoaded', (moduleId) => this.emit('moduleLoaded', moduleId));
    this.runtime.on('moduleUnloaded', (moduleId) => this.emit('moduleUnloaded', moduleId));
    this.runtime.on('moduleError', (moduleId, error) => this.emit('moduleError', moduleId, error));
  }

  async runTests(moduleId, testSuite) {
    try {
      const module = this.runtime.getModule(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      const results = {
        moduleId,
        timestamp: new Date(),
        totalTests: testSuite.length,
        passed: 0,
        failed: 0,
        errors: 0,
        testResults: []
      };

      for (const test of testSuite) {
        try {
          const testResult = await this.runTest(module, test);
          results.testResults.push(testResult);
          
          if (testResult.status === 'passed') {
            results.passed++;
          } else if (testResult.status === 'failed') {
            results.failed++;
          } else {
            results.errors++;
          }
        } catch (error) {
          results.errors++;
          results.testResults.push({
            name: test.name,
            status: 'error',
            error: error.message,
            duration: 0
          });
        }
      }

      await this.monitor.recordTestResults(moduleId, results);
      return results;
    } catch (error) {
      this.emit('testError', moduleId, error);
      throw error;
    }
  }

  async runTest(module, test) {
    const startTime = Date.now();
    try {
      const result = await test.run(module);
      return {
        name: test.name,
        status: 'passed',
        duration: Date.now() - startTime,
        result
      };
    } catch (error) {
      return {
        name: test.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  async validateModule(moduleId) {
    const module = this.runtime.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const validationResults = {
      moduleId,
      timestamp: new Date(),
      securityChecks: [],
      performanceChecks: [],
      compatibilityChecks: []
    };

    // Run security checks
    const securityPolicies = await this.securityManager.getPolicies(moduleId);
    for (const policy of securityPolicies) {
      const result = await this.securityManager.validatePolicy(moduleId, policy);
      validationResults.securityChecks.push({
        policy: policy.name,
        status: result.valid ? 'passed' : 'failed',
        details: result.details
      });
    }

    // Run performance checks
    const performanceMetrics = await this.monitor.getMetrics(moduleId);
    validationResults.performanceChecks.push({
      metric: 'memoryUsage',
      value: performanceMetrics.memoryUsage,
      status: performanceMetrics.memoryUsage < this.config.performance.maxMemory ? 'passed' : 'failed'
    });

    // Run compatibility checks
    const manifest = module.getManifest();
    validationResults.compatibilityChecks.push({
      check: 'manifestFormat',
      status: this.validateManifestFormat(manifest) ? 'passed' : 'failed'
    });

    return validationResults;
  }

  validateManifestFormat(manifest) {
    const requiredFields = ['id', 'name', 'version', 'description'];
    return requiredFields.every(field => manifest[field]);
  }

  async cleanup() {
    await this.runtime.cleanup();
    await this.securityManager.cleanup();
    await this.monitor.cleanup();
  }
}

class TestRunner {
  constructor(testDir) {
    this.testDir = testDir;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      suites: []
    };
  }

  async loadTestFiles() {
    const files = await fs.readdir(this.testDir);
    const testFiles = files.filter(file => file.endsWith('.test.js'));
    return testFiles.map(file => path.join(this.testDir, file));
  }

  async runTest(test) {
    try {
      await test.testFn();
      return {
        name: test.name,
        status: 'passed'
      };
    } catch (error) {
      return {
        name: test.name,
        status: 'failed',
        error: error.message
      };
    }
  }

  async runSuite(suite) {
    console.log(chalk.blue(`\nRunning suite: ${suite.name}`));
    
    const results = [];
    for (const test of suite.tests) {
      const result = await this.runTest(test);
      results.push(result);
      
      if (result.status === 'passed') {
        console.log(chalk.green(`  ✓ ${test.name}`));
        this.results.passed++;
      } else {
        console.log(chalk.red(`  ✗ ${test.name}`));
        console.log(chalk.red(`    ${result.error}`));
        this.results.failed++;
      }
      this.results.total++;
    }

    return {
      name: suite.name,
      results
    };
  }

  async run() {
    const testFiles = await this.loadTestFiles();
    
    for (const file of testFiles) {
      const testModule = require(file);
      for (const suite of testModule.tests) {
        const suiteResults = await this.runSuite(suite);
        this.results.suites.push(suiteResults);
      }
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  printSummary() {
    console.log('\nTest Summary:');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(chalk.green(`Passed: ${this.results.passed}`));
    console.log(chalk.red(`Failed: ${this.results.failed}`));
  }
}

module.exports = TestRunner; 