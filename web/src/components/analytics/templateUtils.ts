import { ExportTemplate } from './ExportTemplates';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateTemplate = (template: any): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!template.id || typeof template.id !== 'string') {
    errors.push({ field: 'id', message: 'Template must have a valid ID' });
  }

  if (!template.name || typeof template.name !== 'string') {
    errors.push({ field: 'name', message: 'Template must have a name' });
  }

  if (!template.description || typeof template.description !== 'string') {
    errors.push({ field: 'description', message: 'Template must have a description' });
  }

  // Validate options
  if (!template.options || typeof template.options !== 'object') {
    errors.push({ field: 'options', message: 'Template must have options' });
  } else {
    const { options } = template;
    
    if (typeof options.includeThreads !== 'boolean') {
      errors.push({ field: 'options.includeThreads', message: 'Include threads must be a boolean' });
    }

    if (typeof options.includeUsers !== 'boolean') {
      errors.push({ field: 'options.includeUsers', message: 'Include users must be a boolean' });
    }

    if (typeof options.includeTags !== 'boolean') {
      errors.push({ field: 'options.includeTags', message: 'Include tags must be a boolean' });
    }

    if (typeof options.startDate !== 'string' || !options.startDate) {
      errors.push({ field: 'options.startDate', message: 'Start date must be a valid string' });
    }

    if (typeof options.endDate !== 'string' || !options.endDate) {
      errors.push({ field: 'options.endDate', message: 'End date must be a valid string' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatTemplate = (template: any): ExportTemplate => {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    options: {
      includeThreads: Boolean(template.options?.includeThreads),
      includeUsers: Boolean(template.options?.includeUsers),
      includeTags: Boolean(template.options?.includeTags),
      startDate: String(template.options?.startDate || ''),
      endDate: String(template.options?.endDate || '')
    }
  };
}; 