"use client";

import React, { useState } from 'react';
import { LinkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { Modal } from './Modal';

type ShareLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: 'file' | 'folder';
  shareLink: string;
  email: string;
};

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemType,
  shareLink,
  email
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Share Link Generated"
      size="medium"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>{email}</strong> is not registered on Vssyl. A shareable link has been generated that you can send to them.
          </p>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{itemName}</span>
          <span className="text-gray-400"> ({itemType})</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Shareable Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md">
              <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none cursor-text"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <Button
              onClick={handleCopy}
              variant={copied ? 'secondary' : 'primary'}
              size="md"
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                'Copy'
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-md p-3">
          <p className="font-medium mb-1">What happens next?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Copy the link above</li>
            <li>Send it to {email} via email, message, or any other method</li>
            <li>They can access the {itemType} using this link</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-700 -mx-v-6 px-v-6 py-v-4 mt-v-4 -mb-v-6 bg-gray-50 dark:bg-slate-800 rounded-b-v-modal">
        <Button onClick={onClose} variant="secondary" size="md">
          Done
        </Button>
      </div>
    </Modal>
  );
};
