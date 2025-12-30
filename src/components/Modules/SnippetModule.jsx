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

const SnippetModule = ({ module, onUpdate, isDragging }) => {
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
      </div>
    </div>
  );
};

export default SnippetModule;
