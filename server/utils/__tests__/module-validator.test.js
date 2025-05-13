const { validateModule } = require('../module-validator');

describe('Module Validator', () => {
  const validModule = {
    name: 'test-module',
    version: '1.0.0',
    description: 'A test module for validation',
    permissions: ['read', 'write'],
    dependencies: {
      'base-module': '^1.0.0'
    },
    code: 'function test() { return true; }'
  };

  test('should validate a correct module', async () => {
    const result = await validateModule(validModule);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid module name', async () => {
    const module = { ...validModule, name: 'Invalid Name!' };
    const result = await validateModule(module);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Module name can only contain lowercase letters, numbers, and hyphens');
  });

  test('should reject invalid version', async () => {
    const module = { ...validModule, version: 'invalid' };
    const result = await validateModule(module);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Module version must be a valid semantic version');
  });

  test('should reject invalid description', async () => {
    const module = { ...validModule, description: 'Too short' };
    const result = await validateModule(module);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Module description must be between 10 and 500 characters');
  });

  test('should reject invalid permissions', async () => {
    const module = { ...validModule, permissions: ['invalid-permission'] };
    const result = await validateModule(module);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid permission: invalid-permission');
  });

  test('should reject invalid dependencies', async () => {
    const module = { ...validModule, dependencies: { 'base-module': 'invalid' } };
    const result = await validateModule(module);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid version range for dependency base-module');
  });

  test('should reject invalid code', async () => {
    const module = { ...validModule, code: '' };
    const result = await validateModule(module);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Module code must be at least 10 characters long');
  });

  test('should handle missing required fields', async () => {
    const module = {};
    const result = await validateModule(module);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Module name is required and must be a string');
    expect(result.errors).toContain('Module version is required and must be a string');
    expect(result.errors).toContain('Module description is required and must be a string');
    expect(result.errors).toContain('Module code is required and must be a string');
  });
}); 