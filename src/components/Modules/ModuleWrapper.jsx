import React, { useRef, useState, useEffect } from 'react';
import { Plus, Hand } from 'lucide-react';
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
  scrollContainerRef, // Added prop
  children
}) => {
  const controls = useDragControls();
  const [isHovered, setIsHovered] = useState(false);
  const [isHandPressed, setIsHandPressed] = useState(false);
  const [isSelfDragging, setIsSelfDragging] = useState(false);
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

  // Controls Visibility Logic
  const showControls = (isHovered && !isDragging) || isSelfDragging;

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
        zIndex: 1,
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
              controls.start(e);
              e.preventDefault();
            }}
            className={`p-1.5 text-text-muted hover:text-white cursor-grab active:cursor-grabbing rounded transition-colors touch-none ${isHandPressed ? 'text-accent' : ''}`}
            title="Drag to Reorder"
            style={{ touchAction: 'none' }}
          >
            <Hand size={18} className={isHandPressed ? "scale-90" : ""} />
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
