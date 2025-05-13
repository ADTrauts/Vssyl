import React, { useState, useEffect } from 'react';
import styles from './ExportTemplates.module.css';
import { TemplateSearch } from './TemplateSearch';
import { TemplateExportDialog } from './TemplateExportDialog';
import { TemplateShareDialog } from './TemplateShareDialog';
import { TemplateHistoryDialog } from './TemplateHistoryDialog';

interface VersionTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'pdf' | 'csv' | 'excel';
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  version: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  sharedWith?: Array<{
    userId: string;
    permissions: {
      canEdit: boolean;
      canShare: boolean;
      canDelete: boolean;
    };
  }>;
  versionHistory?: Array<{
    version: string;
    timestamp: string;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
    author: string;
    tags?: VersionTag[];
  }>;
}

interface ExportTemplatesProps {
  onTemplateEdit: (id: string, template: Partial<ExportTemplate>) => void;
  onTemplateDelete: (id: string) => void;
  onTemplateShare: (id: string, users: Array<{ userId: string; permissions: any }>) => void;
}

export const ExportTemplates: React.FC<ExportTemplatesProps> = ({
  onTemplateEdit,
  onTemplateDelete,
  onTemplateShare,
}) => {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ExportTemplate[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null);
  const [exportingTemplate, setExportingTemplate] = useState<ExportTemplate | null>(null);
  const [sharingTemplate, setSharingTemplate] = useState<ExportTemplate | null>(null);
  const [viewingHistory, setViewingHistory] = useState<ExportTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<ExportTemplate>>({
    name: '',
    description: '',
    format: 'pdf',
    fields: [],
  });

  useEffect(() => {
    // Load templates from localStorage
    const savedTemplates = localStorage.getItem('templates');
    if (savedTemplates) {
      const parsedTemplates = JSON.parse(savedTemplates);
      setTemplates(parsedTemplates);
      setFilteredTemplates(parsedTemplates);
    }
  }, []);

  useEffect(() => {
    // Save templates to localStorage whenever they change
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  const trackChanges = (oldTemplate: ExportTemplate, newTemplate: Partial<ExportTemplate>) => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    // Compare each field and track changes
    Object.entries(newTemplate).forEach(([key, value]) => {
      if (key === 'version' || key === 'updatedAt' || key === 'versionHistory') return;
      
      const oldValue = oldTemplate[key as keyof ExportTemplate];
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        changes.push({
          field: key,
          oldValue,
          newValue: value,
        });
      }
    });

    return changes;
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.description) {
      return;
    }

    const template: ExportTemplate = {
      id: crypto.randomUUID(),
      name: newTemplate.name,
      description: newTemplate.description,
      format: newTemplate.format || 'pdf',
      fields: newTemplate.fields || [],
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: newTemplate.category,
      versionHistory: [{
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        changes: [{
          field: 'Initial version',
          oldValue: null,
          newValue: 'Template created',
        }],
        author: 'Current User', // TODO: Replace with actual user
      }],
    };

    setTemplates([...templates, template]);
    setNewTemplate({
      name: '',
      description: '',
      format: 'pdf',
      fields: [],
    });
    setIsAdding(false);
  };

  const handleEditTemplate = (id: string, template: Partial<ExportTemplate>) => {
    const oldTemplate = templates.find(t => t.id === id);
    if (!oldTemplate) return;

    const changes = trackChanges(oldTemplate, template);
    if (changes.length === 0) return;

    const newVersion = (parseFloat(oldTemplate.version) + 0.1).toFixed(1);
    const versionHistory = [
      ...(oldTemplate.versionHistory || []),
      {
        version: newVersion,
        timestamp: new Date().toISOString(),
        changes,
        author: 'Current User', // TODO: Replace with actual user
      },
    ];

    const updatedTemplates = templates.map((t) =>
      t.id === id
        ? {
            ...t,
            ...template,
            version: newVersion,
            updatedAt: new Date().toISOString(),
            versionHistory,
          }
        : t
    );
    setTemplates(updatedTemplates);
    onTemplateEdit(id, template);
  };

  const handleRestoreVersion = (templateId: string, version: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !template.versionHistory) return;

    const versionToRestore = template.versionHistory.find(v => v.version === version);
    if (!versionToRestore) return;

    // Create a new version with the restored state
    const newVersion = (parseFloat(template.version) + 0.1).toFixed(1);
    const versionHistory = [
      ...template.versionHistory,
      {
        version: newVersion,
        timestamp: new Date().toISOString(),
        changes: [{
          field: 'Version Restored',
          oldValue: template.version,
          newValue: version,
        }],
        author: 'Current User', // TODO: Replace with actual user
      },
    ];

    // Find the template state at the version to restore
    const restoredTemplate = { ...template };
    versionToRestore.changes.forEach(change => {
      if (change.field !== 'Initial version') {
        (restoredTemplate as any)[change.field] = change.oldValue;
      }
    });

    const updatedTemplates = templates.map((t) =>
      t.id === templateId
        ? {
            ...restoredTemplate,
            version: newVersion,
            updatedAt: new Date().toISOString(),
            versionHistory,
          }
        : t
    );
    setTemplates(updatedTemplates);
    setViewingHistory(null);
  };

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== id);
    setTemplates(updatedTemplates);
    onTemplateDelete(id);
  };

  const handleShareTemplate = (id: string, users: Array<{ userId: string; permissions: any }>) => {
    const updatedTemplates = templates.map((t) =>
      t.id === id
        ? {
            ...t,
            sharedWith: users,
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    setTemplates(updatedTemplates);
    onTemplateShare(id, users);
  };

  const handleFieldAdd = () => {
    setNewTemplate({
      ...newTemplate,
      fields: [
        ...(newTemplate.fields || []),
        { name: '', type: 'text', required: false },
      ],
    });
  };

  const handleFieldRemove = (index: number) => {
    const updatedFields = [...(newTemplate.fields || [])];
    updatedFields.splice(index, 1);
    setNewTemplate({
      ...newTemplate,
      fields: updatedFields,
    });
  };

  const handleFieldChange = (index: number, field: { name: string; type: string; required: boolean }) => {
    const updatedFields = [...(newTemplate.fields || [])];
    updatedFields[index] = field;
    setNewTemplate({
      ...newTemplate,
      fields: updatedFields,
    });
  };

  const handleAddTag = (version: string, tag: Omit<VersionTag, 'id'>) => {
    setTemplates((prevTemplates) =>
      prevTemplates.map((template) => {
        if (template.id === viewingHistory?.id) {
          const versionHistory = template.versionHistory?.map((v) => {
            if (v.version === version) {
              const newTag = {
                ...tag,
                id: Math.random().toString(36).substr(2, 9),
              };
              return {
                ...v,
                tags: [...(v.tags || []), newTag],
              };
            }
            return v;
          });
          return {
            ...template,
            versionHistory,
          };
        }
        return template;
      })
    );
  };

  const handleRemoveTag = (version: string, tagId: string) => {
    setTemplates((prevTemplates) =>
      prevTemplates.map((template) => {
        if (template.id === viewingHistory?.id) {
          const versionHistory = template.versionHistory?.map((v) => {
            if (v.version === version) {
              return {
                ...v,
                tags: v.tags?.filter((tag) => tag.id !== tagId),
              };
            }
            return v;
          });
          return {
            ...template,
            versionHistory,
          };
        }
        return template;
      })
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.templatesHeader}>
        <h2>Export Templates</h2>
        <button
          className={styles.addButton}
          onClick={() => setIsAdding(true)}
        >
          Add Template
        </button>
      </div>

      <TemplateSearch
        templates={templates}
        onSearchResults={setFilteredTemplates}
      />

      <div className={styles.templatesList}>
        {filteredTemplates.map((template) => (
          <div key={template.id} className={styles.templateItem}>
            <div className={styles.templateInfo}>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <div className={styles.meta}>
                <span>Format: {template.format}</span>
                <span>Version: {template.version}</span>
                <span>Fields: {template.fields.length}</span>
                {template.category && <span>Category: {template.category}</span>}
              </div>
            </div>
            <div className={styles.templateActions}>
              <button
                className={styles.editButton}
                onClick={() => {
                  setEditingTemplate(template);
                  setIsEditing(true);
                }}
              >
                Edit
              </button>
              <button
                className={styles.exportButton}
                onClick={() => setExportingTemplate(template)}
              >
                Export
              </button>
              <button
                className={styles.shareButton}
                onClick={() => setSharingTemplate(template)}
              >
                Share
              </button>
              <button
                className={styles.historyButton}
                onClick={() => setViewingHistory(template)}
              >
                History
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => handleDeleteTemplate(template.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add New Template</h3>
            <input
              type="text"
              placeholder="Template Name"
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, name: e.target.value })
              }
            />
            <textarea
              placeholder="Template Description"
              value={newTemplate.description}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, description: e.target.value })
              }
            />
            <select
              value={newTemplate.format}
              onChange={(e) =>
                setNewTemplate({
                  ...newTemplate,
                  format: e.target.value as 'pdf' | 'csv' | 'excel',
                })
              }
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
            <input
              type="text"
              placeholder="Category (optional)"
              value={newTemplate.category || ''}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, category: e.target.value })
              }
            />
            <div className={styles.fields}>
              <h4>Fields</h4>
              {newTemplate.fields?.map((field, index) => (
                <div key={index} className={styles.field}>
                  <input
                    type="text"
                    placeholder="Field Name"
                    value={field.name}
                    onChange={(e) =>
                      handleFieldChange(index, {
                        ...field,
                        name: e.target.value,
                      })
                    }
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      handleFieldChange(index, {
                        ...field,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        handleFieldChange(index, {
                          ...field,
                          required: e.target.checked,
                        })
                      }
                    />
                    Required
                  </label>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleFieldRemove(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className={styles.addFieldButton}
                onClick={handleFieldAdd}
              >
                Add Field
              </button>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleAddTemplate}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && editingTemplate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Template</h3>
            <input
              type="text"
              placeholder="Template Name"
              value={editingTemplate.name}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  name: e.target.value,
                })
              }
            />
            <textarea
              placeholder="Template Description"
              value={editingTemplate.description}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  description: e.target.value,
                })
              }
            />
            <select
              value={editingTemplate.format}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  format: e.target.value as 'pdf' | 'csv' | 'excel',
                })
              }
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
            <input
              type="text"
              placeholder="Category (optional)"
              value={editingTemplate.category || ''}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  category: e.target.value,
                })
              }
            />
            <div className={styles.fields}>
              <h4>Fields</h4>
              {editingTemplate.fields.map((field, index) => (
                <div key={index} className={styles.field}>
                  <input
                    type="text"
                    placeholder="Field Name"
                    value={field.name}
                    onChange={(e) => {
                      const updatedFields = [...editingTemplate.fields];
                      updatedFields[index] = {
                        ...field,
                        name: e.target.value,
                      };
                      setEditingTemplate({
                        ...editingTemplate,
                        fields: updatedFields,
                      });
                    }}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const updatedFields = [...editingTemplate.fields];
                      updatedFields[index] = {
                        ...field,
                        type: e.target.value,
                      };
                      setEditingTemplate({
                        ...editingTemplate,
                        fields: updatedFields,
                      });
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => {
                        const updatedFields = [...editingTemplate.fields];
                        updatedFields[index] = {
                          ...field,
                          required: e.target.checked,
                        };
                        setEditingTemplate({
                          ...editingTemplate,
                          fields: updatedFields,
                        });
                      }}
                    />
                    Required
                  </label>
                  <button
                    className={styles.removeButton}
                    onClick={() => {
                      const updatedFields = [...editingTemplate.fields];
                      updatedFields.splice(index, 1);
                      setEditingTemplate({
                        ...editingTemplate,
                        fields: updatedFields,
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className={styles.addFieldButton}
                onClick={() => {
                  setEditingTemplate({
                    ...editingTemplate,
                    fields: [
                      ...editingTemplate.fields,
                      { name: '', type: 'text', required: false },
                    ],
                  });
                }}
              >
                Add Field
              </button>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setIsEditing(false);
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={() => {
                  handleEditTemplate(editingTemplate.id, editingTemplate);
                  setIsEditing(false);
                  setEditingTemplate(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {exportingTemplate && (
        <TemplateExportDialog
          template={exportingTemplate}
          onClose={() => setExportingTemplate(null)}
        />
      )}

      {sharingTemplate && (
        <TemplateShareDialog
          template={sharingTemplate}
          onClose={() => setSharingTemplate(null)}
          onShare={(users) => {
            handleShareTemplate(sharingTemplate.id, users);
            setSharingTemplate(null);
          }}
        />
      )}

      {viewingHistory && (
        <TemplateHistoryDialog
          template={viewingHistory}
          versions={viewingHistory.versionHistory || []}
          onClose={() => setViewingHistory(null)}
          onRestore={handleRestoreVersion}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />
      )}
    </div>
  );
}; 