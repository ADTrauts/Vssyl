import { toast } from 'react-hot-toast';

export function placeActionError(message: string, error?: unknown): void {
  const detail = error instanceof Error ? error.message : undefined;
  toast.error(detail ? `${message}: ${detail}` : message);
}

export function placeActionSuccess(message: string): void {
  toast.success(message);
}
