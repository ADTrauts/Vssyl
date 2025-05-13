import React, { useState } from 'react';
import styles from './TemplateSharing.module.css';
import { ExportTemplate } from './ExportTemplates';

interface TemplateSharingProps {
  template: ExportTemplate;
  onClose: () => void;
}

const TemplateSharing: React.FC<TemplateSharingProps> = ({ template, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templateData = {
    ...template,
    options: {
      ...template.options,
      startDate: template.options.startDate || '',
      endDate: template.options.endDate || '',
    },
  };

  const shareUrl = `${window.location.origin}/analytics/templates?data=${encodeURIComponent(
    JSON.stringify(templateData)
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(templateData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.sharingContainer}>
      <div className={styles.sharingHeader}>
        <h3>Share Template</h3>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
      <div className={styles.sharingContent}>
        <div className={styles.sharingMethod}>
          <h4>Share via URL</h4>
          <div className={styles.urlContainer}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={styles.urlInput}
            />
            <button
              className={styles.copyButton}
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
        <div className={styles.sharingMethod}>
          <h4>Download Template</h4>
          <p className={styles.description}>
            Download the template file to share it with others or import it later.
          </p>
          <button className={styles.downloadButton} onClick={handleDownload}>
            Download JSON
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
};

export default TemplateSharing; 