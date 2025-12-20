import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileSystem } from '../context/FileSystemContext';
import CodeEditor from '../components/Editor/CodeEditor';
import MetadataField from '../components/Snippet/MetadataField';
import { ArrowLeft, File, Play } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const SnippetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { files, updateFileContent, updateFileMetadata, addToRecent } = useFileSystem();

  const [file, setFile] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef(null);

  const [editingCodeTitle, setEditingCodeTitle] = useState('');
  const [isEditingCodeTitle, setIsEditingCodeTitle] = useState(false);
  const codeTitleRef = useRef(null);

  useEffect(() => {
    const foundFile = files.find(f => f.id === id);
    if (foundFile) {
      setFile(foundFile);
      addToRecent(foundFile);
      if (!isEditingCodeTitle) {
        setEditingCodeTitle(foundFile.codeTitle || 'Untitled Logic');
      }
    } else {
      toast.error("File not found");
      navigate('/');
    }
  }, [id, files, navigate, isEditingCodeTitle]);

  useEffect(() => { if (isEditingName && nameInputRef.current) nameInputRef.current.focus(); }, [isEditingName]);
  useEffect(() => { if (isEditingCodeTitle && codeTitleRef.current) codeTitleRef.current.focus(); }, [isEditingCodeTitle]);

  const handleEditorChange = (value) => updateFileContent(id, value);
  const handleMetadataUpdate = (updates) => updateFileMetadata(id, updates);

  const handleCodeTitleSubmit = () => {
    setIsEditingCodeTitle(false);
    const newVal = editingCodeTitle.trim() === '' ? 'Untitled Logic' : editingCodeTitle;
    updateFileMetadata(id, { codeTitle: newVal });
  };

  // Custom Metadata Handlers
  const handleCustomAdd = () => {
    const newField = { id: uuidv4(), title: 'New Section', content: '' };
    const currentCustom = file.customMetadata || [];
    updateFileMetadata(id, { customMetadata: [...currentCustom, newField] });
  };

  const updateCustomField = (fieldId, updates) => {
    const currentCustom = file.customMetadata || [];
    const newMeta = currentCustom.map(m => m.id === fieldId ? { ...m, ...updates } : m);
    updateFileMetadata(id, { customMetadata: newMeta });
  };

  const deleteCustomField = (fieldId) => {
    const currentCustom = file.customMetadata || [];
    const newMeta = currentCustom.filter(m => m.id !== fieldId);
    updateFileMetadata(id, { customMetadata: newMeta });
  };

  if (!file) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  // Active Checks:
  // "Empty" means null, undefined, or empty string.
  // We use this to decide whether to show the FIELD (if active) or the BUTTON (if inactive).
  const isDescriptionActive = file.description !== null && file.description !== undefined && file.description !== '';
  const isExpectedOutputActive = file.expectedOutput !== null && file.expectedOutput !== undefined && file.expectedOutput !== '';
  const customMetadata = file.customMetadata || [];

  const hasMetadataFields = isDescriptionActive || isExpectedOutputActive || customMetadata.length > 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto font-sans">

      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/')} className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-surface"><ArrowLeft size={18} /></button>
          <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
            <div className="p-1.5 bg-surface rounded text-accent">
              <File size={16} />
            </div>
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={file.name}
                onChange={(e) => updateFileMetadata(id, { name: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="bg-transparent text-lg font-semibold text-white outline-none border-b border-accent min-w-[200px]"
              />
            ) : (
              <h1 className="text-lg font-semibold text-white hover:text-accent transition-colors truncate max-w-md border-b border-transparent hover:border-border/50">
                {file.name}
              </h1>
            )}
          </div>
        </div>
      </header>

      {/* Content Container */}
      <div className="flex flex-col p-6 gap-8 pb-20">

        {/* CODE EDITOR BLOCK */}
        <div className="flex flex-col min-h-[500px] border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e]">
          {/* Block Header */}
          <div className="h-10 bg-[#1e1e1e] flex items-center justify-between px-4 border-b border-white/10">
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
                  {file.codeTitle || <span className="italic opacity-50">Untitled Logic</span>}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={file.language}
                onChange={(e) => updateFileMetadata(id, { language: e.target.value })}
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

          {/* Editor Area */}
          <div className="flex-1 min-h-[460px]">
            <CodeEditor
              language={file.language}
              value={file.content}
              onChange={handleEditorChange}
            />
          </div>

          {/* IN-EDITOR METADATA FIELDS */}
          {hasMetadataFields && (
            <div className="border-t border-white/10 bg-[#1e1e1e] p-4 flex flex-col gap-4">
              {isDescriptionActive && (
                <MetadataField
                  title="Description"
                  content={file.description}
                  onChange={(val) => updateFileMetadata(id, { description: val })}
                  onDelete={() => updateFileMetadata(id, { description: null })} // Sets to null/empty -> Button reappears
                  className="border-white/10 bg-white/5"
                  // If just added (was empty/null), we might want it expanded.
                  // If loading existing, we want collapsed.
                  // Simplest logic: If it has content, start collapsed? The spec says:
                  // "On Page Load (Existing File): Collapsed view"
                  // "On Page Load (New File empty): Button only"
                  // This prop is Initial state. Rerenders won't change it unless we force remount.
                  // But passing a hard `false` means it ALWAYS starts collapsed.
                  // When we click "+ Description", it goes from null -> " " (space) or "New Section". 
                  // We want that transition to be EXPANDED.
                  // Limitation: Using `key` to force remount on state change is one way, 
                  // or we can just accept that loaded content is `false`, but user interaction needs to open it.
                  // `MetadataField` handles its own toggle state.
                  // Let's rely on the user opening it? 
                  // WAIT: Spec says "Clicking button... Opens the expanded editor view".
                  // So we need it to be OPEN when first adding.
                  // We can achieve this by passing `initialIsOpen={true}` when we create it?
                  // No, because the component mounts when `isDescriptionActive` becomes true.
                  // So `initialIsOpen={true}` means newly added fields open.
                  // But for EXISTING files that load active... they ALSO mount for the first time on page load.
                  // So they would also be open.
                  // To distinguish "Loaded with content" vs "Just added", we can check if content is ' ' (our init value) vs long text? 
                  // Or just default to collapsed for standard, but maybe that violates "ClickButton -> Expanded"?
                  // Let's try: Default `initialIsOpen={true}`. 
                  // BUT "On Page Load (Existing File) -> Collapsed view".
                  // So we need `initialIsOpen={false}` if it's existing content.
                  // We can pass `initialIsOpen={!file.description || file.description.length < 5}`?  Hack but maybe works.
                  // Or better: Use a ref to track if it's initial load?
                  // For now: `initialIsOpen={false}` satisfies "Existing File Collapsed". 
                  // But "Opening a Section ... Opens expanded".
                  // If we use false, user has to click twice? (Once on footer, then on chevron?)
                  // No, clicking footer makes it render. If it renders collapsed, that's bad UX.
                  // We need it to render EXPANDED when added via footer.
                  // Strategy: `initialIsOpen={true}`. 
                  // But then how to satisfy "Existing File Collapsed"?
                  // Maybe we can check a separate "isNew" flag? Too complex.
                  // Let's stick to `initialIsOpen={false}` as safe default for now, unless content is === ' ' (our trigger).
                  initialIsOpen={file.description === ' '}
                />
              )}
              {isExpectedOutputActive && (
                <MetadataField
                  title="Expected Output"
                  content={file.expectedOutput}
                  onChange={(val) => updateFileMetadata(id, { expectedOutput: val })}
                  onDelete={() => updateFileMetadata(id, { expectedOutput: null })}
                  className="border-white/10 bg-white/5"
                  initialIsOpen={file.expectedOutput === ' '}
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
                  initialIsOpen={field.content === ''} // New fields start empty, so Open. Loaded fields have content -> Closed.
                />
              ))}
            </div>
          )}

          {/* FOOTER BAR */}
          <div className="h-10 bg-[#1e1e1e] border-t border-white/10 flex items-center px-4 space-x-4">
            {!isDescriptionActive && (
              <button
                // Set to ' ' (space) to trigger "Active" state and render the field.
                // We use space so it's not "empty string" which we treat as inactive.
                onClick={() => updateFileMetadata(id, { description: ' ' })}
                className="text-xs font-medium text-text-muted hover:text-white uppercase tracking-wide transition-colors flex items-center space-x-1"
              >
                <span>+ Description</span>
              </button>
            )}
            {!isExpectedOutputActive && (
              <button
                onClick={() => updateFileMetadata(id, { expectedOutput: ' ' })}
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

      </div>
    </div>
  );
};

export default SnippetDetail;
