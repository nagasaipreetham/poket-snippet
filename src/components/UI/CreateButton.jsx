import React, { useState, useRef, useEffect } from 'react';
import { Plus, File, Folder, X } from 'lucide-react';
import { useFileSystem } from '../../context/FileSystemContext';
import { useNavigate } from 'react-router-dom';

const CreateButton = () => {
  const { createFolder, createFile } = useFileSystem();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState('file'); // 'file' or 'folder'
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = () => {
    if (!inputValue.trim()) {
      setIsCreating(false);
      return;
    }

    if (createType === 'folder') {
      createFolder(inputValue);
    } else {
      const fileId = createFile(inputValue);
      // Optional: Navigate to new file immediately
      // navigate(`/snippet/${fileId}`);
    }

    console.log(`Created ${createType}: ${inputValue}`);
    setInputValue('');
    setIsCreating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="bg-surface rounded border border-border p-1 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center space-x-1 mb-2 bg-background rounded p-1">
          <button
            onClick={() => setCreateType('file')}
            className={`flex-1 flex items-center justify-center p-1 rounded text-xs transition-colors ${createType === 'file' ? 'bg-surface text-white shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            <File size={14} className="mr-1" /> File
          </button>
          <button
            onClick={() => setCreateType('folder')}
            className={`flex-1 flex items-center justify-center p-1 rounded text-xs transition-colors ${createType === 'folder' ? 'bg-surface text-white shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            <Folder size={14} className="mr-1" /> Folder
          </button>
        </div>
        <div className="flex items-center space-x-2 px-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`New ${createType}...`}
            className="bg-transparent border-none outline-none text-sm text-text w-full placeholder-text-muted"
          />
          <button onClick={() => setIsCreating(false)} className="text-text-muted hover:text-text">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="w-full bg-white hover:bg-gray-200 text-black font-medium py-1.5 px-3 rounded flex items-center justify-center space-x-2 transition-colors mb-2"
    >
      <Plus size={16} />
      <span>Create</span>
    </button>
  );
};

export default CreateButton;
