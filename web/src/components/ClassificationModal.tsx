import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Modal, Button, Badge } from '../../../shared/src/components';
import { getDataClassifications, classifyData, autoClassifyData } from '../api/retention';
import { getClassificationTemplates } from '../api/retention';
import type { DataClassification, ClassificationTemplate } from '../api/retention';

export interface ClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  resourceId: string;
  content?: string;
  currentClassification?: DataClassification;
  onClassify?: (classification: DataClassification) => void;
}

export default function ClassificationModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  content,
  currentClassification,
  onClassify
}: ClassificationModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState<DataClassification | null>(currentClassification || null);
  const [templates, setTemplates] = useState<ClassificationTemplate[]>([]);
  const [autoClassification, setAutoClassification] = useState<DataClassification | null>(null);
  const [formData, setFormData] = useState({
    sensitivity: 'PUBLIC' as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED',
    expiresAt: '',
    notes: ''
  });

  // Load templates and current classification
  useEffect(() => {
    if (isOpen && session?.accessToken) {
      loadTemplates();
      loadCurrentClassification();
      if (content) {
        performAutoClassification();
      }
    }
  }, [isOpen, session?.accessToken, resourceType, resourceId]);

  const loadTemplates = async () => {
    try {
      const response = await getClassificationTemplates(session!.accessToken!);
      setTemplates(response.data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const loadCurrentClassification = async () => {
    try {
      const response = await getDataClassifications(session!.accessToken!, {
        resourceType
      });
      if (response.data.classifications.length > 0) {
        // Find the classification for this specific resource
        const currentClass = response.data.classifications.find(c => c.resourceId === resourceId);
        if (currentClass) {
          setClassification(currentClass);
          setFormData({
            sensitivity: currentClass.sensitivity,
            expiresAt: currentClass.expiresAt || '',
            notes: currentClass.notes || ''
          });
        }
      }
    } catch (err) {
      console.error('Error loading current classification:', err);
    }
  };

  const performAutoClassification = async () => {
    if (!content) return;
    
    try {
      const response = await autoClassifyData(session!.accessToken!, {
        resourceType,
        resourceId,
        content
      });
      
      if (response.data.autoClassified && response.data.classification) {
        setAutoClassification(response.data.classification);
        setFormData({
          sensitivity: response.data.classification.sensitivity,
          expiresAt: response.data.classification.expiresAt || '',
          notes: response.data.classification.notes || ''
        });
      }
    } catch (err) {
      console.error('Error performing auto-classification:', err);
    }
  };

  const handleClassify = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const classificationData = {
        resourceType,
        resourceId,
        sensitivity: formData.sensitivity,
        expiresAt: formData.expiresAt || undefined,
        notes: formData.notes || undefined
      };
      
      const response = await classifyData(session.accessToken, classificationData);
      setClassification(response.data);
      
      if (onClassify) {
        onClassify(response.data);
      }
      
      onClose();
    } catch (err) {
      console.error('Error classifying data:', err);
      setError('Failed to classify data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: ClassificationTemplate) => {
    setFormData({
      sensitivity: template.sensitivity,
      expiresAt: template.expiresIn ? new Date(Date.now() + template.expiresIn * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
      notes: template.notes || ''
    });
  };

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'PUBLIC':
        return 'green';
      case 'INTERNAL':
        return 'blue';
      case 'CONFIDENTIAL':
        return 'yellow';
      case 'RESTRICTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getSensitivityLabel = (sensitivity: string) => {
    switch (sensitivity) {
      case 'PUBLIC':
        return 'Public';
      case 'INTERNAL':
        return 'Internal';
      case 'CONFIDENTIAL':
        return 'Confidential';
      case 'RESTRICTED':
        return 'Restricted';
      default:
        return sensitivity;
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Data Classification">
      <div className="space-y-6">
        {/* Current Classification */}
        {classification && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Current Classification</h3>
            <div className="flex items-center space-x-2">
              <Badge color={getSensitivityColor(classification.sensitivity)}>
                {getSensitivityLabel(classification.sensitivity)}
              </Badge>
              {classification.expiresAt && (
                <span className="text-sm text-gray-600">
                  Expires: {new Date(classification.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {classification.notes && (
              <p className="text-sm text-gray-600 mt-2">{classification.notes}</p>
            )}
          </div>
        )}

        {/* Auto-classification Result */}
        {autoClassification && !classification && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Auto-classification Suggested</h3>
            <div className="flex items-center space-x-2">
              <Badge color={getSensitivityColor(autoClassification.sensitivity)}>
                {getSensitivityLabel(autoClassification.sensitivity)}
              </Badge>
            </div>
            {autoClassification.notes && (
              <p className="text-sm text-blue-600 mt-2">{autoClassification.notes}</p>
            )}
          </div>
        )}

        {/* Classification Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity Level</label>
            <select
              value={formData.sensitivity}
              onChange={(e) => setFormData({ ...formData, sensitivity: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PUBLIC">Public</option>
              <option value="INTERNAL">Internal</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add notes about this classification..."
            />
          </div>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Quick Templates</h3>
            <div className="grid grid-cols-1 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </div>
                    <Badge color={getSensitivityColor(template.sensitivity)}>
                      {getSensitivityLabel(template.sensitivity)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleClassify} disabled={loading}>
            {loading ? 'Classifying...' : classification ? 'Update Classification' : 'Classify'}
          </Button>
        </div>
      </div>
    </Modal>
  );
} 