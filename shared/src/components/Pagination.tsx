"use client";

import React from 'react';

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export const Pagination: React.FC<PaginationProps> = ({ page, pageCount, onPageChange }) => {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1">
      <button
        className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Prev
      </button>
      {pages.map(p => (
        <button
          key={p}
          className={`px-2 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
      >
        Next
      </button>
    </div>
  );
}; 