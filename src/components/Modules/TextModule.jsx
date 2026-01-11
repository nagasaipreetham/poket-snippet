import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const TextModule = ({ module, onUpdate, onAddNext, autoFocus }) => {
  const { user } = useAuth();
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [module.content, module.variant, module.bold, module.italic, module.isQuote, user?.settings?.textModuleFontSize]);

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

  // Compute styles based on module settings
  const getStyles = () => {
    let styles = {
      fontSize: `${user?.settings?.textModuleFontSize || 16}px`,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: 'inherit' // default text color
    };

    // Variant overrides (Headings)
    if (module.variant === 'h1') {
      styles.fontSize = '2.25rem'; // 36px
      styles.fontWeight = 'bold';
      styles.lineHeight = '1.2';
      styles.marginBottom = '0.5rem';
    } else if (module.variant === 'h2') {
      styles.fontSize = '1.75rem'; // 28px
      styles.fontWeight = 'bold';
      styles.lineHeight = '1.3';
      styles.marginBottom = '0.5rem';
    } else if (module.variant === 'h3') {
      styles.fontSize = '1.5rem'; // 24px
      styles.fontWeight = 'bold';
      styles.lineHeight = '1.4';
      styles.marginBottom = '0.5rem';
    }

    // Explicit Formatting Overrides
    if (module.bold) styles.fontWeight = 'bold';
    if (module.italic) styles.fontStyle = 'italic';

    // Decoration
    const decorations = [];
    if (module.underline) decorations.push('underline');
    if (module.strike) decorations.push('line-through');
    if (decorations.length > 0) styles.textDecoration = decorations.join(' ');

    return styles;
  };

  const getContainerClasses = () => {
    let classes = "group relative mb-2 flex items-center w-full transition-all duration-200";
    if (module.isQuote) {
      classes += " border-l-4 border-accent pl-4 italic bg-white/5 py-2 rounded-r-md";
    }
    return classes;
  };

  return (
    <div className={getContainerClasses()}>
      <textarea
        ref={textareaRef}
        value={module.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        onKeyDown={handleKeyDown}
        placeholder={module.variant?.startsWith('h') ? "Heading..." : "Type here..."}
        style={getStyles()}
        className={`w-full bg-transparent outline-none resize-none overflow-hidden leading-relaxed placeholder-white/20 py-1 ${module.variant?.startsWith('h') ? 'text-white' : 'text-text'}`}
        rows={1}
      />
    </div>
  );
};

export default TextModule;
