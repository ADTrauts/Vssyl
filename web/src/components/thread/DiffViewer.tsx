import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface DiffViewerProps {
  version1: {
    content: string;
    createdByUser: {
      name: string;
      avatarUrl?: string;
    };
    createdAt: Date;
  };
  version2: {
    content: string;
    createdByUser: {
      name: string;
      avatarUrl?: string;
    };
    createdAt: Date;
  };
  changes: {
    type: 'insert' | 'delete' | 'replace';
    position: number;
    length: number;
    text?: string;
  }[];
}

export const DiffViewer = ({ version1, version2, changes }: DiffViewerProps) => {
  const diffRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diffRef.current) return;

    const renderDiff = () => {
      const container = diffRef.current!;
      container.innerHTML = '';

      let currentPosition = 0;
      const lines1 = version1.content.split('\n');
      const lines2 = version2.content.split('\n');

      changes.forEach(change => {
        // Add unchanged content before the change
        if (change.position > currentPosition) {
          const unchanged = version1.content.slice(currentPosition, change.position);
          const unchangedLines = unchanged.split('\n');
          unchangedLines.forEach(line => {
            const lineElement = document.createElement('div');
            lineElement.className = 'diff-line unchanged';
            lineElement.textContent = line;
            container.appendChild(lineElement);
          });
        }

        // Add changed content
        const changeElement = document.createElement('div');
        changeElement.className = `diff-line ${change.type}`;

        switch (change.type) {
          case 'insert':
            changeElement.textContent = `+ ${change.text}`;
            break;
          case 'delete':
            changeElement.textContent = `- ${version1.content.slice(change.position, change.position + change.length)}`;
            break;
          case 'replace':
            changeElement.innerHTML = `
              <span class="deleted">- ${version1.content.slice(change.position, change.position + change.length)}</span>
              <span class="inserted">+ ${change.text}</span>
            `;
            break;
        }

        container.appendChild(changeElement);
        currentPosition = change.position + change.length;
      });

      // Add remaining unchanged content
      if (currentPosition < version1.content.length) {
        const unchanged = version1.content.slice(currentPosition);
        const unchangedLines = unchanged.split('\n');
        unchangedLines.forEach(line => {
          const lineElement = document.createElement('div');
          lineElement.className = 'diff-line unchanged';
          lineElement.textContent = line;
          container.appendChild(lineElement);
        });
      }
    };

    renderDiff();
  }, [version1.content, version2.content, changes]);

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <div className="version-info">
          <div className="version-title">Version 1</div>
          <div className="version-meta">
            by {version1.createdByUser.name} • {formatDistanceToNow(new Date(version1.createdAt))} ago
          </div>
        </div>
        <div className="version-info">
          <div className="version-title">Version 2</div>
          <div className="version-meta">
            by {version2.createdByUser.name} • {formatDistanceToNow(new Date(version2.createdAt))} ago
          </div>
        </div>
      </div>

      <div className="diff-content" ref={diffRef} />
    </div>
  );
}; 