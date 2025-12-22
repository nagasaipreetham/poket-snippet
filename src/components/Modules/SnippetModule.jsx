import React, { useState, useRef, useEffect } from 'react';
import CodeEditor from '../Editor/CodeEditor';
import MetadataField from '../Snippet/MetadataField';
import { Play } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const SnippetModule = ({ module, onUpdate, isDragging }) => {
  // Local state for editing code title specific to this module
  const [isEditingCodeTitle, setIsEditingCodeTitle] = useState(false);
  const [editingCodeTitle, setEditingCodeTitle] = useState('');
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
  const isDescriptionActive = module.description !== null && module.description !== undefined && module.description !== '';
  const isExpectedOutputActive = module.expectedOutput !== null && module.expectedOutput !== undefined && module.expectedOutput !== '';
  const customMetadata = module.customMetadata || [];
  const hasMetadataFields = isDescriptionActive || isExpectedOutputActive || customMetadata.length > 0;

  // Check language, default to javascript if missing
  const language = module.language || 'javascript';

  // Custom Metadata Handlers
  const handleCustomAdd = () => {
    const newField = { id: uuidv4(), title: 'New Section', content: '' };
    const currentCustom = module.customMetadata || [];
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
    <div className="flex flex-col min-h-[500px] border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e] mb-8">
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
            className="bg-black text-white text-xs outline-none cursor-pointer border border-white/20 rounded px-2 py-1 appearance-none focus:ring-1 focus:ring-accent"
          >
            <option value="javascript" className="bg-black text-white selection:bg-white selection:text-black">JavaScript</option>
            <option value="python" className="bg-black text-white">Python</option>
            <option value="java" className="bg-black text-white">Java</option>
            <option value="cpp" className="bg-black text-white">C++</option>
          </select>
          <button className="flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wide transition-colors shadow-lg shadow-green-900/20">
            <Play size={10} fill="currentColor" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Editor Area - Fixed Height for Stability */}
      {/* SAFE MODE: If dragging, replace heavy editor with static preview to prevent crashes */}
      <div className="h-[500px] w-full bg-[#191919] relative group">
        {!isDragging ? (
          <CodeEditor
            language={language}
            value={module.content}
            onChange={handleEditorChange}
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
              initialIsOpen={module.description === ' '}
            />
          )}
          {isExpectedOutputActive && (
            <MetadataField
              title="Expected Output"
              content={module.expectedOutput}
              onChange={(val) => onUpdate({ expectedOutput: val })}
              onDelete={() => onUpdate({ expectedOutput: null })}
              className="border-white/10 bg-white/5"
              initialIsOpen={module.expectedOutput === ' '}
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
              initialIsOpen={field.content === ''}
            />
          ))}
        </div>
      )}

      {/* FOOTER BAR */}
      <div className="h-10 bg-[#1e1e1e] border-t border-white/10 flex items-center px-4 space-x-4 shrink-0">
        {!isDescriptionActive && (
          <button
            onClick={() => onUpdate({ description: ' ' })}
            className="text-xs font-medium text-text-muted hover:text-white uppercase tracking-wide transition-colors flex items-center space-x-1"
          >
            <span>+ Description</span>
          </button>
        )}
        {!isExpectedOutputActive && (
          <button
            onClick={() => onUpdate({ expectedOutput: ' ' })}
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
