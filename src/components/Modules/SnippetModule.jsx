import React, { useState, useRef, useEffect } from 'react';
import CodeEditor from '../Editor/CodeEditor';
import MetadataField from '../Snippet/MetadataField';
import { Play, Sparkles } from 'lucide-react';
import useCompilerStore from '../../store/compilerStore';
import useChatStore from '../../store/chatStore';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import hljs from 'highlight.js'; // Reverted: Auto-detection via highlight.js

import { useAuth } from '../../context/AuthContext';

const SnippetModule = ({ module, snippetId, onUpdate, isDragging }) => {
  const { setCode: setCompilerCode } = useCompilerStore();
  const { setInput: setChatInput, setMode: setChatMode, setIsOpen, input: chatInput } = useChatStore();
  const { user } = useAuth();

  const editorHeight = user?.settings?.snippetModuleHeight || 500;
  const editorFontSize = user?.settings?.snippetModuleFontSize || 14;

  const handleRunSnippet = () => {
    if (!module.content || !module.content.trim()) {
      toast.error('Snippet is empty!', { position: 'bottom-left' });
      return;
    }
    setCompilerCode(module.content);
    setIsOpen(true);
    setChatMode('compiler');
    toast.success('Code copied to Compiler!', { position: 'bottom-left' });
  };

  const handleAskAI = () => {
    if (!module.content || !module.content.trim()) {
      toast.error('Snippet is empty!', { position: 'bottom-left' });
      return;
    }

    const separator = chatInput && chatInput.trim() ? '\n\n' : '';
    const newContent = chatInput + separator + module.content;

    setChatInput(newContent);
    setIsOpen(true);
    setChatMode('chat');
    toast.success('Copied to AI Chat!', { position: 'bottom-left' });
  };

  // Local state for editing code title specific to this module
  const [isEditingCodeTitle, setIsEditingCodeTitle] = useState(false);
  const [editingCodeTitle, setEditingCodeTitle] = useState('');
  const [focusTarget, setFocusTarget] = useState(null);
  const codeTitleRef = useRef(null);

  // Timeout ref for debouncing language detection
  const detectionTimeoutRef = useRef(null);

  // Allowed languages for auto-detection
  const allowedLanguages = [
    "c", "cpp", "csharp", "java", "python", "javascript", "typescript",
    "html", "css", "jsx", "tsx", "go", "rust", "ruby", "php", "json",
    "solidity", "kotlin", "swift", "dart", "scala", "elixir", "erlang", "racket"
  ];

  useEffect(() => {
    if (!isEditingCodeTitle) {
      setEditingCodeTitle(module.codeTitle || 'Untitled Logic');
    }
  }, [module.codeTitle, isEditingCodeTitle]);

  useEffect(() => {
    if (isEditingCodeTitle && codeTitleRef.current) {
      codeTitleRef.current.focus();
    }
  }, [isEditingCodeTitle]);

  // Implemented: Automatic Language Detection (highlight.js)
  useEffect(() => {
    if (!module.content || module.content.trim() === '') return;

    // Debounce detection to avoid performance hit on every keystroke
    if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);

    detectionTimeoutRef.current = setTimeout(() => {
      try {
        // Restrict detection to the allowed list specifically
        const result = hljs.highlightAuto(module.content, allowedLanguages);

        // Threshold check: if relevance < 15, assume plaintext
        const detectedLang = result.relevance >= 15 ? result.language : 'plaintext';

        // Only update if different to avoid potential loops/re-renders
        if (module.language !== detectedLang) {
          onUpdate({ language: detectedLang });
        }
      } catch (err) {
        console.warn("Language detection failed:", err);
      }
    }, 1000); // 1 second debounce

    return () => {
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
    };
  }, [module.content]); // Depend on content

  const handleCodeTitleSubmit = () => {
    setIsEditingCodeTitle(false);
    const newVal = editingCodeTitle.trim() === '' ? 'Untitled Logic' : editingCodeTitle;
    onUpdate({ codeTitle: newVal });
  };

  const handleEditorChange = (value) => {
    onUpdate({ content: value });
  };

  // Metadata Helpers
  const isDescriptionActive = module.description !== null && module.description !== undefined;
  const isExpectedOutputActive = module.expectedOutput !== null && module.expectedOutput !== undefined;
  const customMetadata = module.customMetadata || [];
  const hasMetadataFields = isDescriptionActive || isExpectedOutputActive || customMetadata.length > 0;

  // Check language, default to javascript if missing
  const language = module.language || 'javascript';

  // Custom Metadata Handlers
  const handleCustomAdd = () => {
    const newId = uuidv4();
    const newField = { id: newId, title: 'New Section', content: '' };
    const currentCustom = module.customMetadata || [];
    setFocusTarget(newId);
    onUpdate({ customMetadata: [...currentCustom, newField] });
  };

  const updateCustomField = (fieldId, updates) => {
    const currentCustom = module.customMetadata || [];
    const newMeta = currentCustom.map(m => m.id === fieldId ? { ...m, ...updates } : m);
    onUpdate({ customMetadata: newMeta });
  };

  const deleteCustomField = (fieldId) => {
    const currentCustom = module.customMetadata || [];
    const newMeta = currentCustom.filter(m => m.id !== fieldId);
    onUpdate({ customMetadata: newMeta });
  };

  // LeetCode Recommendations State
  const [leetcodeRecommendations, setLeetcodeRecommendations] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Fetch Existing Recommendations
  useEffect(() => {
    if (!snippetId) return;
    const fetchRecommendations = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = storedUser ? JSON.parse(storedUser).accessToken : null;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/snippets/${snippetId}/leetcode-recommendations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLeetcodeRecommendations(data);
        }
      } catch (err) {
        console.error("Failed to fetch leetcode recommendations", err);
      }
    };
    fetchRecommendations();
  }, [snippetId]);

  // Handle Find Similar
  const handleFindSimilarLeetcode = async () => {
    if (!snippetId) {
      toast.error('Please let the snippet save first before generating recommendations!');
      return;
    }
    if (!module.content || !module.content.trim()) {
      toast.error('Snippet is empty!');
      return;
    }
    setIsLoadingRecommendations(true);
    try {
      const storedUser = localStorage.getItem('user');
      const token = storedUser ? JSON.parse(storedUser).accessToken : null;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/snippets/${snippetId}/leetcode-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: module.content })
      });
      if (res.ok) {
        const data = await res.json();
        setLeetcodeRecommendations(data);
        toast.success('LeetCode recommendations generated!', { position: 'bottom-left' });
      } else {
        toast.error('Failed to generate recommendations. Please try again.', { position: 'bottom-left' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to Server', { position: 'bottom-left' });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e] mb-8">
      {/* Block Header */}
      <div className="h-10 bg-[#1e1e1e] flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div
          className="flex items-center space-x-2 hover:bg-white/5 px-2 py-1 rounded cursor-pointer min-w-[150px]"
          onClick={() => setIsEditingCodeTitle(true)}
        >
          {isEditingCodeTitle ? (
            <input
              ref={codeTitleRef}
              value={editingCodeTitle}
              onChange={(e) => setEditingCodeTitle(e.target.value)}
              onBlur={handleCodeTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleCodeTitleSubmit()}
              className="bg-transparent text-xs font-bold text-white outline-none border-b border-accent uppercase tracking-wider w-full"
              placeholder="Untitled Logic"
            />
          ) : (
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider select-none">
              {module.codeTitle || <span className="italic opacity-50">Untitled Logic</span>}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => onUpdate({ language: e.target.value })}
            className="bg-black text-white text-xs outline-none cursor-pointer border border-white/20 rounded px-2 py-1 appearance-none focus:ring-1 focus:ring-accent max-w-[120px]"
          >
            {/* Dynamic Option Rendering to support detected languages that might not be in hardcoded list */}
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="plaintext">Plain Text</option>
            {/* If current language is not in common list, add it dynamically */}
            {!['javascript', 'python', 'java', 'cpp', 'typescript', 'html', 'css', 'json', 'plaintext'].includes(language) && (
              <option value={language}>{language}</option>
            )}
          </select>
          <button
            onClick={handleAskAI}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wide transition-colors shadow-lg shadow-blue-900/20"
          >
            <Sparkles size={10} />
            <span>Ask AI</span>
          </button>
          <button
            onClick={handleRunSnippet}
            className="flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wide transition-colors shadow-lg shadow-green-900/20"
          >
            <Play size={10} fill="currentColor" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Editor Area - Dynamic Height */}
      {/* SAFE MODE: If dragging, replace heavy editor with static preview to prevent crashes */}
      <div className="w-full bg-[#191919] relative group" style={{ height: `${editorHeight}px` }}>
        {!isDragging ? (
          <CodeEditor
            language={language}
            value={module.content}
            onChange={handleEditorChange}
            fontSize={editorFontSize}
          />
        ) : (
          <div className="h-full w-full p-4 overflow-hidden bg-[#1e1e1e] flex flex-col">
            {/* Mock Editor Look */}
            <div className="flex-1 font-mono text-sm text-[#d4d4d4] whitespace-pre-wrap font-[Fira_Code] opacity-80 select-none">
              {module.content || '// Empty Snippet'}
            </div>
          </div>
        )}
      </div>

      {/* IN-EDITOR METADATA FIELDS */}
      {hasMetadataFields && (
        <div className="border-t border-white/10 bg-[#1e1e1e] p-4 flex flex-col gap-4">
          {isDescriptionActive && (
            <MetadataField
              title="Description"
              content={module.description}
              onChange={(val) => onUpdate({ description: val })}
              onDelete={() => onUpdate({ description: null })}
              className="border-white/10 bg-white/5"
              initialIsOpen={focusTarget === 'description'}
              autoFocus={focusTarget === 'description'}
              fontSize={user?.settings?.textModuleFontSize}
            />
          )}
          {isExpectedOutputActive && (
            <MetadataField
              title="Expected Output"
              content={module.expectedOutput}
              onChange={(val) => onUpdate({ expectedOutput: val })}
              onDelete={() => onUpdate({ expectedOutput: null })}
              className="border-white/10 bg-white/5"
              initialIsOpen={focusTarget === 'expectedOutput'}
              autoFocus={focusTarget === 'expectedOutput'}
              fontSize={user?.settings?.textModuleFontSize}
            />
          )}
          {customMetadata.map(field => (
            <MetadataField
              key={field.id}
              title={field.title}
              content={field.content}
              isCustom={true}
              onChange={(val) => updateCustomField(field.id, { content: val })}
              onTitleChange={(val) => updateCustomField(field.id, { title: val })}
              onDelete={() => deleteCustomField(field.id)}
              className="border-white/10 bg-white/5"
              initialIsOpen={focusTarget === field.id}
              autoFocus={focusTarget === field.id}
              fontSize={user?.settings?.textModuleFontSize}
            />
          ))}
        </div>
      )}

      {/* FOOTER BAR */}
      <div className="h-10 bg-[#1e1e1e] border-t border-white/10 flex items-center px-4 space-x-4 shrink-0">
        {!isDescriptionActive && (
          <button
            onClick={() => { onUpdate({ description: '' }); setFocusTarget('description'); }}
            className="text-xs font-medium text-text-muted hover:text-white uppercase tracking-wide transition-colors flex items-center space-x-1"
          >
            <span>+ Description</span>
          </button>
        )}
        {!isExpectedOutputActive && (
          <button
            onClick={() => { onUpdate({ expectedOutput: '' }); setFocusTarget('expectedOutput'); }}
            className="text-xs font-medium text-text-muted hover:text-white uppercase tracking-wide transition-colors flex items-center space-x-1"
          >
            <span>+ Expected Output</span>
          </button>
        )}

        <button
          onClick={handleCustomAdd}
          className="text-xs font-medium text-text-muted hover:text-white uppercase tracking-wide transition-colors flex items-center space-x-1"
        >
          <span>+ Custom</span>
        </button>

        {/* LeetCode Find Similar Button */}
        <button
          onClick={handleFindSimilarLeetcode}
          disabled={isLoadingRecommendations}
          className="ml-auto flex items-center space-x-2 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black px-4 py-1.5 rounded-sm text-xs font-bold uppercase transition-colors disabled:opacity-50"
          style={{ marginLeft: 'auto' }}
        >
          <span>Find similar</span>
          {isLoadingRecommendations ? (
            <div className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full ml-1" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-1">
              <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.7-.152-.7-.863 0-.711.233-1.396.7-.864l4.332-4.363c.467-.467 1.112-.662 1.824-.662s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-7.015 0l-4.341 4.377c-.979.989-1.514 2.337-1.514 3.753s.535 2.764 1.514 3.753l4.341 4.377a5.006 5.006 0 0 0 3.508 1.486c1.286 0 2.502-.505 3.507-1.486l2.609-2.636c.514-.514.496-1.365-.039-1.901-.536-.535-1.387-.553-1.901-.038z" />
              <path d="M20.811 13.01H10.666c-.702 0-1.27.604-1.27 1.346s.568 1.346 1.27 1.346h10.145c.701 0 1.27-.604 1.27-1.346s-.569-1.346-1.27-1.346z" />
            </svg>
          )}
        </button>
      </div>

      {/* RECOMMENDATIONS SECTION */}
      {leetcodeRecommendations && (
        <div className="p-5 bg-[#1e1e1e] border-t border-white/10 flex flex-col gap-4">
          <div className="text-sm font-semibold text-white flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="flex items-center gap-2"><svg viewBox="0 0 24 24" fill="#EAB308" className="w-5 h-5"><path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.7-.152-.7-.863 0-.711.233-1.396.7-.864l4.332-4.363c.467-.467 1.112-.662 1.824-.662s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-7.015 0l-4.341 4.377c-.979.989-1.514 2.337-1.514 3.753s.535 2.764 1.514 3.753l4.341 4.377a5.006 5.006 0 0 0 3.508 1.486c1.286 0 2.502-.505 3.507-1.486l2.609-2.636c.514-.514.496-1.365-.039-1.901-.536-.535-1.387-.553-1.901-.038z" /><path d="M20.811 13.01H10.666c-.702 0-1.27.604-1.27 1.346s.568 1.346 1.27 1.346h10.145c.701 0 1.27-.604 1.27-1.346s-.569-1.346-1.27-1.346z" /></svg> Recommended LeetCode Practice</span>
            {leetcodeRecommendations.tagsAssigned?.length > 0 && (
              <span className="text-xs text-text-muted font-normal">
                (Based on: <span className="text-white ml-1">{leetcodeRecommendations.tagsAssigned.join(', ')}</span>)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* EASY */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[11px] font-black text-green-500 uppercase tracking-widest pl-1 mb-1">Easy</h3>
              {leetcodeRecommendations.easy?.length === 0 && <span className="text-xs text-text-muted italic pl-1">No matches</span>}
              {leetcodeRecommendations.easy?.map(q => (
                <a
                  key={q.frontendQuestionId}
                  href={`https://leetcode.com/problems/${q.titleSlug}/description/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col border border-green-500/30 bg-transparent hover:bg-green-500/10 hover:border-green-500/50 p-3 rounded-lg text-xs transition-all duration-200"
                >
                  <span className="font-semibold text-green-400 group-hover:text-green-300 mb-1 leading-tight">{q.frontendQuestionId}. {q.title}</span>
                  <span className="text-[10px] text-green-500/60 font-mono">{Number(q.acRate).toFixed(1)}% Acceptance</span>
                </a>
              ))}
            </div>

            {/* MEDIUM */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest pl-1 mb-1">Medium</h3>
              {leetcodeRecommendations.medium?.length === 0 && <span className="text-xs text-text-muted italic pl-1">No matches</span>}
              {leetcodeRecommendations.medium?.map(q => (
                <a
                  key={q.frontendQuestionId}
                  href={`https://leetcode.com/problems/${q.titleSlug}/description/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col border border-orange-500/30 bg-transparent hover:bg-orange-500/10 hover:border-orange-500/50 p-3 rounded-lg text-xs transition-all duration-200"
                >
                  <span className="font-semibold text-orange-400 group-hover:text-orange-300 mb-1 leading-tight">{q.frontendQuestionId}. {q.title}</span>
                  <span className="text-[10px] text-orange-500/60 font-mono">{Number(q.acRate).toFixed(1)}% Acceptance</span>
                </a>
              ))}
            </div>

            {/* HARD */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[11px] font-black text-red-500 uppercase tracking-widest pl-1 mb-1">Hard</h3>
              {leetcodeRecommendations.hard?.length === 0 && <span className="text-xs text-text-muted italic pl-1">No matches</span>}
              {leetcodeRecommendations.hard?.map(q => (
                <a
                  key={q.frontendQuestionId}
                  href={`https://leetcode.com/problems/${q.titleSlug}/description/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col border border-red-500/30 bg-transparent hover:bg-red-500/10 hover:border-red-500/50 p-3 rounded-lg text-xs transition-all duration-200"
                >
                  <span className="font-semibold text-red-400 group-hover:text-red-300 mb-1 leading-tight">{q.frontendQuestionId}. {q.title}</span>
                  <span className="text-[10px] text-red-500/60 font-mono">{Number(q.acRate).toFixed(1)}% Acceptance</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnippetModule;
