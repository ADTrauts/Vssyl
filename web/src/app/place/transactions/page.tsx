'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner, Card } from 'shared/components';
import { getTransactions, getTransactionSummary, updateTransactionPrivacy } from '@/api/placeTransaction';
import type { PlaceTransactionData, TransactionSummary } from '@/api/placeTransaction';
import { ArrowLeft, ExternalLink, ShoppingBag, MousePointerClick, Eye, EyeOff, Receipt, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Purchase',
  EXTERNAL_CLICK: 'External Visit',
  RESERVATION: 'Reservation',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#16a34a',
  PENDING: '#ca8a04',
  FAILED: '#dc2626',
  REFUNDED: '#7c3aed',
  CANCELLED: '#6b7280',
};

export default function TransactionHistoryPage() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [transactions, setTransactions] = useState<PlaceTransactionData[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [txRes, sumRes] = await Promise.all([
        getTransactions({ limit: 50, type: filterType || undefined }, token),
        getTransactionSummary(token),
      ]);
      setTransactions(txRes.data);
      setTotal(txRes.pagination.total);
      setSummary(sumRes);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [token, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTogglePrivacy = async (tx: PlaceTransactionData) => {
    if (!token) return;
    try {
      await updateTransactionPrivacy(tx.id, !tx.isPrivate, token);
      setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, isPrivate: !t.isPrivate } : t));
    } catch { /* */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/place" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Transaction History</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Your interactions and purchases on Vssyl Place</p>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4 text-center">
              <Receipt className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalTransactions}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Interactions</p>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${summary.totalSpent.toFixed(2)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <ShoppingBag className="w-5 h-5 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.purchaseCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Purchases</p>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <MousePointerClick className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.externalClickCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">External Visits</p>
            </div>
          </Card>
        </div>
      )}

      {/* Top businesses */}
      {summary && summary.topBusinesses.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Most Visited</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {summary.topBusinesses.map(tb => (
                <div key={tb.business.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{tb.business.name}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{tb.interactionCount}x</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[null, 'PURCHASE', 'EXTERNAL_CLICK'].map(type => (
          <button
            key={type || 'all'}
            onClick={() => setFilterType(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterType === type
                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            {type === null ? 'All' : TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <div className="text-center py-16 text-gray-700 dark:text-gray-300">
          <Receipt className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-semibold">No transactions yet</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your purchases and interactions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">{total} transaction{total !== 1 ? 's' : ''}</p>
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:border-slate-600 transition-colors">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                tx.type === 'PURCHASE' ? 'bg-green-50' : tx.type === 'EXTERNAL_CLICK' ? 'bg-blue-50' : 'bg-purple-50'
              }`}>
                {tx.type === 'PURCHASE' ? (
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                ) : tx.type === 'EXTERNAL_CLICK' ? (
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                ) : (
                  <Receipt className="w-5 h-5 text-purple-600" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tx.business.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[tx.status]}15`, color: STATUS_COLORS[tx.status] }}>
                    {tx.status.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{tx.description || TYPE_LABELS[tx.type]}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {/* Amount */}
              {tx.amount && (
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">${tx.amount.toFixed(2)}</span>
              )}

              {/* Privacy toggle */}
              <button
                onClick={() => handleTogglePrivacy(tx)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 transition-colors"
                title={tx.isPrivate ? 'Private' : 'Visible'}
              >
                {tx.isPrivate ? <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
