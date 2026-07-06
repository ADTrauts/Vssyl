'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'shared/components';
import {
  submitTeachVssyl,
  type TeachClassification,
  type TeachVssylSubmitResult,
} from '../../api/teachVssyl';

export interface TeachVssylModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  conversationId?: string;
  initialText?: string;
  title?: string;
}

const CLASSIFICATIONS: { id: TeachClassification; label: string }[] = [
  { id: 'fact', label: 'Fact' },
  { id: 'preference', label: 'Preference' },
  { id: 'vocabulary', label: 'Vocabulary' },
];

export default function TeachVssylModal({
  isOpen,
  onClose,
  token,
  conversationId,
  initialText = '',
  title = 'Teach Vssyl',
}: TeachVssylModalProps) {
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [classification, setClassification] = useState<TeachClassification>('fact');
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState<TeachVssylSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setText(initialText);
      setClassification('fact');
      setResult(null);
      setError(null);
    }
  }, [isOpen, initialText]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const saved = await submitTeachVssyl(token, {
        classification,
        text,
        conversationId,
      });
      setResult(saved);
      setStep('confirmation');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={title} size="medium">
      {step === 'form' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            What should Vssyl know for future conversations?
          </p>

          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Type</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Knowledge type">
              {CLASSIFICATIONS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  role="radio"
                  aria-checked={classification === chip.id}
                  onClick={() => setClassification(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    classification === chip.id
                      ? 'border-purple-600 bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-500'
                      : 'border-gray-300 text-gray-700 dark:border-slate-600 dark:text-gray-300'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="teach-vssyl-text" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Your teaching
            </label>
            <textarea
              id="teach-vssyl-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="e.g. My favorite dashboard is Operations"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !text.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">✓ Vssyl learned this.</p>
          <dl className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
            <div className="flex gap-2">
              <dt className="font-medium min-w-[5.5rem]">Scope:</dt>
              <dd>Personal</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium min-w-[5.5rem]">Stored as:</dt>
              <dd>{result?.storageLabel ?? 'Fact'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium min-w-[5.5rem]">Effect:</dt>
              <dd>Will influence future conversations.</dd>
            </div>
          </dl>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
