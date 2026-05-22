import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function DataTable({ columns = [], data = [], onRowClick, rowKey = 'id', emptyMessage = '暂无数据', className = '' }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th
                key={col.key || i}
                className={`px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-text' : ''}`}
                style={col.width ? { width: col.width } : {}}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.title}
                  {col.sortable && (
                    sortKey === col.key
                      ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
                      : <ChevronsUpDown size={14} className="opacity-30" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map(row => (
              <tr
                key={row[rowKey]}
                className={`border-b border-border/50 hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, i) => (
                  <td key={col.key || i} className="px-4 py-3 text-text">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
