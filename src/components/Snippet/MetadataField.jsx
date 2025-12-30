import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

const MetadataField = ({
  title,
  content,
  onChange,
  onDelete,
  isCustom = false,
  onTitleChange,
  placeholder = "Content...",
  className = "",
  initialIsOpen = true,
  autoFocus = false,
  fontSize
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    // Immediate delete if empty
    if (!content || content.trim() === '') {
      onDelete();
    } else {
      // Confirm delete if has content
      setShowConfirm(true);
      // Ensure it's open so user sees what they are deleting? 
      // Actually specs say: "X button is replaced with Confirm Delete/Cancel". 
      // It doesn't explicitly say we must open it, but usually good UX. 
      // Let's just toggle the button state.
    }
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    onDelete();
    setShowConfirm(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className={`border border-border rounded-lg bg-surface overflow-hidden ${className}`}>
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          {isOpen ? <ChevronDown size={16} className="text-text-muted shrink-0" /> : <ChevronRight size={16} className="text-text-muted shrink-0" />}

          {isCustom && onTitleChange ? (
            <input
              value={title}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-sm text-white placeholder-text-muted min-w-0"
              placeholder="Field Title"
            />
          ) : (
            <span className="font-semibold text-sm text-text uppercase tracking-wide truncate">{title}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center ml-2">
          {(isCustom || onDelete) && (
            <>
              {showConfirm ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleConfirmDelete}
                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="text-text-muted hover:text-white text-[10px] uppercase font-bold px-2 py-1 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDeleteClick}
                  className="text-text-muted hover:text-red-500 p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-border bg-background">
          <textarea
            value={content || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ fontSize: fontSize ? `${fontSize}px` : undefined }}
            className={`w-full min-h-[100px] bg-transparent text-text font-mono resize-y outline-none border-none placeholder-text-muted/50 ${!fontSize ? 'text-sm' : ''}`}
            onClick={(e) => e.stopPropagation()}
            autoFocus={autoFocus}
          />
        </div>
      )}
    </div>
  );
};

export default MetadataField;
