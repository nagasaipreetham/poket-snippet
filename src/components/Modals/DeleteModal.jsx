import React from 'react';
import { File, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onConfirm, itemsToDelete, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-[400px] flex flex-col overflow-hidden ring-1 ring-white/10">

        {/* Header */}
        <div className="p-6 text-center border-b border-white/5">
          <h2 className="text-xl font-bold text-white mb-2">By confirming</h2>
          <p className="text-text-muted text-sm">you will delete all the files below</p>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 max-h-[300px] overflow-y-auto p-4 space-y-2 bg-surface/30">
          {itemsToDelete.length === 0 ? (
            <div className="text-center text-text-muted italic text-xs py-4">No files found within</div>
          ) : (
            itemsToDelete.map(item => (
              <div key={item.id} className="flex items-center space-x-3 p-2 rounded bg-background border border-border/50">
                <File size={16} className="text-text-muted shrink-0" />
                <span className="text-sm text-text truncate">{item.name}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-background border-t border-white/5 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-text-muted hover:text-white hover:bg-surface transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 transition-colors flex items-center space-x-2 text-sm font-bold"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeleteModal;
