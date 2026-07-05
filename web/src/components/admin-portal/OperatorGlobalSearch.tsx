'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, User, Package, MessageSquare, CreditCard, Settings, Loader2 } from 'lucide-react';
import { adminApiService } from '../../lib/adminApiService';

interface SearchResult {
  type: string;
  id: string;
  label: string;
  subtitle?: string;
  href: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  business: Building2,
  user: User,
  module: Package,
  ticket: MessageSquare,
  subscription: CreditCard,
  setting: Settings,
};

export function OperatorGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await adminApiService.searchOperatorConsole(q);
      if (res.error) {
        setResults([]);
        return;
      }
      const payload = res.data as { results?: SearchResult[] };
      setResults(payload?.results ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-v-text-muted" />
        <input
          type="search"
          placeholder="Search businesses, users, modules…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-v-border bg-v-surface text-v-text-primary placeholder:text-v-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Global operator search"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-v-text-muted" />
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-v-border bg-v-surface shadow-lg">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-sm text-v-text-muted">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            <ul>
              {results.map((r) => {
                const Icon = TYPE_ICONS[r.type] ?? Search;
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => navigate(r.href)}
                      className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-v-surface-muted transition-colors"
                    >
                      <Icon className="w-4 h-4 mt-0.5 text-v-text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-v-text-primary truncate">{r.label}</p>
                        {r.subtitle ? (
                          <p className="text-xs text-v-text-muted truncate">{r.subtitle}</p>
                        ) : null}
                        <p className="text-xs text-blue-500 capitalize">{r.type}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
