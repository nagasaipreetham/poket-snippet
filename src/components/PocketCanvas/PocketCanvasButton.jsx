import React, { useRef } from 'react';
import usePocketCanvasStore from '../../store/pocketCanvasStore';
import { Palette } from 'lucide-react';

const PocketCanvasButton = () => {
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

  return (
    <button
      ref={buttonRef}
      onClick={toggleCanvas}
      onMouseMove={handleMouseMove}
      className="fixed top-6 right-6 z-50 p-2.5 rounded-full group outline-none transition-transform duration-300 hover:scale-105 bg-[#1e1e1e] border border-[#333] shadow-lg flex items-center justify-center"
      aria-label="Open Pocket Canvas"
    >
      {/* Dynamic Glow Effect */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle 40px at var(--x, 50%) var(--y, 50%), #D83DFF 0%, transparent 100%)`, // Lavender glow
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
          zIndex: -1
        }}
      />

      <Palette size={20} className="text-white transition-colors" />
    </button>
  );
};

export default PocketCanvasButton;
