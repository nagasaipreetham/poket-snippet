import React, { useRef } from 'react';
import usePocketCanvasStore from '../../store/pocketCanvasStore';
import { Palette } from 'lucide-react';

const PocketCanvasButton = ({ chatSidebarOpen, chatWidth }) => {
  const { isOpen, toggleCanvas } = usePocketCanvasStore();
  const buttonRef = useRef(null);

  if (isOpen) return null;

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    buttonRef.current.style.setProperty('--x', `${x}px`);
    buttonRef.current.style.setProperty('--y', `${y}px`);
  };

  // Use transform for smoother sync with sidebar animation
  // If sidebar is open, move left by the width of the sidebar.
  // Otherwise, no translation (stay at right: 24px).
  const translation = chatSidebarOpen ? chatWidth : 0;

  return (
    <div
      className="fixed top-6 right-6 z-50 transition-transform duration-300 ease-in-out"
      style={{
        transform: `translateX(-${translation}px)`,
        // We use a wrapper for the position transition so it doesn't conflict with hover scales
      }}
    >
      <button
        ref={buttonRef}
        onClick={toggleCanvas}
        onMouseMove={handleMouseMove}
        className="relative group outline-none transition-transform duration-300 hover:scale-105"
        aria-label="Open Pocket Canvas"
      >
        {/* 1. Behind: Dynamic Glow Effect (z-index -1) */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle 40px at var(--x, 50%) var(--y, 50%), #D83DFF 0%, transparent 100%)`, // Lavender glow
            filter: 'blur(8px)',
            transform: 'scale(1.2)', // Slightly larger to be visible behind
            zIndex: -1
          }}
        />

        {/* 2. Middle: White Background Surface (z-index 0) */}
        <div className="bg-white border border-gray-200 shadow-lg rounded-full p-2.5 relative z-0 flex items-center justify-center">
          {/* 3. Front: Icon (inherits z-index context likely, but visually on top of white bg) */}
          <Palette size={20} className="text-black transition-colors" />
        </div>
      </button>
    </div>
  );
};

export default PocketCanvasButton;
