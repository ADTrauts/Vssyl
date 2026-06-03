'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input } from 'shared/components';
import { Download, ExternalLink, FileText, FolderOpen, Link2, Unlink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as notebookLinksAPI from '@/api/notebookLinks';
import type { NotebookLinkItem } from '@/api/notebookLinks';
import { downloadFile } from '@/api/drive';
import { DriveFilePicker } from '@/components/todo/DriveFilePicker';
import {
  formatFileDate,
  formatFileSize,
  fileTypeLabel,
  getDriveFileOpenUrl,
} from '@/lib/notebookFileLinks';

interface NotebookLinkedFilesPanelProps {
  pageId: string;
  refreshKey?: number;
}

export function NotebookLinkedFilesPanel({ pageId, refreshKey = 0 }: NotebookLinkedFilesPanelProps) {
  const { data: session } = useSession();
  const [links, setLinks] = useState<NotebookLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileIdInput, setFileIdInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadLinks = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await notebookLinksAPI.getPageLinks(session.accessToken, pageId, {
        targetType: 'FILE',
      });
      setLinks(res.links);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, pageId]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks, refreshKey]);

  const linkFile = async (
    fileId: string,
    meta?: { name?: string; type?: string; size?: number }
  ) => {
    if (!session?.accessToken) return;
    setLinking(true);
    try {
      await notebookLinksAPI.createPageLink(session.accessToken, pageId, {
        targetType: 'FILE',
        targetId: fileId,
        relationshipType: 'REFERENCE',
        metadata: meta
          ? {
              fileName: meta.name,
              fileType: meta.type,
              fileSize: meta.size,
            }
          : undefined,
      });
      setFileIdInput('');
      toast.success('File linked');
      await loadLinks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to link file');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkById = () => {
    if (!fileIdInput.trim()) return;
    void linkFile(fileIdInput.trim());
  };

  const linkedFileIds = links.map((l) => l.targetId);

  return (
    <div className="flex flex-col min-h-0 border-t border-gray-200 dark:border-slate-700">
      <div className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
        <FileText className="w-3.5 h-3.5" />
        Linked files
      </div>

      <div className="px-2 pb-2 space-y-2 max-h-56 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
        ) : links.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No linked files. Browse Drive or paste a file ID below.
          </p>
        ) : (
          links.map((link) => {
            const restricted = link.targetAccessible === false || !link.target;
            const target = link.target;
            const openUrl =
              target?.id && !restricted
                ? getDriveFileOpenUrl(target.id, target.dashboardId)
                : null;

            return (
              <div
                key={link.id}
                className="rounded border border-gray-200 dark:border-slate-600 p-2 text-xs bg-gray-50 dark:bg-slate-900/50"
              >
                {restricted ? (
                  <p className="text-amber-600 dark:text-amber-400">
                    File unavailable, restricted, or in trash
                  </p>
                ) : (
                  <>
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {target?.name ?? link.targetId}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                      <span>{fileTypeLabel(target?.mimeType, target?.extension)}</span>
                      {target?.size != null && <span>{formatFileSize(target.size)}</span>}
                    </div>
                    {target?.ownerName && (
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {target.ownerName}
                      </div>
                    )}
                    {(target?.updatedAt || target?.createdAt) && (
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                        {target.updatedAt
                          ? `Updated ${formatFileDate(target.updatedAt)}`
                          : `Created ${formatFileDate(target.createdAt)}`}
                      </div>
                    )}
                    {target?.trashed && (
                      <div className="text-amber-600 dark:text-amber-400 mt-0.5">File in trash</div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap items-center">
                      {openUrl && (
                        <a
                          href={openUrl}
                          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 mr-0.5" />
                          Open in Drive
                        </a>
                      )}
                      {target?.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Download"
                          onClick={async () => {
                            if (!session?.accessToken) return;
                            try {
                              await downloadFile(session.accessToken, target.id);
                            } catch {
                              toast.error('Download failed');
                            }
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title="Unlink file"
                        onClick={async () => {
                          if (!session?.accessToken) return;
                          await notebookLinksAPI.archivePageLink(session.accessToken, link.id);
                          toast.success('File unlinked');
                          await loadLinks();
                        }}
                      >
                        <Unlink className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                )}
                {restricted && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    title="Unlink file"
                    onClick={async () => {
                      if (!session?.accessToken) return;
                      await notebookLinksAPI.archivePageLink(session.accessToken, link.id);
                      await loadLinks();
                    }}
                  >
                    <Unlink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full text-xs"
          onClick={() => setPickerOpen(true)}
          disabled={linking}
        >
          <FolderOpen className="w-3.5 h-3.5 mr-1 inline" />
          Browse Drive
        </Button>
        <div className="flex gap-1">
          <Input
            value={fileIdInput}
            onChange={(e) => setFileIdInput(e.target.value)}
            placeholder="Or file ID"
            className="flex-1 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleLinkById()}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLinkById}
            disabled={linking || !fileIdInput.trim()}
          >
            <Link2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <DriveFilePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeFileIds={linkedFileIds}
        onSelectFile={(fileId) => {
          void linkFile(fileId);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
