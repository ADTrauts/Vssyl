import { useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(
  onIntersect: () => Promise<void>,
  options: UseInfiniteScrollOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleIntersect = async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoading) {
        setIsLoading(true);
        try {
          await onIntersect();
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (targetRef.current) {
      observerRef.current = new IntersectionObserver(handleIntersect, {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px',
      });

      observerRef.current.observe(targetRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onIntersect, options.threshold, options.rootMargin, isLoading]);

  return {
    targetRef,
    isLoading,
  };
} 