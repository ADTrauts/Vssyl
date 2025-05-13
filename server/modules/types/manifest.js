import Joi from 'joi';

const moduleManifestSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
  description: Joi.string().required(),
  author: Joi.string().required(),
  license: Joi.string().required(),
  dependencies: Joi.object().pattern(
    Joi.string(),
    Joi.string().pattern(/^\d+\.\d+\.\d+$/)
  ).default({}),
  permissions: Joi.object({
    files: Joi.boolean().default(false),
    network: Joi.boolean().default(false),
    storage: Joi.boolean().default(false),
    system: Joi.boolean().default(false)
  }).default({}),
  entry: Joi.string().required(),
  main: Joi.string().required(),
  config: Joi.object().default({}),
  metadata: Joi.object().default({})
});

class ModuleManifest {
  constructor(manifest) {
    const { error, value } = moduleManifestSchema.validate(manifest);
    if (error) {
      throw new Error(`Invalid module manifest: ${error.message}`);
    }
    Object.assign(this, value);
  }

  validate() {
    return moduleManifestSchema.validate(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      license: this.license,
      dependencies: this.dependencies,
      permissions: this.permissions,
      entry: this.entry,
      main: this.main,
      config: this.config,
      metadata: this.metadata
    };
  }
}

export default ModuleManifest; 