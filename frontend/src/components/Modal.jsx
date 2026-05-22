import { useState } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, className = '' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl ${className}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-text-muted hover:text-text transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
