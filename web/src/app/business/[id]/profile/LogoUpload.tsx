'use client';

import { useRef, useState } from 'react';
import { Card, Button, Avatar, Spinner, Toast } from 'shared/components';

interface LogoUploadProps {
  currentLogo?: string;
  businessName: string;
  onUpload: (logoUrl: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: () => Promise<{ success: boolean; error?: string }>;
  canEdit: boolean;
}

export function LogoUpload({ currentLogo, businessName, onUpload, onRemove, canEdit }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Simulate upload to a storage service and return a URL
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // TODO: Replace with real upload logic
      const fakeUrl = URL.createObjectURL(file);
      const result = await onUpload(fakeUrl);
      if (result.success) {
        setToast({ type: 'success', message: 'Logo uploaded successfully!' });
      } else {
        setToast({ type: 'error', message: result.error || 'Failed to upload logo' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const result = await onRemove();
      if (result.success) {
        setToast({ type: 'success', message: 'Logo removed successfully!' });
      } else {
        setToast({ type: 'error', message: result.error || 'Failed to remove logo' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Logo</h2>
        <Avatar src={currentLogo} alt={businessName} size={80} nameOrEmail={businessName} />
        {canEdit ? (
          <div className="mt-4 flex flex-col items-center gap-2 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? <Spinner size={16} /> : 'Upload Logo'}
            </Button>
            {currentLogo && (
              <Button
                variant="secondary"
                onClick={handleRemove}
                disabled={removing}
                className="w-full"
              >
                {removing ? <Spinner size={16} /> : 'Remove Logo'}
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-4 text-gray-500 text-sm text-center">
            You don't have permission to change the logo.
          </div>
        )}
      </div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          open={true}
          onClose={() => setToast(null)}
        />
      )}
    </Card>
  );
} 