import React, { useRef } from 'react';
import useChatStore from '../../store/chatStore';

const ChatFAB = () => {
  const { isOpen, toggleChat } = useChatStore();
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
      onClick={toggleChat}
      onMouseMove={handleMouseMove}
      className="fixed bottom-6 right-6 z-50 p-0 rounded-full group outline-none transition-transform duration-300 hover:scale-105"
      aria-label="Open AI Chat"
    >
      {/* Dynamic Glow Effect */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle 50px at var(--x, 50%) var(--y, 50%), #d83dff 0%, transparent 100%)`,
          filter: 'blur(10px)',
          transform: 'scale(1.2)',
          zIndex: -1
        }}
      />

      {/* Button Content */}
      <div className="rounded-full shadow-lg group-hover:shadow-none transition-shadow duration-300 bg-[#1e1e1e]">
        <img
          src="/logo.png"
          alt="AI Chat"
          className="w-16 h-16 rounded-full object-cover relative z-10"
        />
      </div>
    </button>
  );
};

export default ChatFAB;
