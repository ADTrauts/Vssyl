'use client';

import React, { useState } from 'react';
import { Button, ConfirmModal } from 'shared/components';
import { X, Paperclip, Download, Trash2, ExternalLink } from 'lucide-react';
import type { TaskAttachment } from '@/api/todo';
import * as todoAPI from '@/api/todo';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface AttachmentViewerProps {
  attachments: TaskAttachment[];
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function AttachmentViewer({ attachments, taskId, isOpen, onClose, onRefresh }: AttachmentViewerProps) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [pendingAttachmentToDelete, setPendingAttachmentToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCloseViewer = () => {
    setPendingAttachmentToDelete(null);
    onClose();
  };

  const handleDelete = (attachmentId: string) => {
    if (!session?.accessToken || isDeleting) return;
    setPendingAttachmentToDelete(attachmentId);
  };

  const executeDeleteAttachment = async () => {
    const attachmentId = pendingAttachmentToDelete;
    if (!session?.accessToken || !attachmentId) return;

    setIsDeleting(attachmentId);
    try {
      await todoAPI.deleteTaskAttachment(session.accessToken, taskId, attachmentId);
      toast.success('Attachment deleted');
      if (onRefresh) {
        await onRefresh();
      }
      setPendingAttachmentToDelete(null);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Failed to delete attachment');
    } finally {
      setIsDeleting(null);
    }
  };

  const getFileIcon = (mimeType?: string | null) => {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('text/')) return '📝';
    return '📄';
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleCloseViewer}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Attachments ({attachments.length})
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCloseViewer}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {attachments.length === 0 ? (
              <div className="text-center py-12">
                <Paperclip className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No attachments</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">
                        {getFileIcon(attachment.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate mb-1">
                          {attachment.name}
                        </div>
                        {attachment.size && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {formatFileSize(attachment.size)}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {attachment.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachment.url || '', '_blank')}
                              className="h-7 px-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                          {attachment.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = attachment.url || '';
                                link.download = attachment.name;
                                link.click();
                              }}
                              className="h-7 px-2"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(attachment.id)}
                            disabled={isDeleting === attachment.id}
                            className="h-7 px-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={pendingAttachmentToDelete !== null}
        onClose={() => setPendingAttachmentToDelete(null)}
        onConfirm={executeDeleteAttachment}
        title="Delete attachment?"
        description="Are you sure you want to delete this attachment?"
        variant="destructive"
        confirmLabel="Delete"
        loading={
          pendingAttachmentToDelete !== null && isDeleting === pendingAttachmentToDelete
        }
      />
    </>
  );
}
