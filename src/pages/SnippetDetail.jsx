import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileSystem } from '../context/FileSystemContext';
import TextModule from '../components/Modules/TextModule';
import SnippetModule from '../components/Modules/SnippetModule';
import ModuleWrapper from '../components/Modules/ModuleWrapper';
import { ArrowLeft, File } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const SnippetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { files, updateFileMetadata, addToRecent } = useFileSystem();

  const [file, setFile] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef(null);

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const containerRef = useRef(null);
  const moduleRefs = useRef({});

  useEffect(() => {
    const foundFile = files.find(f => f.id === id);
    if (foundFile) {
      let modules = foundFile.modules ? [...foundFile.modules] : [];

      if (modules.length === 0) {
        // Default migration
        const legacySnippet = {
          id: uuidv4(),
          type: 'snippet',
          content: foundFile.content || '',
          language: foundFile.language || 'javascript',
          codeTitle: foundFile.codeTitle,
          description: foundFile.description,
          expectedOutput: foundFile.expectedOutput,
          customMetadata: foundFile.customMetadata || []
        };
        const initialText = { id: uuidv4(), type: 'text', content: '' };
        const safetyText = { id: uuidv4(), type: 'text', content: '' };
        modules = [initialText, legacySnippet, safetyText];
        updateFileMetadata(foundFile.id, { modules: modules });
      }

      setFile({ ...foundFile, modules: modules });
      addToRecent(foundFile);
    } else {
      toast.error("File not found");
      navigate('/');
    }
  }, [id, files, navigate]);

  useEffect(() => { if (isEditingName && nameInputRef.current) nameInputRef.current.focus(); }, [isEditingName]);

  const handleModuleUpdate = (index, updates) => {
    if (!file) return;
    const newModules = [...file.modules];
    newModules[index] = { ...newModules[index], ...updates };

    const updatedFile = { ...file, modules: newModules };
    setFile(updatedFile);
    updateFileMetadata(id, { modules: newModules });
  };

  const handleAddNextModule = (index, type) => {
    const newModules = [...file.modules];
    let newModule;
    if (type === 'snippet') {
      newModule = {
        id: uuidv4(),
        type: 'snippet',
        content: '// New Snippet',
        language: 'javascript',
        codeTitle: 'Untitled Logic',
        description: '',
        expectedOutput: '',
        customMetadata: []
      };
    } else {
      newModule = { id: uuidv4(), type: 'text', content: '' };
    }
    newModules.splice(index + 1, 0, newModule);

    const updatedFile = { ...file, modules: newModules };
    setFile(updatedFile);
    updateFileMetadata(id, { modules: newModules });
  };

  const handleReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const newModules = [...file.modules];
    const item = newModules[fromIndex];

    newModules.splice(fromIndex, 1);

    let insertAt = toIndex;
    if (insertAt > fromIndex) {
      insertAt -= 1;
    }

    if (insertAt < 0) insertAt = 0;
    if (insertAt > newModules.length) insertAt = newModules.length;

    newModules.splice(insertAt, 0, item);

    const updatedFile = { ...file, modules: newModules };
    setFile(updatedFile);
    updateFileMetadata(id, { modules: newModules });
  };

  const calculateDropIndex = (y) => {
    if (!file || !file.modules) return 0;
    const moduleIds = file.modules.map(m => m.id);

    for (let i = 0; i < moduleIds.length; i++) {
      const id = moduleIds[i];
      const el = moduleRefs.current[id];
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      if (y < center) {
        return i;
      }
    }
    return moduleIds.length;
  };

  if (!file) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto font-sans" ref={containerRef}>
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

      <div className="flex flex-col max-w-5xl mx-auto w-full p-8 pb-32 relative">
        {file.modules.map((module, index) => (
          <React.Fragment key={module.id}>
            {/* Gap Indicator - Persistent to prevent remounts */}
            <div
              className={`rounded-full w-full transition-all duration-200 ${isDragging && dropTargetIndex === index ? 'h-1 bg-blue-500 my-2' : 'h-0'}`}
            />

            <div ref={el => moduleRefs.current[module.id] = el}>
              <ModuleWrapper
                module={module}
                index={index}
                onAdd={(type) => handleAddNextModule(index, type)}
                onReorder={handleReorder}
                calculateDropIndex={calculateDropIndex}
                setDropTargetIndex={setDropTargetIndex}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                scrollContainerRef={containerRef}
              >
                {module.type === 'text' ? (
                  <TextModule
                    module={module}
                    onUpdate={(updates) => handleModuleUpdate(index, updates)}
                    onAddNext={() => handleAddNextModule(index, 'text')}
                    autoFocus={!module.content}
                  />
                ) : (
                  <SnippetModule
                    module={module}
                    onUpdate={(updates) => handleModuleUpdate(index, updates)}
                  />
                )}
              </ModuleWrapper>
            </div>

            {/* Last Gap Indicator */}
            {index === file.modules.length - 1 && (
              <div
                className={`rounded-full w-full transition-all duration-200 ${isDragging && dropTargetIndex === file.modules.length ? 'h-1 bg-blue-500 my-2' : 'h-0'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SnippetDetail;
