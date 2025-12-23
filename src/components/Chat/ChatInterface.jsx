import React, { useRef, useEffect, useState } from 'react';
import { X, Send, ArrowDown, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useChatStore from '../../store/chatStore';
import { sendMessageToGemini } from '../../services/gemini';
import toast from 'react-hot-toast';

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md overflow-hidden my-2 border border-[#333] bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#333]">
        <span className="text-xs text-gray-400 font-sans">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem', lineHeight: '1.5' }}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatInterface = () => {
  const { isOpen, toggleChat, messages, addMessage, isLoading, setLoading } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setShowScrollButton(!isBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  /* Fix for initial height issue: ensure it resets properly */
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set new height based on content, clamped to max 200px
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);

      // If empty, force to minimum height to look like one line
      if (!inputValue) {
        textareaRef.current.style.height = '40px';
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        textareaRef.current.style.height = `${newHeight}px`;
        // Toggle scrollbar based on content height
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > 200 ? 'auto' : 'hidden';
      }
    }
  }, [inputValue]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
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

  // Custom Markdown Components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && match) {
        return (
          <CodeBlock language={language}>
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        );
      }

      return (
        <code className="bg-[#333] text-gray-200 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
          {children}
        </code>
      );
    },
    strong: ({ children }) => <strong className="font-bold text-gray-100">{children}</strong>, // 700 weight
    em: ({ children }) => <em className="italic font-light text-gray-300">{children}</em>, // 300 weight + italic
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#333] shadow-xl w-full overflow-hidden relative">
      {/* Added overflow-hidden to main container to prevent ghost elements when width is 0 */}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#252526]">
        <h2 className="text-white font-medium flex items-center gap-2 text-sm">
          <img src="/PS-AI.png" className="w-8 h-8 rounded-full" alt="AI" /> {/* Increased logo size */}
          AI Assistant
        </h2>
        <button
          onClick={toggleChat}
          className="p-1 hover:bg-[#333] rounded-md transition-colors text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 font-light text-xs leading-relaxed ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-[#252526] text-gray-200 rounded-bl-sm'
                }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none text-gray-200 font-light text-xs">
                  <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start w-full">
            <div className="w-full text-gray-400 pl-1 animate-pulse text-xs font-light">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Floating Style */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-10">
        {/* Scroll To Bottom Button */}
        <button
          onClick={scrollToBottom}
          disabled={!showScrollButton}
          className={`absolute -top-10 right-7 p-1.5 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center border border-[#333]
            ${showScrollButton
              ? 'bg-blue-600 text-white opacity-100 hover:bg-blue-700 translate-y-0 cursor-pointer'
              : 'bg-[#252526] text-gray-500 opacity-0 translate-y-2 cursor-default pointer-events-none'
            }`}
        >
          <ArrowDown size={16} />
        </button>

        <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-[#1e1e1e] rounded-2xl shadow-lg border border-[#333]">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 bg-transparent text-white rounded-2xl px-4 py-3 focus:outline-none transition-all placeholder-gray-500 pr-12 resize-none text-xs font-light custom-scrollbar leading-relaxed"
            style={{ maxHeight: '200px', minHeight: '42px' }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 bottom-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center h-8 w-8"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
