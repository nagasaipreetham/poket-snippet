import React from 'react';
import useChatStore from '../../store/chatStore';

const ChatFAB = () => {
  const { isOpen, toggleChat } = useChatStore();

  if (isOpen) return null;

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 p-0 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      aria-label="Open AI Chat"
    >
      <img
        src="/PS-AI.png"
        alt="AI Chat"
        className="w-16 h-16 rounded-full object-cover"
      />
    </button>
  );
};

export default ChatFAB;
