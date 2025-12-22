import React, { useRef, useEffect } from 'react';

const TextModule = ({ module, onUpdate, onAddNext, autoFocus }) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [module.content]);

  // Handle focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddNext();
    }
  };

  return (
    <div className="group relative mb-2 flex items-center">
      <textarea
        ref={textareaRef}
        value={module.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        onKeyDown={handleKeyDown}
        placeholder="Type here..."
        className="w-full bg-transparent text-text outline-none resize-none overflow-hidden text-base leading-relaxed placeholder-white/20 py-1"
        rows={1}
      />
    </div>
  );
};

export default TextModule;
