import React, { useState, useRef, useEffect } from 'react';
import CodeEditor from '../Editor/CodeEditor';
import MetadataField from '../Snippet/MetadataField';
import { Play, Sparkles, ChevronDown, Check } from 'lucide-react';
import useCompilerStore from '../../store/compilerStore';
import useChatStore from '../../store/chatStore';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';


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

  // Language Popup Logic
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langPopupRef = useRef(null);
  const langTriggerRef = useRef(null);

  const languagesList = [
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLangOpen && langPopupRef.current && !langPopupRef.current.contains(event.target) && !langTriggerRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangOpen]);

  // LeetCode Recommendations State
  const [leetcodeRecommendations, setLeetcodeRecommendations] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [expandedTags, setExpandedTags] = useState({});

  const toggleTags = (e, qId) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedTags(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

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
          <div className="relative">
            <button
              ref={langTriggerRef}
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-1 bg-black border border-white/20 rounded hover:bg-white/5 text-[10px] font-bold transition-all min-w-[100px] justify-between uppercase"
            >
              <span style={{ color: languagesList.find(l => l.id === (module.language || 'javascript'))?.color || '#fff' }}>
                {languagesList.find(l => l.id === (module.language || 'javascript'))?.name || (module.language || 'javascript')}
              </span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div
                ref={langPopupRef}
                className="absolute top-8 right-0 w-[400px] z-[100] bg-[#1e1e1e] border border-white/20 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200"
              >
                <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar p-1">
                  {languagesList.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        onUpdate({ language: lang.id });
                        setIsLangOpen(false);
                      }}
                      style={{
                        borderColor: lang.color + '44',
                        color: lang.color,
                        backgroundColor: lang.bg
                      }}
                      className={`flex-auto px-3 py-1.5 rounded-full text-[10px] font-bold border hover:opacity-80 transition-opacity flex items-center justify-center gap-1 min-w-[90px] uppercase
                                  ${module.language === lang.id ? 'ring-1 ring-offset-1 ring-offset-[#1e1e1e] border-opacity-100' : ''} `}
                    >
                      {lang.name}
                      {module.language === lang.id && <Check size={8} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          className="ml-auto group flex items-center space-x-2 border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors disabled:opacity-50"
          style={{ marginLeft: 'auto' }}
        >
          <span>Find similar</span>
          {isLoadingRecommendations ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full ml-1" />
          ) : (
            <img
              src="/leetcode-logo.png"
              alt="LeetCode Logo"
              className="w-4 h-4 ml-1 object-contain transition-all group-hover:brightness-0"
            />
          )}
        </button>
      </div>

      {/* RECOMMENDATIONS SECTION */}
      {leetcodeRecommendations && (
        <div className="p-5 bg-[#1e1e1e] border-t border-white/10 flex flex-col gap-4">
          <div className="text-sm font-semibold text-white flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="flex items-center gap-2">
              <img src="/leetcode-logo.png" alt="LeetCode Logo" className="w-5 h-5 object-contain" />
              Recommended LeetCode Practice
            </span>
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
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-green-500/60 font-mono">{Number(q.acRate).toFixed(1)}% Acceptance</span>
                    <button
                      onClick={(e) => toggleTags(e, q.frontendQuestionId)}
                      className="text-[10px] border border-green-500/60 rounded px-1.5 py-0.5 text-green-500/80 hover:bg-green-500/20 flex items-center gap-1 transition-colors"
                    >
                      Tags
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    </button>
                  </div>
                  {expandedTags[q.frontendQuestionId] && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.topicTags ? q.topicTags.replace(/[\[\]'"]/g, '').split(',').map((tag, i) => (
                        <span key={i} className="bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] px-1.5 py-0.5 rounded-full">
                          {tag.trim()}
                        </span>
                      )) : <span className="text-[9px] text-green-500/50">No tags</span>}
                    </div>
                  )}
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
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-orange-500/60 font-mono">{Number(q.acRate).toFixed(1)}% Acceptance</span>
                    <button
                      onClick={(e) => toggleTags(e, q.frontendQuestionId)}
                      className="text-[10px] border border-orange-500/60 rounded px-1.5 py-0.5 text-orange-500/80 hover:bg-orange-500/20 flex items-center gap-1 transition-colors"
                    >
                      Tags
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    </button>
                  </div>
                  {expandedTags[q.frontendQuestionId] && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.topicTags ? q.topicTags.replace(/[\[\]'"]/g, '').split(',').map((tag, i) => (
                        <span key={i} className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] px-1.5 py-0.5 rounded-full">
                          {tag.trim()}
                        </span>
                      )) : <span className="text-[9px] text-orange-500/50">No tags</span>}
                    </div>
                  )}
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
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-red-500/60 font-mono">{Number(q.acRate).toFixed(1)}% Acceptance</span>
                    <button
                      onClick={(e) => toggleTags(e, q.frontendQuestionId)}
                      className="text-[10px] border border-red-500/60 rounded px-1.5 py-0.5 text-red-500/80 hover:bg-red-500/20 flex items-center gap-1 transition-colors"
                    >
                      Tags
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    </button>
                  </div>
                  {expandedTags[q.frontendQuestionId] && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.topicTags ? q.topicTags.replace(/[\[\]'"]/g, '').split(',').map((tag, i) => (
                        <span key={i} className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] px-1.5 py-0.5 rounded-full">
                          {tag.trim()}
                        </span>
                      )) : <span className="text-[9px] text-red-500/50">No tags</span>}
                    </div>
                  )}
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
