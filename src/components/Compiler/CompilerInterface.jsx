import React, { useState, useRef, useEffect } from 'react';
import { Play, ChevronUp, ChevronDown, RefreshCw, Terminal, Check, Sparkles, MoreVertical } from 'lucide-react';
import CodeEditor from '../Editor/CodeEditor';
import { runCode } from '../../services/compilerService';
import useCompilerStore from '../../store/compilerStore';
import { GoogleGenAI } from "@google/genai";
import toast from 'react-hot-toast';

const CompilerInterface = () => {
  const [language, setLanguage] = useState('javascript');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const { code, setCode } = useCompilerStore();
  const [input, setInput] = useState(''); // State for stdin
  const [inputOpen, setInputOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState('output');
  const [bottomHeight, setBottomHeight] = useState(200);
  const [isDragging, setIsDragging] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

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

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setBottomHeight((prev) => {
        const newHeight = prev - e.movementY;
        return Math.min(Math.max(newHeight, 100), 800);
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);


  const languages = [
    { id: 'assembly', name: 'Assembly', color: '#6E4C13', bg: 'rgba(110, 76, 19, 0.1)' },
    { id: 'bash', name: 'Bash', color: '#4EAA25', bg: 'rgba(78, 170, 37, 0.1)' },
    { id: 'basic', name: 'Basic', color: '#1e3a8a', bg: 'rgba(30, 58, 138, 0.1)' },
    { id: 'c', name: 'C', color: '#A8B9CC', bg: 'rgba(168, 185, 204, 0.1)' },
    { id: 'cpp', name: 'C++', color: '#00599C', bg: 'rgba(0, 89, 156, 0.1)' },
    { id: 'clojure', name: 'Clojure', color: '#5881D8', bg: 'rgba(88, 129, 216, 0.1)' },
    { id: 'csharp', name: 'C#', color: '#178600', bg: 'rgba(23, 134, 0, 0.1)' },
    { id: 'cobol', name: 'COBOL', color: '#1e3a8a', bg: 'rgba(30, 58, 138, 0.1)' },
    { id: 'lisp', name: 'Lisp', color: '#3E3E3E', bg: 'rgba(62, 62, 62, 0.1)' },
    { id: 'd', name: 'D', color: '#Ba595e', bg: 'rgba(186, 89, 94, 0.1)' },
    { id: 'elixir', name: 'Elixir', color: '#6e4a7e', bg: 'rgba(110, 74, 126, 0.1)' },
    { id: 'erlang', name: 'Erlang', color: '#B83998', bg: 'rgba(184, 57, 152, 0.1)' },
    { id: 'fsharp', name: 'F#', color: '#B845FC', bg: 'rgba(184, 69, 252, 0.1)' },
    { id: 'fortran', name: 'Fortran', color: '#4d41b1', bg: 'rgba(77, 65, 177, 0.1)' },
    { id: 'go', name: 'Go', color: '#00ADD8', bg: 'rgba(0, 173, 216, 0.1)' },
    { id: 'groovy', name: 'Groovy', color: '#4298b8', bg: 'rgba(66, 152, 184, 0.1)' },
    { id: 'haskell', name: 'Haskell', color: '#5e5086', bg: 'rgba(94, 80, 134, 0.1)' },
    { id: 'java', name: 'Java', color: '#E76F00', bg: 'rgba(231, 111, 0, 0.1)' },
    { id: 'javascript', name: 'JavaScript', color: '#F7DF1E', bg: 'rgba(247, 223, 30, 0.1)' },
    { id: 'kotlin', name: 'Kotlin', color: '#F18E33', bg: 'rgba(241, 142, 51, 0.1)' },
    { id: 'lua', name: 'Lua', color: '#000080', bg: 'rgba(0, 0, 128, 0.1)' },
    { id: 'objectivec', name: 'Objective-C', color: '#438eff', bg: 'rgba(67, 142, 255, 0.1)' },
    { id: 'ocaml', name: 'OCaml', color: '#3be133', bg: 'rgba(59, 225, 51, 0.1)' },
    { id: 'octave', name: 'Octave', color: '#d35f5f', bg: 'rgba(211, 95, 95, 0.1)' },
    { id: 'pascal', name: 'Pascal', color: '#E3F171', bg: 'rgba(227, 241, 113, 0.1)' },
    { id: 'perl', name: 'Perl', color: '#0298c3', bg: 'rgba(2, 152, 195, 0.1)' },
    { id: 'php', name: 'PHP', color: '#4F5D95', bg: 'rgba(79, 93, 149, 0.1)' },
    { id: 'plaintext', name: 'Plain Text', color: '#888888', bg: 'rgba(136, 136, 136, 0.1)' },
    { id: 'prolog', name: 'Prolog', color: '#74283c', bg: 'rgba(116, 40, 60, 0.1)' },
    { id: 'python', name: 'Python', color: '#3776AB', bg: 'rgba(55, 118, 171, 0.1)' },
    { id: 'r', name: 'R', color: '#198CE7', bg: 'rgba(25, 140, 231, 0.1)' },
    { id: 'ruby', name: 'Ruby', color: '#CC342D', bg: 'rgba(204, 52, 45, 0.1)' },
    { id: 'rust', name: 'Rust', color: '#DEA584', bg: 'rgba(222, 165, 132, 0.1)' },
    { id: 'scala', name: 'Scala', color: '#DC322F', bg: 'rgba(220, 50, 47, 0.1)' },
    { id: 'sql', name: 'SQL', color: '#e38c00', bg: 'rgba(227, 140, 0, 0.1)' },
    { id: 'swift', name: 'Swift', color: '#F05138', bg: 'rgba(240, 81, 56, 0.1)' },
    { id: 'typescript', name: 'TypeScript', color: '#007ACC', bg: 'rgba(0, 122, 204, 0.1)' },
    { id: 'vbnet', name: 'VB.Net', color: '#945db7', bg: 'rgba(148, 93, 183, 0.1)' },
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

  // Auto Complete States
  const [originalCode, setOriginalCode] = useState('');
  const [enhancedCode, setEnhancedCode] = useState(null);
  const [isShowingEnhanced, setIsShowingEnhanced] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const isToggleAction = useRef(false);

  // Gemini API Configuration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_AUTO_COMPLETE_KEY;

  const handleAutoComplete = async () => {
    if (enhancedCode) {
      // Toggle Mode
      isToggleAction.current = true;
      if (isShowingEnhanced) {
        setCode(originalCode);
        setIsShowingEnhanced(false);
      } else {
        setCode(enhancedCode);
        setIsShowingEnhanced(true);
      }
      // Reset toggle flag after a short delay to ensure onChange processed it
      setTimeout(() => { isToggleAction.current = false; }, 100);
      return;
    }

    // Generate Mode
    if (!code.trim()) return;

    setIsAutoCompleting(true);
    setOriginalCode(code); // Save current as original

    // Verify key exists
    if (!GEMINI_API_KEY) {
      toast.error("API Key missing. Check .env file.");
      console.error("VITE_GEMINI_AUTO_COMPLETE_KEY is missing");
      setIsAutoCompleting(false);
      return;
    }

    try {
      // Initialize client
      const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const prompt = `
        You are an expert coding assistant. 
        Please complete, fix, or enhance the following code.
        Language: ${language}
        
        Rules:
        1. Return ONLY the code. 
        2. Do not wrap in markdown code blocks (like \`\`\`javascript). 
        3. Do not add explanations.
        4. Maintain the style and logic but improve it or complete it if incomplete.
        
        Code:
        ${code}
      `;

      // Use usage pattern from gemini.js:
      // const chat = ai.chats.create({ model: ..., history: ... })
      // const result = await chat.sendMessage(...)

      const chat = client.chats.create({
        model: 'gemini-2.5-flash-lite',
        history: [], // No history needed for single completion
      });

      const result = await chat.sendMessage({
        message: prompt
      });

      let generatedCode = result.text;

      if (generatedCode && generatedCode.trim()) {
        // Clean up markdown if present despite instructions
        generatedCode = generatedCode.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');

        setEnhancedCode(generatedCode);
        isToggleAction.current = true;
        setCode(generatedCode);
        setIsShowingEnhanced(true);
        setTimeout(() => { isToggleAction.current = false; }, 100);
      } else {
        console.log("No code generated");
        toast.error("No suggestions received");
      }

    } catch (error) {
      console.error("Auto complete error:", error);
      toast.error(`Auto Complete Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAutoCompleting(false);
    }
  };

  const handleEditorChange = (newCode) => {
    if (!isToggleAction.current) {
      // If user manually edits, clear the enhanced state
      // But only if we are not currently toggling
      if (enhancedCode) {
        setEnhancedCode(null);
        setIsShowingEnhanced(false);
      }
    }
    setCode(newCode || '');
  };

  const handleRun = async () => {
    if (!code.trim() && !input.trim()) return; // Allow running if there's just input, though usually need code

    setIsRunning(true);
    setExecutionResult(null);
    setActiveBottomTab('output');
    setOutputOpen(true);

    try {
      const result = await runCode(code, language, input);
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({ error: error.message || 'An error occurred' });
    } finally {
      setIsRunning(false);
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

            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`px-6 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center gap-2 text-xs transition-colors font-medium shadow-sm border-2 border-transparent ${isRunning ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isRunning ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
              {isRunning ? 'Running' : 'Run'}
            </button>
          </div>
        </div>

        {/* Expanded Toolbar (Auto Complete) */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out px-3 flex justify-end gap-3 ${isToolbarExpanded ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
          <button
            onClick={handleAutoComplete}
            disabled={isAutoCompleting}
            className={`flex items-center gap-2 px-4 py-1.5 border-2 rounded-full text-xs transition-all font-medium
              ${enhancedCode
                ? (isShowingEnhanced ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500')
                : 'bg-[#1e1e1e] border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-500'}
            `}
          >
            {isAutoCompleting ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} className={isShowingEnhanced ? "fill-current" : ""} />
            )}
            {enhancedCode
              ? (isShowingEnhanced ? 'Show Original' : 'Show Enhanced')
              : 'Auto Complete'
            }
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
        <CodeEditor
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
        />
      </div>

      {/* Bottom Panel (Input/Output) */}
      <div
        style={{ height: (activeBottomTab === 'input' && inputOpen) || (activeBottomTab === 'output' && outputOpen) ? `${bottomHeight}px` : '32px' }}
        className="border-t border-[#333] bg-[#252526] flex flex-col relative transition-[height] duration-75 ease-out"
      >
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          className="absolute top-0 left-0 right-0 h-1.5 -mt-0.5 cursor-ns-resize hover:bg-blue-500/50 z-20 transition-colors"
        />

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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-full bg-[#1e1e1e] text-gray-300 p-3 font-mono text-xs focus:outline-none resize-none"
              placeholder="Enter input here..."
            />
          )}
          {activeBottomTab === 'output' && (
            <div className="w-full h-full bg-[#1e1e1e] text-gray-300 p-3 font-mono text-xs overflow-auto">
              {isRunning ? (
                <div className="flex items-center gap-2 text-gray-400 italic">
                  <RefreshCw className="animate-spin" size={12} />
                  Running code...
                </div>
              ) : executionResult ? (
                <div>
                  {executionResult.error ? (
                    <div className="text-red-400 font-mono whitespace-pre-wrap">{executionResult.error}</div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center gap-2 border-b border-[#333] pb-2">
                        <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Status:</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${executionResult.status?.id === 3 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {executionResult.status?.description}
                        </span>
                        {executionResult.time && (
                          <span className="text-gray-600 text-[10px] ml-auto">Time: {executionResult.time}s</span>
                        )}
                      </div>
                      {executionResult.stderr ? (
                        <div className="text-red-300 font-mono whitespace-pre-wrap mb-2 p-2 bg-red-500/5 rounded">{executionResult.stderr}</div>
                      ) : null}
                      <div className="text-gray-300 font-mono whitespace-pre-wrap">{executionResult.stdout || ' '}</div>
                      {executionResult.compile_output && (
                        <div className="mt-4 pt-4 border-t border-[#333] text-yellow-500 font-mono text-xs whitespace-pre-wrap">
                          <div className="mb-1 font-semibold opacity-70">Compilation Output:</div>
                          {executionResult.compile_output}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <span className="text-gray-500 italic">No output yet. Run the code to see results.</span>
              )}
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
