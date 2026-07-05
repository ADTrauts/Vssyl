import toast from 'react-hot-toast';

/** Lightweight operator notifications — non-blocking, top-right. */
export function showOperatorToast(
  message: string,
  variant: 'success' | 'error' | 'warning' | 'info' = 'info',
): void {
  const options = { duration: 4500, position: 'top-right' as const };
  switch (variant) {
    case 'success':
      toast.success(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'warning':
      toast(message, { ...options, icon: '⚠️' });
      break;
    default:
      toast(message, options);
  }
}

export function showProbeToast(
  serviceName: string,
  ok: boolean,
  detail?: string,
): void {
  if (ok) {
    showOperatorToast(`${serviceName} probe succeeded${detail ? `: ${detail}` : ''}`, 'success');
  } else {
    showOperatorToast(`${serviceName} unavailable${detail ? ` — ${detail}` : ''}`, 'warning');
  }
}
