import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Clear All',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#0d1424] border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-800/40 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">{title}</h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
