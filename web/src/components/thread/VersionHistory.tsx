import { useState } from 'react';
import { useThreadVersions } from '../../hooks/useThreadVersions';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import { History, RotateCcw, Diff } from 'lucide-react';
import { Modal } from '../ui/modal';
import { DiffViewer } from './DiffViewer';

interface VersionHistoryProps {
  threadId: string;
  className?: string;
}

export const VersionHistory = ({ threadId, className }: VersionHistoryProps) => {
  const { versions, isLoading, error, rollbackToVersion, compareVersions } = useThreadVersions(threadId);
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState<any>(null);

  const handleCompare = async (version1: number, version2: number) => {
    try {
      const data = await compareVersions(version1, version2);
      setDiffData(data);
      setShowDiff(true);
    } catch (error) {
      console.error('Error comparing versions:', error);
    }
  };

  const handleRollback = async (version: number) => {
    if (!confirm('Are you sure you want to rollback to this version? This will create a new version with the old content.')) {
      return;
    }

    try {
      await rollbackToVersion(version);
    } catch (error) {
      console.error('Error rolling back version:', error);
    }
  };

  if (isLoading) {
    return <div className="version-history loading">Loading version history...</div>;
  }

  if (error) {
    return <div className="version-history error">{error}</div>;
  }

  return (
    <div className={`version-history ${className || ''}`}>
      <div className="version-history-header">
        <History className="icon" />
        <h3>Version History</h3>
      </div>

      <div className="version-list">
        {versions.map((version, index) => (
          <div key={version.id} className="version-item">
            <div className="version-info">
              <Avatar
                userId={version.createdBy}
                size="sm"
                className="version-avatar"
              />
              <div className="version-details">
                <span className="version-number">Version {version.version}</span>
                <span className="version-meta">
                  by {version.createdByUser.name} • {formatDistanceToNow(new Date(version.createdAt))} ago
                </span>
              </div>
            </div>

            <div className="version-actions">
              {index < versions.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCompare(version.version, versions[index + 1].version)}
                >
                  <Diff className="icon" />
                  Compare
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRollback(version.version)}
              >
                <RotateCcw className="icon" />
                Rollback
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showDiff}
        onClose={() => setShowDiff(false)}
        title={`Comparing Versions ${selectedVersions?.[0]} and ${selectedVersions?.[1]}`}
      >
        {diffData && (
          <DiffViewer
            version1={diffData.version1}
            version2={diffData.version2}
            changes={diffData.changes}
          />
        )}
      </Modal>
    </div>
  );
}; 