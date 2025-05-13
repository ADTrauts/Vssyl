import { formatFileSize } from '@/utils/format';

interface FileMessageProps {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileId: string;
}

export function FileMessage({ url, fileName, fileSize, fileType, fileId }: FileMessageProps) {
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');
  const isPDF = fileType === 'application/pdf';

  const getFileIcon = () => {
    if (isImage) return '🖼️';
    if (isVideo) return '🎥';
    if (isAudio) return '🎵';
    if (isPDF) return '📄';
    return '📎';
  };

  return (
    <div className="max-w-md bg-white rounded-lg shadow p-4">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{getFileIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(fileSize)}
          </p>
          <div className="mt-2 flex space-x-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download
            </a>
            {isImage && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 