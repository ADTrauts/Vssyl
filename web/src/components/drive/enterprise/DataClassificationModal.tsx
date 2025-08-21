import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  Shield, 
  Tag, 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff, 
  Clock, 
  User, 
  FileText,
  Search,
  Zap,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DataClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
    mimeType?: string;
    size?: number;
  }>;
  businessId?: string;
}

interface ClassificationLevel {
  id: string;
  name: string;
  color: string;
  description: string;
  restrictions: string[];
  retentionPeriod?: string;
  requiresApproval: boolean;
  icon: React.ReactNode;
}

interface ClassificationRule {
  id: string;
  name: string;
  pattern: string;
  classificationId: string;
  confidence: number;
  enabled: boolean;
}

interface ScanResult {
  fileId: string;
  fileName: string;
  suggestedClassification: string;
  confidence: number;
  detectedPatterns: Array<{
    type: string;
    pattern: string;
    matches: number;
  }>;
  currentClassification?: string;
}

const CLASSIFICATION_LEVELS: ClassificationLevel[] = [
  {
    id: 'public',
    name: 'Public',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Information that can be freely shared',
    restrictions: ['No restrictions'],
    icon: <Eye className="w-4 h-4" />,
    requiresApproval: false
  },
  {
    id: 'internal',
    name: 'Internal',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Information for internal use only',
    restrictions: ['Internal access only', 'No external sharing'],
    icon: <User className="w-4 h-4" />,
    requiresApproval: false
  },
  {
    id: 'confidential',
    name: 'Confidential',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Sensitive business information',
    restrictions: ['Restricted access', 'Approval required for sharing', 'Audit logging'],
    retentionPeriod: '7 years',
    icon: <Shield className="w-4 h-4" />,
    requiresApproval: true
  },
  {
    id: 'restricted',
    name: 'Restricted',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Highly sensitive or regulated information',
    restrictions: ['Admin approval required', 'No download', 'Encrypted storage', 'Full audit trail'],
    retentionPeriod: '10 years',
    icon: <Lock className="w-4 h-4" />,
    requiresApproval: true
  }
];

const DETECTION_RULES: ClassificationRule[] = [
  {
    id: 'ssn',
    name: 'Social Security Numbers',
    pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    classificationId: 'restricted',
    confidence: 0.95,
    enabled: true
  },
  {
    id: 'credit_card',
    name: 'Credit Card Numbers',
    pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
    classificationId: 'confidential',
    confidence: 0.90,
    enabled: true
  },
  {
    id: 'email',
    name: 'Email Addresses',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
    classificationId: 'internal',
    confidence: 0.80,
    enabled: true
  },
  {
    id: 'financial',
    name: 'Financial Keywords',
    pattern: '\\b(revenue|profit|budget|salary|compensation|financial)\\b',
    classificationId: 'confidential',
    confidence: 0.70,
    enabled: true
  }
];

export const DataClassificationModal: React.FC<DataClassificationModalProps> = ({
  isOpen,
  onClose,
  files,
  businessId
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [manualClassifications, setManualClassifications] = useState<Record<string, string>>({});
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen && files.length > 0) {
      scanFiles();
    }
  }, [isOpen, files]);

  const scanFiles = async () => {
    if (!autoScanEnabled) return;
    
    try {
      setScanning(true);
      
      // Simulate AI-powered content scanning
      const results: ScanResult[] = files.map(file => {
        // Mock scanning logic
        const mockPatterns = DETECTION_RULES.filter(() => Math.random() > 0.7);
        const confidence = mockPatterns.length > 0 ? 
          Math.max(...mockPatterns.map(p => p.confidence)) : 0.5;
        
        let suggestedClassification = 'internal';
        if (mockPatterns.some(p => p.classificationId === 'restricted')) {
          suggestedClassification = 'restricted';
        } else if (mockPatterns.some(p => p.classificationId === 'confidential')) {
          suggestedClassification = 'confidential';
        }
        
        return {
          fileId: file.id,
          fileName: file.name,
          suggestedClassification,
          confidence,
          detectedPatterns: mockPatterns.map(p => ({
            type: p.name,
            pattern: p.pattern,
            matches: Math.floor(Math.random() * 5) + 1
          })),
          currentClassification: 'internal' // Mock current classification
        };
      });
      
      setScanResults(results);
      
      // Record usage
      await recordUsage('drive_dlp', files.length);
      
      toast.success(`Scanned ${files.length} files for sensitive content`);
      
    } catch (error) {
      console.error('Failed to scan files:', error);
      toast.error('Failed to scan files');
    } finally {
      setScanning(false);
    }
  };

  const applyClassification = async (fileId: string, classificationId: string) => {
    try {
      setManualClassifications(prev => ({
        ...prev,
        [fileId]: classificationId
      }));
      
      const classification = CLASSIFICATION_LEVELS.find(c => c.id === classificationId);
      toast.success(`Applied ${classification?.name} classification`);
      
    } catch (error) {
      console.error('Failed to apply classification:', error);
      toast.error('Failed to apply classification');
    }
  };

  const applyBulkClassification = async () => {
    if (!selectedClassification) {
      toast.error('Please select a classification level');
      return;
    }
    
    try {
      const updates: Record<string, string> = {};
      
      if (applyToAll) {
        files.forEach(file => {
          updates[file.id] = selectedClassification;
        });
      } else {
        // Apply only to unclassified files
        files.forEach(file => {
          if (!manualClassifications[file.id]) {
            updates[file.id] = selectedClassification;
          }
        });
      }
      
      setManualClassifications(prev => ({ ...prev, ...updates }));
      
      const classification = CLASSIFICATION_LEVELS.find(c => c.id === selectedClassification);
      toast.success(`Applied ${classification?.name} to ${Object.keys(updates).length} files`);
      
    } catch (error) {
      console.error('Failed to apply bulk classification:', error);
      toast.error('Failed to apply classifications');
    }
  };

  const getClassificationLevel = (classificationId: string) => {
    return CLASSIFICATION_LEVELS.find(c => c.id === classificationId) || CLASSIFICATION_LEVELS[0];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <FeatureGate feature="drive_dlp" businessId={businessId}>
      <Modal open={isOpen} onClose={onClose} size="large">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Data Classification</h2>
              <p className="text-gray-600">
                Classify {files.length} files to ensure proper data protection and compliance
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-900">Auto-Scan Settings</h3>
                <p className="text-sm text-gray-600">Automatically detect sensitive content</p>
              </div>
              <Switch
                checked={autoScanEnabled}
                onChange={setAutoScanEnabled}
              />
            </div>
            
            {autoScanEnabled && (
              <div className="space-y-3">
                <Button
                  onClick={scanFiles}
                  disabled={scanning}
                  variant="secondary"
                  className="w-full"
                >
                  {scanning ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Re-scan Files
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Detection Rules Enabled:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DETECTION_RULES.filter(r => r.enabled).map(rule => (
                      <div key={rule.id} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>{rule.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Bulk Classification</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classification Level
                </label>
                <select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select classification</option>
                  {CLASSIFICATION_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={applyToAll}
                  onChange={setApplyToAll}
                />
                <span className="text-sm text-gray-700">Apply to all</span>
              </div>
              
              <Button onClick={applyBulkClassification} disabled={!selectedClassification}>
                Apply
              </Button>
            </div>
          </div>

          {/* Classification Levels Reference */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-3"
            >
              {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAdvanced ? 'Hide' : 'Show'} Classification Guide
            </button>
            
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {CLASSIFICATION_LEVELS.map(level => (
                  <div key={level.id} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      {level.icon}
                      <span className="font-medium text-gray-900">{level.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{level.description}</p>
                    <div className="space-y-1">
                      {level.restrictions.map((restriction, index) => (
                        <div key={index} className="text-xs text-gray-500 flex items-center gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          {restriction}
                        </div>
                      ))}
                    </div>
                    {level.retentionPeriod && (
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Retention: {level.retentionPeriod}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Results */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {files.map(file => {
              const result = scanResults.find(r => r.fileId === file.id);
              const currentClassification = manualClassifications[file.id] || result?.currentClassification || 'internal';
              const level = getClassificationLevel(currentClassification);
              const suggestedLevel = result ? getClassificationLevel(result.suggestedClassification) : null;
              
              return (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-600">{file.type}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Current Classification */}
                      <div className="text-sm">
                        <span className="text-gray-600">Current: </span>
                        <Badge className={`px-2 py-1 text-xs border rounded-full ${level.color}`}>
                          {level.icon}
                          <span className="ml-1">{level.name}</span>
                        </Badge>
                      </div>
                      
                      {/* Classification Selector */}
                      <select
                        value={currentClassification}
                        onChange={(e) => applyClassification(file.id, e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CLASSIFICATION_LEVELS.map(level => (
                          <option key={level.id} value={level.id}>{level.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* AI Suggestions */}
                  {result && autoScanEnabled && (
                    <div className="space-y-2">
                      {result.suggestedClassification !== currentClassification && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <Info className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            AI suggests: <strong>{suggestedLevel?.name}</strong> 
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceColor(result.confidence)}`}>
                              {Math.round(result.confidence * 100)}% confidence
                            </span>
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => applyClassification(file.id, result.suggestedClassification)}
                            className="ml-auto"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                      
                      {/* Detected Patterns */}
                      {result.detectedPatterns.length > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-600">Detected content: </span>
                          {result.detectedPatterns.map((pattern, index) => (
                            <Badge key={index} className="ml-1 px-2 py-0.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded">
                              {pattern.type} ({pattern.matches})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Classifications saved successfully');
              onClose();
            }}>
              Save Classifications
            </Button>
          </div>
        </div>
      </Modal>
    </FeatureGate>
  );
};

export default DataClassificationModal;
