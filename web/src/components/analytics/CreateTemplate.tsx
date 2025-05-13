import React, { useState } from 'react';
import styles from './CreateTemplate.module.css';
import { ExportFilterOptions } from './ExportFilter';
import { ExportTemplate } from './ExportTemplates';

interface CreateTemplateProps {
  onTemplateCreate: (template: ExportTemplate) => void;
  currentOptions: ExportFilterOptions;
}

const CreateTemplate: React.FC<CreateTemplateProps> = ({
  onTemplateCreate,
  currentOptions,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    const newTemplate: ExportTemplate = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom export template',
      options: { ...currentOptions },
    };

    onTemplateCreate(newTemplate);
    setName('');
    setDescription('');
  };

  return (
    <div className={styles.createContainer}>
      <h3>Create Custom Template</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="templateName">Template Name:</label>
          <input
            id="templateName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter template name"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="templateDescription">Description:</label>
          <textarea
            id="templateDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter template description (optional)"
            rows={3}
          />
        </div>
        <div className={styles.currentSettings}>
          <h4>Current Settings:</h4>
          <ul>
            <li>
              <strong>Data Types:</strong>{' '}
              {[
                currentOptions.includeThreads && 'Threads',
                currentOptions.includeUsers && 'Users',
                currentOptions.includeTags && 'Tags',
              ]
                .filter(Boolean)
                .join(', ')}
            </li>
            <li>
              <strong>Date Range:</strong>{' '}
              {currentOptions.startDate || 'Start'} to {currentOptions.endDate || 'End'}
            </li>
          </ul>
        </div>
        <button type="submit" className={styles.submitButton}>
          Create Template
        </button>
      </form>
    </div>
  );
};

export default CreateTemplate; 