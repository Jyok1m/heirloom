import { useEffect } from 'react';

// Per-route document title for tab/history/bookmark UX. Crawlers index the
// static index.html title; this keeps the live tab title meaningful.
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Heirloom` : 'Heirloom';
    return () => {
      document.title = 'Heirloom';
    };
  }, [title]);
}
