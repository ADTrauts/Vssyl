import React from 'react';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProgressProps {
  fileName: string;
  progress: number;
  onCancel?: () => void;
  className?: string;
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  fileName,
  progress,
  onCancel,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 rounded-md bg-muted p-2', className)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{fileName}</span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
      {onCancel && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}; 