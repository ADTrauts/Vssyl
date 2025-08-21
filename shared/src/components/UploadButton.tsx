import React from 'react';

type UploadButtonProps = {
  onFiles: (files: FileList) => void;
  label?: string;
  accept?: string;
};

export const UploadButton = React.forwardRef<HTMLInputElement, UploadButtonProps>(
  ({ onFiles, label = 'Upload', accept }, ref) => {
    return (
      <>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => (ref as React.MutableRefObject<HTMLInputElement | null>)?.current?.click()}
        >
          {label}
        </button>
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && onFiles(e.target.files)}
        />
      </>
    );
  }
);
UploadButton.displayName = 'UploadButton'; 