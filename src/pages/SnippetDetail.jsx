import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileSystem } from '../context/FileSystemContext';
import TextModule from '../components/Modules/TextModule';
import SnippetModule from '../components/Modules/SnippetModule';
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

  useEffect(() => {
    const foundFile = files.find(f => f.id === id);
    if (foundFile) {
      // MIGRATION LOGIC:
      // If file has no 'modules' array, migration is needed.
      // Legacy Structure: { content, language, description, ... }
      // New Structure: { modules: [ {type:'text'}, {type:'snippet', ...}, {type:'text'} ] }

      let modules = foundFile.modules ? [...foundFile.modules] : [];

      if (modules.length === 0) {
        // Create initial modules
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

        // Rules: Start with Text, End with Text (for symmetry/safety), or just "At least one text".
        // Request: "New file must be created with Text Module as the first module"
        // Request: "Every file must contain at least one Text Module"

        const initialText = { id: uuidv4(), type: 'text', content: '' };
        // I will add one BEFORE and one AFTER for safety/notes.
        const safetyText = { id: uuidv4(), type: 'text', content: '' };

        modules = [initialText, legacySnippet, safetyText];

        // Persist migration
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

  const handleAddNextModule = (index) => {
    const newModules = [...file.modules];
    const newModule = { id: uuidv4(), type: 'text', content: '' };
    newModules.splice(index + 1, 0, newModule);

    const updatedFile = { ...file, modules: newModules };
    setFile(updatedFile);
    updateFileMetadata(id, { modules: newModules });
  };

  if (!file) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto font-sans">
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

      <div className="flex flex-col max-w-5xl mx-auto w-full p-8 pb-32">
        {file.modules.map((module, index) => (
          <React.Fragment key={module.id}>
            {module.type === 'text' ? (
              <TextModule
                module={module}
                onUpdate={(updates) => handleModuleUpdate(index, updates)}
                onAddNext={() => handleAddNextModule(index)}
                autoFocus={!module.content} // Focus if empty (e.g. just added)
              />
            ) : (
              <SnippetModule
                module={module}
                onUpdate={(updates) => handleModuleUpdate(index, updates)}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SnippetDetail;
