import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatFAB from '../Chat/ChatFAB';
import ChatInterface from '../Chat/ChatInterface';
import useChatStore from '../../store/chatStore';

const MainLayout = () => {
  const { isOpen } = useChatStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-text">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden relative">
        <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isOpen ? 'mr-0' : ''}`}>
          <Outlet />
        </main>

        {/* Chat Panel - Slides in or appears */}
        <div
          className={`transition-all duration-300 ease-in-out border-l border-[#333] shadow-2xl z-40 ${isOpen ? 'w-[450px] translate-x-0' : 'w-0 translate-x-full absolute right-0'
            }`}
        >
          <ChatInterface />
        </div>
      </div>
      <ChatFAB />
    </div>
  );
};

export default MainLayout;
