/* global module */
const { validateModuleData } = (req, res, next) => {
  const { moduleId, name, version, dependencies } = req.body;

  // Validate required fields
  if (!moduleId || !name || !version) {
    return res.status(400).json({
      error: 'Missing required fields: moduleId, name, and version are required'
    });
  }

  // Validate moduleId format
  if (!/^[a-z0-9-]+$/.test(moduleId)) {
    return res.status(400).json({
      error: 'moduleId must contain only lowercase letters, numbers, and hyphens'
    });
  }

  // Validate version format (semver)
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return res.status(400).json({
      error: 'version must follow semantic versioning format (e.g., 1.0.0)'
    });
  }

  // Validate dependencies if present
  if (dependencies) {
    if (!Array.isArray(dependencies)) {
      return res.status(400).json({
        error: 'dependencies must be an array'
      });
    }

    for (const dep of dependencies) {
      if (!dep.moduleId || !dep.version) {
        return res.status(400).json({
          error: 'Each dependency must have moduleId and version'
        });
      }

      if (!/^[a-z0-9-]+$/.test(dep.moduleId)) {
        return res.status(400).json({
          error: 'Dependency moduleId must contain only lowercase letters, numbers, and hyphens'
        });
      }

      if (!/^\d+\.\d+\.\d+$/.test(dep.version)) {
        return res.status(400).json({
          error: 'Dependency version must follow semantic versioning format'
        });
      }
    }
  }

  next();
};

module.exports = {
  validateModuleData
}; 