import React, { useState, useRef } from 'react';
import styles from './TemplateImport.module.css';
import { ExportTemplate } from './ExportTemplates';
import { validateTemplate, formatTemplate, ValidationError } from './templateUtils';

interface TemplateImportProps {
  onImport: (template: ExportTemplate) => void;
  onClose: () => void;
}

const TemplateImport: React.FC<TemplateImportProps> = ({ onImport, onClose }) => {
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlImport = async () => {
    try {
      setIsLoading(true);
      setErrors([]);

      const params = new URLSearchParams(url.split('?')[1]);
      const templateData = JSON.parse(decodeURIComponent(params.get('data') || ''));
      
      const { isValid, errors: validationErrors } = validateTemplate(templateData);
      
      if (!isValid) {
        setErrors(validationErrors);
        return;
      }

      const formattedTemplate = formatTemplate(templateData);
      onImport(formattedTemplate);
      setUrl('');
    } catch (err) {
      setErrors([{ field: 'url', message: 'Invalid template URL or format' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const templateData = JSON.parse(e.target?.result as string);
        const { isValid, errors: validationErrors } = validateTemplate(templateData);
        
        if (!isValid) {
          setErrors(validationErrors);
          return;
        }

        const formattedTemplate = formatTemplate(templateData);
        onImport(formattedTemplate);
        setErrors([]);
      } catch (err) {
        setErrors([{ field: 'file', message: 'Invalid template file format' }]);
      }
    };
    reader.readAsText(file);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.importContainer}>
      <div className={styles.importHeader}>
        <h3>Import Template</h3>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
      <div className={styles.importContent}>
        <div className={styles.importMethod}>
          <h4>Import from URL</h4>
          <div className={styles.urlContainer}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste template URL here"
              className={styles.urlInput}
            />
            <button
              className={styles.importButton}
              onClick={handleUrlImport}
              disabled={!url || isLoading}
            >
              {isLoading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
        <div className={styles.importMethod}>
          <h4>Import from File</h4>
          <p className={styles.description}>
            Upload a template JSON file to import its settings.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className={styles.fileInput}
          />
          <button
            className={styles.fileButton}
            onClick={handleFileClick}
          >
            Choose File
          </button>
        </div>
        {errors.length > 0 && (
          <div className={styles.errors}>
            {errors.map((error, index) => (
              <div key={index} className={styles.error}>
                {error.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateImport; 