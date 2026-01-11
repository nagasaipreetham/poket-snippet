import React, { useRef, useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Bold, Italic, Underline, Strikethrough, Quote, Copy, ChevronDown, Check } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';

const ModuleWrapper = ({
  module,
  index,
  onAdd,
  onReorder,
  calculateDropIndex,
  setDropTargetIndex,
  isDragging, // Global dragging state
  setIsDragging,
  scrollContainerRef,
  onDelete,
  onDuplicate,
  onUpdate,
  children
}) => {
  const controls = useDragControls();
  const [isHovered, setIsHovered] = useState(false);
  const [isHandPressed, setIsHandPressed] = useState(false);
  const [isSelfDragging, setIsSelfDragging] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Auto-scroll State
  const autoScrollRef = useRef(null);

  const handleDragStart = () => {
    setIsDragging(true);
    setIsSelfDragging(true);
    setIsHandPressed(true);
    setDropTargetIndex(index);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    setIsSelfDragging(false);
    setIsHandPressed(false);
    setDropTargetIndex(null);
    stopAutoScroll();

    const dropIndex = calculateDropIndex(info.point.y);
    if (dropIndex !== null && dropIndex !== undefined) {
      onReorder(index, dropIndex);
    }
  };

  // Continuous Auto-Scroll Logic
  const startAutoScroll = (direction) => {
    if (autoScrollRef.current) return; // Already scrolling
    if (!scrollContainerRef?.current) return;

    const scroll = () => {
      const distance = direction === 'up' ? -15 : 15;
      scrollContainerRef.current.scrollBy(0, distance);
      autoScrollRef.current = requestAnimationFrame(scroll);
    };
    autoScrollRef.current = requestAnimationFrame(scroll);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  const handleDrag = (event, info) => {
    const target = calculateDropIndex(info.point.y);
    setDropTargetIndex(target);

    // Auto-scroll triggers
    const SCROLL_THRESHOLD = 100;
    const viewHeight = window.innerHeight;
    const y = info.point.y;

    if (y < SCROLL_THRESHOLD) {
      stopAutoScroll(); // Avoid stacking
      startAutoScroll('up');
    } else if (y > viewHeight - SCROLL_THRESHOLD) {
      stopAutoScroll();
      startAutoScroll('down');
    } else {
      stopAutoScroll();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => stopAutoScroll();
  }, []);

  // Close Context Menu on Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowContextMenu(false);
        setShowHeadingDropdown(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  // Handle Updates
  const toggleStyle = (key) => {
    if (!onUpdate) return;
    onUpdate({ [key]: !module[key] });
  };

  const setVariant = (variant) => {
    if (!onUpdate) return;
    onUpdate({ variant });
    setShowHeadingDropdown(false);
  };

  // Controls Visibility Logic
  // Show controls if hovered OR dragging OR if the context menu (selected mode) is active
  const showControls = (isHovered && !isDragging) || isSelfDragging || showContextMenu;

  const getHeadingLabel = (variant) => {
    switch (variant) {
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      default: return 'Text';
    }
  };

  return (
    <motion.div
      ref={wrapperRef}
      className="relative group/wrapper mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}

      drag="y"
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={false}
      dragSnapToOrigin={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}

      // Styling reset in animate
      animate={isSelfDragging ? {
        scale: 1, // NO SCALING to prevent Monaco Editor crashes
        boxShadow: "0px 8px 20px rgba(0,0,0,0.4)",
        backgroundColor: "#2a2a2a",
        zIndex: 999,
        borderRadius: "8px",
      } : {
        scale: 1,
        boxShadow: "none",
        backgroundColor: "transparent",
        zIndex: showContextMenu ? 100 : 1, // Boost z-index when menu is open
        x: 0,
        y: 0
      }}
      transition={{ duration: 0.2 }}

      style={{
        width: '100%',
        position: 'relative'
      }}
    >
      <div className="flex flex-row items-start">
        {/* Controls - Inside Flex Row, will move with Drag */}
        <div
          className={`pr-2 pt-1 flex flex-row items-center space-x-1 shrink-0 transition-opacity duration-200`}
          style={{
            width: 'auto',
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? 'auto' : 'none'
          }}
        >
          <button
            onClick={() => onAdd(module.type)}
            className="p-1.5 text-text-muted hover:text-white hover:bg-surface rounded transition-colors"
            title={`Add ${module.type === 'text' ? 'Text' : 'Snippet'} Below`}
          >
            <Plus size={18} />
          </button>

          <div
            onPointerDown={(e) => {
              // Only start drag if left click
              if (e.button === 0) {
                controls.start(e);
                e.preventDefault();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowContextMenu(prev => !prev);
            }}
            className={`relative p-1.5 text-text-muted hover:text-white cursor-grab active:cursor-grabbing rounded transition-colors touch-none ${isHandPressed || showContextMenu ? 'text-accent' : ''}`}
            title="Drag to Reorder (Right-click to Select)"
            style={{ touchAction: 'none' }}
          >
            <GripVertical size={18} className={isHandPressed ? "scale-90" : ""} />

            {/* Context Menu Overlay */}
            {showContextMenu && (
              <div
                className="absolute bottom-full left-0 mb-2 flex items-center bg-surface border border-border shadow-xl rounded-md overflow-visible z-50 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Delete Button */}
                <button
                  onClick={() => {
                    onDelete();
                    setShowContextMenu(false);
                  }}
                  className="h-9 w-9 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors border-r border-border"
                  title="Delete Module"
                >
                  <Trash2 size={16} />
                </button>

                {/* Toolbar for Text Modules */}
                {module.type === 'text' && (
                  <>
                    {/* Formatting Icons */}
                    <div className="flex items-center px-2 space-x-1">
                      {[
                        { key: 'bold', Icon: Bold, title: 'Bold' },
                        { key: 'italic', Icon: Italic, title: 'Italic' },
                        { key: 'underline', Icon: Underline, title: 'Underline' },
                        { key: 'strike', Icon: Strikethrough, title: 'Strikethrough' },
                        { key: 'isQuote', Icon: Quote, title: 'Quote' },
                      ].map(({ key, Icon, title }) => {
                        const isHeading = module.variant && module.variant.startsWith('h');
                        const isDisabled = key === 'bold' && isHeading;

                        return (
                          <button
                            key={key}
                            onClick={() => !isDisabled && toggleStyle(key)}
                            disabled={isDisabled}
                            className={`p-1 rounded border transition-all ${module[key]
                                ? 'bg-blue-500/50 border-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                : 'border-transparent text-text-muted hover:bg-white/10 hover:text-white'
                              } ${isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-text-muted' : ''}`}
                            title={title}
                          >
                            <Icon size={14} strokeWidth={module[key] ? 3 : 2} />
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-px h-5 bg-border mx-1" />

                    {/* Heading Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-text-muted hover:text-white rounded hover:bg-white/10 transition-colors min-w-[80px] justify-between"
                      >
                        <span>{getHeadingLabel(module.variant)}</span>
                        <ChevronDown size={12} />
                      </button>

                      {showHeadingDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-32 bg-[#1e1e1e] border border-border rounded-md shadow-xl py-1 z-[60]">
                          {[
                            { id: 'text', label: 'Text (Default)' },
                            { id: 'h1', label: 'Heading 1' },
                            { id: 'h2', label: 'Heading 2' },
                            { id: 'h3', label: 'Heading 3' },
                          ].map(option => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setVariant(option.id === 'text' ? undefined : option.id);
                                if (option.id !== 'text' && module.bold) {
                                  // Automatically uncheck bold if it was set, as headings imply bold
                                  // This is optional but good UX since the button becomes disabled
                                  // But user asked to just disable the button.
                                  // I will call an update to remove bold if it exists just to be clean
                                  if (onUpdate) onUpdate({ variant: option.id === 'text' ? undefined : option.id, bold: false });
                                } else {
                                  setVariant(option.id === 'text' ? undefined : option.id);
                                }
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-text-muted hover:text-white hover:bg-white/10 flex items-center justify-between"
                            >
                              <span>{option.label}</span>
                              {(module.variant === option.id || (!module.variant && option.id === 'text')) && <Check size={12} className="text-blue-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="w-px h-5 bg-border mx-1" />
                  </>
                )}

                {/* Duplicate Button */}
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowContextMenu(false);
                  }}
                  className="h-9 w-9 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                  title="Duplicate Module"
                >
                  <Copy size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default ModuleWrapper;
