import React, { useState, useRef, useEffect } from 'react';
import { Play, ChevronUp, ChevronDown, RefreshCw, Terminal, Check, Sparkles, MoreVertical } from 'lucide-react';
import CodeEditor from '../Editor/CodeEditor';

const CompilerInterface = () => {
  const [language, setLanguage] = useState('javascript');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false); // New state for expanding toolbar
  const [code, setCode] = useState('// Write your code here...');
  const [inputOpen, setInputOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState('output');

  const langPopupRef = useRef(null);
  const convertPopupRef = useRef(null);
  const langTriggerRef = useRef(null);
  const convertTriggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLangOpen && langPopupRef.current && !langPopupRef.current.contains(event.target) && !langTriggerRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
      if (isConvertOpen && convertPopupRef.current && !convertPopupRef.current.contains(event.target) && !convertTriggerRef.current.contains(event.target)) {
        setIsConvertOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangOpen, isConvertOpen]);


  const languages = [
    { id: 'javascript', name: 'JavaScript', color: '#F7DF1E', bg: 'rgba(247, 223, 30, 0.1)' },
    { id: 'python', name: 'Python', color: '#3776AB', bg: 'rgba(55, 118, 171, 0.1)' },
    { id: 'java', name: 'Java', color: '#E76F00', bg: 'rgba(231, 111, 0, 0.1)' },
    { id: 'cpp', name: 'C++', color: '#00599C', bg: 'rgba(0, 89, 156, 0.1)' },
    { id: 'c', name: 'C', color: '#A8B9CC', bg: 'rgba(168, 185, 204, 0.1)' },
    { id: 'go', name: 'Go', color: '#00ADD8', bg: 'rgba(0, 173, 216, 0.1)' },
    { id: 'rust', name: 'Rust', color: '#DEA584', bg: 'rgba(222, 165, 132, 0.1)' },
  ];

  const handleBottomTabClick = (tab) => {
    if (tab === activeBottomTab) {
      if (tab === 'input') setInputOpen(!inputOpen);
      if (tab === 'output') setOutputOpen(!outputOpen);
    } else {
      setActiveBottomTab(tab);
      if (tab === 'input') {
        setInputOpen(true);
        setOutputOpen(false);
      } else {
        setOutputOpen(true);
        setInputOpen(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] w-full overflow-hidden relative">
      {/* Compiler Header / Toolbar */}
      <div className={`flex flex-col border-b border-[#333] bg-[#252526] transition-all duration-300 ${isToolbarExpanded ? 'pb-2' : ''}`}>
        <div className="flex items-center justify-between p-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              ref={langTriggerRef}
              onClick={() => { setIsLangOpen(!isLangOpen); setIsConvertOpen(false); }}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#333] hover:bg-[#3e3e3e] rounded-full text-gray-200 text-xs transition-colors border-2 border-[#444]"
            >
              <span className="font-mono" style={{ color: languages.find(l => l.id === language)?.color }}>
                {languages.find(l => l.id === language)?.name}
              </span>
              <ChevronDown size={14} />
            </button>
            {/* Language Popup Removed from here */}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 relative">
            {/* More Button to Toggle Toolbar Expansion */}
            <button
              onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
              className={`p-1.5 rounded-full border-2 transition-all ${isToolbarExpanded ? 'bg-[#333] border-[#555] text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-[#333]'}`}
            >
              <ChevronDown size={14} className={`transition-transform duration-300 ${isToolbarExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Convert Popup Trigger */}
            <button
              ref={convertTriggerRef}
              onClick={() => { setIsConvertOpen(!isConvertOpen); setIsLangOpen(false); }}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#1e1e1e] border-2 border-blue-500/30 hover:bg-blue-500/10 text-blue-400 rounded-full text-xs transition-all font-medium"
            >
              <Terminal size={12} />
              Convert
            </button>
            {/* Convert Popup Removed from here */}

            <button className="px-6 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center gap-2 text-xs transition-colors font-medium shadow-sm border-2 border-transparent">
              <Play size={12} fill="currentColor" />
              Run
            </button>
          </div>
        </div>

        {/* Expanded Toolbar (Auto Complete) */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out px-3 flex justify-end gap-3 ${isToolbarExpanded ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
          <button
            className="flex items-center gap-2 px-4 py-1.5 bg-[#1e1e1e] border-2 border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-500 rounded-full text-xs transition-all font-medium"
          >
            <Sparkles size={12} />
            Auto Complete
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
        <CodeEditor
          language={language}
          value={code}
          onChange={(newCode) => setCode(newCode || '')}
          theme="vs-dark"
        />
      </div>

      {/* Bottom Panel (Input/Output) */}
      <div className={`border-t border-[#333] bg-[#252526] flex flex-col transition-all duration-300 ease-in-out ${(activeBottomTab === 'input' && inputOpen) || (activeBottomTab === 'output' && outputOpen) ? 'h-48' : 'h-8'
        }`}>
        {/* Tabs */}
        <div className="flex items-center border-b border-[#333] h-8 shrink-0">
          <button
            onClick={() => handleBottomTabClick('input')}
            className={`flex items-center gap-2 px-4 h-full text-xs font-medium border-r border-[#333] transition-colors ${activeBottomTab === 'input' ? 'bg-[#1e1e1e] text-white border-b-2 border-b-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2c]'}`}
          >
            Input
            {activeBottomTab === 'input' && (inputOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
          </button>
          <button
            onClick={() => handleBottomTabClick('output')}
            className={`flex items-center gap-2 px-4 h-full text-xs font-medium border-r border-[#333] transition-colors ${activeBottomTab === 'output' ? 'bg-[#1e1e1e] text-white border-b-2 border-b-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2c]'}`}
          >
            Output
            {activeBottomTab === 'output' && (outputOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeBottomTab === 'input' && (
            <textarea
              className="w-full h-full bg-[#1e1e1e] text-gray-300 p-3 font-mono text-xs focus:outline-none resize-none"
              placeholder="Enter input here..."
            />
          )}
          {activeBottomTab === 'output' && (
            <div className="w-full h-full bg-[#1e1e1e] text-gray-300 p-3 font-mono text-xs overflow-auto">
              {/* Placeholder output */}
              <span className="text-gray-500 italic">No output yet. Run the code to see results.</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Language Popup - 80% Width */}
      {isLangOpen && (
        <div ref={langPopupRef} className="absolute top-[80px] left-[10%] w-[80%] z-50 bg-[#252526] border border-[#333] rounded-xl shadow-2xl p-4">
          <div className="flex flex-wrap gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
            {languages.map(lang => (
              <button
                key={lang.id}
                onClick={() => {
                  setLanguage(lang.id);
                  setIsLangOpen(false);
                }}
                style={{
                  borderColor: lang.color,
                  color: lang.color,
                  backgroundColor: lang.bg
                }}
                className={`flex-auto px-4 py-2 rounded-full text-xs font-medium border-2 hover:opacity-80 transition-opacity flex items-center justify-center gap-1 min-w-[100px]
                            ${language === lang.id ? 'ring-2 ring-offset-1 ring-offset-[#1e1e1e]' : ''} `}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Convert Popup - 80% Width */}
      {isConvertOpen && (
        <div ref={convertPopupRef} className="absolute top-[80px] left-[10%] w-[80%] z-50 bg-[#252526] border border-[#333] rounded-xl shadow-2xl p-4 flex flex-col gap-4">
          <div className="text-gray-400 text-sm font-medium">Convert code to:</div>
          <div className="flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
            {languages.map(lang => (
              <button
                key={lang.id}
                style={{
                  borderColor: lang.color,
                  color: lang.color,
                  backgroundColor: lang.bg
                }}
                className="flex-auto px-4 py-2 rounded-full text-xs font-medium border-2 hover:opacity-80 transition-opacity flex items-center justify-center min-w-[100px]"
              >
                {lang.name}
              </button>
            ))}
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium self-end flex items-center gap-2">
            <RefreshCw size={14} />
            Convert Code
          </button>
        </div>
      )}
    </div>
  );
};

export default CompilerInterface;
