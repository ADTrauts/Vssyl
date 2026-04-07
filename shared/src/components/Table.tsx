import React from 'react';

type TableProps<T> = {
  columns: { key: keyof T; label: string }[];
  data: T[];
};

export function Table<T extends object>({ columns, data }: TableProps<T>) {
  return (
    <table className="min-w-full border border-gray-200 dark:border-slate-700 rounded">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)} className="px-4 py-2 border-b bg-gray-50 dark:bg-slate-800 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="even:bg-gray-50 dark:bg-slate-800">
            {columns.map(col => (
              <td key={String(col.key)} className="px-4 py-2 border-b text-sm text-gray-800">
                {String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
} 