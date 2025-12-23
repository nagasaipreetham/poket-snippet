import React, { useRef, useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useChatStore from '../../store/chatStore';
import { sendMessageToGemini } from '../../services/gemini';
import toast from 'react-hot-toast';

const ChatInterface = () => {
  const { isOpen, toggleChat, messages, addMessage, isLoading, setLoading } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');

    // Add user message to store
    addMessage({ role: 'user', content: userMessageContent });
    setLoading(true);

    try {
      // Send to Gemini
      const response = await sendMessageToGemini(messages, userMessageContent);

      // Add AI response to store
      addMessage({ role: 'assistant', content: response });
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error(`AI Error: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#333] shadow-xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#252526]">
        <h2 className="text-white font-medium flex items-center gap-2">
          <img src="/PS-AI.png" className="w-6 h-6 rounded-full" alt="AI" />
          AI Assistant
        </h2>
        <button
          onClick={toggleChat}
          className="p-1 hover:bg-[#333] rounded-md transition-colors text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'w-full text-gray-200'
                }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
            {/* Timestamp/Status could go here */}
          </div>
        ))}

        {/* Separator line for AI responses if needed, though structure separates them enough */}

        {isLoading && (
          <div className="flex items-start w-full">
            <div className="w-full text-gray-400 pl-1 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#333] bg-[#252526]">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-[#1e1e1e] text-white border border-[#333] rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 pr-12"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
