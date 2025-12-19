import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Plus, FilePlus, FolderPlus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFileSystem } from '../../context/FileSystemContext';

const SidebarItem = ({ item, type, level = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getFolderContents, createFolder, createFile } = useFileSystem();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(null); // 'file' or 'folder'
  const [newName, setNewName] = useState('');

  // Indentation style
  const paddingLeft = `${level * 12 + 12}px`;

  // Active State Logic
  const isActive = location.pathname === (type === 'file' ? `/snippet/${item.id}` : `/folder/${item.id}`);

  if (type === 'file') {
    return (
      <Link
        to={`/snippet/${item.id}`}
        className="block group"
      >
        <div
          className={`flex items-center space-x-2 py-1.5 rounded-r-md mr-2 transition-colors cursor-pointer ${isActive ? 'bg-surface text-white' : 'hover:bg-surface text-text-muted hover:text-white'}`}
          style={{ paddingLeft }}
        >
          <File size={14} className={`transition-colors shrink-0 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-accent'}`} />
          <span className="truncate text-xs">{item.name}</span>
        </div>
      </Link>
    );
  }

  // Folder Logic
  const { folders: subFolders, files: subFiles } = getFolderContents(item.id);
  const hasChildren = subFolders.length > 0 || subFiles.length > 0;

  const handleCreate = (type) => {
    if (!newName.trim()) {
      setIsCreating(null);
      return;
    }

    if (type === 'folder') {
      createFolder(newName, item.id);
    } else {
      createFile(newName, item.id);
    }
    setNewName('');
    setIsCreating(null);
    setIsOpen(true); // Ensure open to see new item
  };

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter') handleCreate(type);
    if (e.key === 'Escape') {
      setNewName('');
      setIsCreating(null);
    }
  }

  // Action: Navigate to Folder Detail Page AND Toggle
  const handleFolderClick = (e) => {
    navigate(`/folder/${item.id}`);
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div
        className={`group flex items-center justify-between py-1.5 rounded-r-md mr-2 cursor-pointer pr-2 transition-colors ${isActive ? 'bg-surface' : 'hover:bg-surface'}`}
        style={{ paddingLeft }}
      >
        <div className="flex items-center space-x-2 overflow-hidden flex-1" onClick={handleFolderClick}>
          {isOpen ? <ChevronDown size={14} className="text-text-muted shrink-0" /> : <ChevronRight size={14} className="text-text-muted shrink-0" />}
          <Folder size={16} className={`transition-colors shrink-0 ${isActive ? 'text-amber-400' : 'text-text-muted group-hover:text-amber-400'}`} />
          <span className={`truncate text-xs font-medium transition-colors ${isActive ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>{item.name}</span>
        </div>

        {/* Hover Actions: File/Folder Create Buttons */}
        <div className="hidden group-hover:flex items-center space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsCreating('file'); setIsOpen(true); }}
            className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-white"
            title="New File"
          >
            <FilePlus size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsCreating('folder'); setIsOpen(true); }}
            className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-white"
            title="New Folder"
          >
            <FolderPlus size={12} />
          </button>
        </div>
      </div>

      {/* Children & Creation Input */}
      {isOpen && (
        <div>
          {/* Inline Creator */}
          {isCreating && (
            <div className="flex items-center space-x-2 py-1 pr-2 animate-in fade-in slide-in-from-top-1" style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}>
              {isCreating === 'folder' ? <Folder size={14} className="text-amber-400" /> : <File size={14} className="text-accent" />}
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, isCreating)}
                onBlur={() => handleCreate(isCreating)}
                placeholder={`Name...`}
                className="bg-transparent border-b border-accent outline-none text-xs text-white w-full pb-0.5"
              />
            </div>
          )}

          {/* Recursion: Folders FIRST, then Files */}
          {subFolders.map(folder => (
            <SidebarItem key={folder.id} item={folder} type="folder" level={level + 1} />
          ))}
          {subFiles.map(file => (
            <SidebarItem key={file.id} item={file} type="file" level={level + 1} />
          ))}
          {hasChildren === false && !isCreating && (
            <div className="text-[10px] text-text-muted italic py-1 opacity-50" style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}>Empty</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
