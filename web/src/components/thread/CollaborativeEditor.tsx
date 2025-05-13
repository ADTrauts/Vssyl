import { useState, useEffect, useRef } from 'react';
import { useThreadCollaboration } from '../../hooks/useThreadCollaboration';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Lock, Unlock } from 'lucide-react';

interface CollaborativeEditorProps {
  threadId: string;
  initialContent: string;
  onContentChange?: (content: string) => void;
}

export const CollaborativeEditor = ({
  threadId,
  initialContent,
  onContentChange
}: CollaborativeEditorProps) => {
  const { user } = useAuth();
  const {
    cursors,
    editLock,
    isEditing,
    updateCursor,
    requestEditLock,
    releaseEditLock,
    updateContent
  } = useThreadCollaboration(threadId);

  const [content, setContent] = useState(initialContent);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cursorRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleCursorMove = () => {
    if (!editorRef.current || !isEditing) return;

    const textarea = editorRef.current;
    const position = {
      line: textarea.value.substring(0, textarea.selectionStart).split('\n').length,
      column: textarea.selectionStart - textarea.value.lastIndexOf('\n', textarea.selectionStart - 1)
    };

    updateCursor(position);
  };

  const handleEditLockClick = async () => {
    if (isEditing) {
      await releaseEditLock();
    } else {
      await requestEditLock();
    }
  };

  useEffect(() => {
    const handleCursorMoveEvent = (event: MouseEvent) => {
      handleCursorMove();
    };

    document.addEventListener('mousemove', handleCursorMoveEvent);
    return () => {
      document.removeEventListener('mousemove', handleCursorMoveEvent);
    };
  }, [handleCursorMove]);

  return (
    <div className="collaborative-editor">
      <div className="editor-header">
        <Button
          onClick={handleEditLockClick}
          variant={isEditing ? 'primary' : 'secondary'}
          className="edit-lock-button"
        >
          {isEditing ? (
            <>
              <Unlock className="lock-icon" />
              Release Edit Lock
            </>
          ) : (
            <>
              <Lock className="lock-icon" />
              Request Edit Lock
            </>
          )}
        </Button>
        {editLock && !isEditing && (
          <div className="edit-lock-info">
            Thread is being edited by {editLock === user?.id ? 'you' : 'another user'}
          </div>
        )}
      </div>

      <div className="editor-container">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          disabled={!isEditing && editLock !== null}
          className="editor-textarea"
        />
        <div className="cursor-layer">
          {cursors.map(cursor => (
            <div
              key={cursor.userId}
              ref={el => cursorRefs.current.set(cursor.userId, el!)}
              className="cursor"
              style={{
                left: `${cursor.position.column * 8}px`,
                top: `${(cursor.position.line - 1) * 20}px`,
                borderColor: cursor.color
              }}
            >
              <div className="cursor-label" style={{ backgroundColor: cursor.color }}>
                {cursor.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 