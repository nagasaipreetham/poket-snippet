import React, { useRef, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatFAB from '../Chat/ChatFAB';
import ChatInterface from '../Chat/ChatInterface';
import useChatStore from '../../store/chatStore';
import PocketCanvasButton from '../PocketCanvas/PocketCanvasButton';
import CanvasModal from '../PocketCanvas/CanvasModal';

const MainLayout = () => {
  const { isOpen } = useChatStore();
  const [chatWidth, setChatWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  // Animation state handles mount/unmount delay
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      // Delay unmount to allow slide-out animation to finish (300ms matches CSS duration)
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setChatWidth(newWidth);
      }
    }
  };

  // Global event listeners for smooth resizing without losing focus
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-text">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden relative">
        <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isOpen ? 'mr-0' : ''}`}>
          <Outlet />
        </main>

        {/* Resize Handle - Only visible when open AND NOT small screen */}
        {isOpen && !isSmallScreen && (
          <div
            className="w-1.5 hover:w-2 active:w-2 cursor-col-resize z-50 absolute top-0 bottom-0 flex items-center justify-center group touch-none"
            style={{ right: chatWidth - 3 }} // Positioned exactly at the edge
            onMouseDown={startResizing}
          >
            {/* Visual indicator line on hover/active */}
            <div className="w-0.5 h-full bg-transparent group-hover:bg-blue-500/50 bg-blue-500/0 transition-colors delay-75" />
          </div>
        )}

        {/* Chat Panel - Slides in or appears */}
        <div
          className={`border-l border-[#333] shadow-2xl z-40 bg-[#1e1e1e] overflow-hidden flex flex-col
            ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} 
            ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute right-0'}
            ${isSmallScreen && isOpen ? '!fixed !inset-0 !w-full !h-full' : ''}
          `}
          style={{ width: isSmallScreen ? '100%' : chatWidth }}
        >
          {shouldRender && <ChatInterface />}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <ChatFAB />
      <PocketCanvasButton />

      {/* Modals */}
      <CanvasModal />
    </div>
  );
};

export default MainLayout;
