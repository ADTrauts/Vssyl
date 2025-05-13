const semver = require('semver');

/**
 * Validates a module submission
 * @param {Object} module - The module to validate
 * @param {string} module.name - Module name
 * @param {string} module.version - Module version
 * @param {string} module.description - Module description
 * @param {string[]} module.permissions - Required permissions
 * @param {Object} module.dependencies - Module dependencies
 * @param {string} module.code - Module code
 * @returns {Object} Validation result
 */
async function validateModule(module) {
  const errors = [];

  // Validate name
  if (!module.name || typeof module.name !== 'string') {
    errors.push('Module name is required and must be a string');
  } else if (module.name.length < 3 || module.name.length > 50) {
    errors.push('Module name must be between 3 and 50 characters');
  } else if (!/^[a-z0-9-]+$/.test(module.name)) {
    errors.push('Module name can only contain lowercase letters, numbers, and hyphens');
  }

  // Validate version
  if (!module.version || typeof module.version !== 'string') {
    errors.push('Module version is required and must be a string');
  } else if (!semver.valid(module.version)) {
    errors.push('Module version must be a valid semantic version');
  }

  // Validate description
  if (!module.description || typeof module.description !== 'string') {
    errors.push('Module description is required and must be a string');
  } else if (module.description.length < 10 || module.description.length > 500) {
    errors.push('Module description must be between 10 and 500 characters');
  }

  // Validate permissions
  if (!Array.isArray(module.permissions)) {
    errors.push('Module permissions must be an array');
  } else {
    const validPermissions = ['read', 'write', 'execute', 'admin'];
    for (const permission of module.permissions) {
      if (!validPermissions.includes(permission)) {
        errors.push(`Invalid permission: ${permission}`);
      }
    }
  }

  // Validate dependencies
  if (module.dependencies && typeof module.dependencies !== 'object') {
    errors.push('Module dependencies must be an object');
  } else if (module.dependencies) {
    for (const [depName, depVersion] of Object.entries(module.dependencies)) {
      if (typeof depName !== 'string' || typeof depVersion !== 'string') {
        errors.push('Dependency names and versions must be strings');
      } else if (!semver.validRange(depVersion)) {
        errors.push(`Invalid version range for dependency ${depName}`);
      }
    }
  }

  // Validate code
  if (!module.code || typeof module.code !== 'string') {
    errors.push('Module code is required and must be a string');
  } else if (module.code.length < 10) {
    errors.push('Module code must be at least 10 characters long');
  }

  // TODO: Add code syntax validation
  // TODO: Add security checks
  // TODO: Add performance checks

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateModule
}; 