import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileSystem } from '../context/FileSystemContext';
import CodeEditor from '../components/Editor/CodeEditor';
import SnippetMetadata from '../components/Snippet/SnippetMetadata';
import { ArrowLeft, File, Play } from 'lucide-react';
import toast from 'react-hot-toast';

const SnippetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { files, updateFileContent, updateFileMetadata } = useFileSystem();

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

  if (!file) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  const handleEditorChange = (value) => updateFileContent(id, value);
  const handleMetadataUpdate = (updates) => updateFileMetadata(id, updates);

  const handleCodeTitleSubmit = () => {
    setIsEditingCodeTitle(false);
    const newVal = editingCodeTitle.trim() === '' ? 'Untitled Logic' : editingCodeTitle;
    updateFileMetadata(id, { codeTitle: newVal });
  };

  return (
    // Changed overflow-hidden to overflow-y-auto for full page scrolling
    <div className="flex flex-col h-full bg-background overflow-y-auto font-sans">

      {/* Header - Sticky? Or just top? Let's make it sticky so it's always visible */}
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

      {/* Content Container - No fixed height, just vertical column */}
      <div className="flex flex-col p-6 gap-8 pb-20">

        {/* CODE EDITOR BLOCK */}
        <div className="flex flex-col min-h-[500px] border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e]">
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
                className="bg-transparent text-text-muted text-xs outline-none cursor-pointer hover:text-white"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <button className="flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wide transition-colors shadow-lg shadow-green-900/20">
                <Play size={10} fill="currentColor" />
                <span>Run</span>
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-[460px]">
            <CodeEditor
              language={file.language}
              value={file.content}
              onChange={handleEditorChange}
            />
          </div>
        </div>

        {/* METADATA SECTION - Flows naturally, no fixed height */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center space-x-2 text-text-muted">
            <h2 className="text-sm font-bold uppercase tracking-widest">Metadata</h2>
            <div className="h-px bg-border flex-1"></div>
          </div>

          {/* No container fixed height, just the component */}
          <SnippetMetadata
            description={file.description}
            expectedOutput={file.expectedOutput}
            customMetadata={file.customMetadata}
            onUpdate={handleMetadataUpdate}
          />
        </div>

      </div>
    </div>
  );
};

export default SnippetDetail;
