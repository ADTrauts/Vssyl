'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from 'shared/components';

export interface DriveCreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void | Promise<void>;
  loading?: boolean;
}

export function DriveCreateFolderModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: DriveCreateFolderModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      const frameId = requestAnimationFrame(() => {
        document.getElementById('drive-create-folder-name')?.focus();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [open]);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    await onSubmit(trimmed);
  };

  return (
    <Modal open={open} onClose={onClose} title="New folder" size="small">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="drive-create-folder-name"
          className="block text-sm font-medium text-v-text-primary mb-v-2"
        >
          Folder name
        </label>
        <Input
          id="drive-create-folder-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled folder"
          disabled={loading}
          autoComplete="off"
          className="w-full"
        />
        <div className="mt-v-4 flex justify-end gap-v-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isValid || loading}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
