import React, { useState, useRef, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Plus, FilePlus, FolderPlus, Heart, Pin } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFileSystem } from '../../context/FileSystemContext';
import ContextMenu from '../UI/ContextMenu';
import DeleteModal from '../Modals/DeleteModal';

const SidebarItem = ({ item, type, level = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getFolderContents, createFolder, createFile, deleteItem, getFlatFileList, toggleFavorite, togglePin, updateFolder, updateFileMetadata } = useFileSystem();

  // Basic State
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(null); // 'file' or 'folder'
  const [newName, setNewName] = useState(''); // Shared for creating AND renaming

  // Context Menu & Modal State
  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef(null);

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && renameInputRef.current) renameInputRef.current.focus();
  }, [isRenaming]);

  // Indentation style
  const paddingLeft = `${level * 12 + 12}px`;

  // Active State Logic
  const isActive = location.pathname === (type === 'file' ? `/snippet/${item.id}` : `/folder/${item.id}`);

  // Handlers
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRenameStart = () => {
    setContextMenu(null);

    // For folders, ensure visual opening isn't confused, but for inline rename on the item itself:
    setNewName(item.name); // Initialize with current name
    setIsRenaming(true);
  };

  const handleRenameSubmit = () => {
    setIsRenaming(false);
    if (!newName.trim()) { setNewName(item.name); return; }

    if (newName !== item.name) {
      if (type === 'folder') {
        updateFolder(item.id, { name: newName });
      } else {
        updateFileMetadata(item.id, { name: newName });
      }
    }
    setNewName(''); // Clear after submit to avoid polluting create logic? 
    // Wait, if we clear it, next time we start check creation it might be empty. 
    // But for creation we type fresh.
    // For renaming next time, handleRenameStart resets it.
    // So clearing is fine/safe.
  };

  const handleDeleteConfirm = () => {
    deleteItem(item.id, type);
    setShowDeleteModal(false);
  };

  const handleFolderClick = (e) => {
    navigate(`/folder/${item.id}`);
    if (isActive) {
      setIsOpen(!isOpen);
    } else {
      setIsOpen(true);
    }
  };

  const handleCreate = (createType) => {
    if (!newName.trim()) {
      setIsCreating(null);
      return;
    }

    if (createType === 'folder') {
      createFolder(newName, item.id);
    } else {
      createFile(newName, item.id);
    }
    setNewName('');
    setIsCreating(null);
    setIsOpen(true); // Ensure open to see new item
  };

  const handleKeyDown = (e, createType) => {
    if (e.key === 'Enter') handleCreate(createType);
    if (e.key === 'Escape') {
      setNewName('');
      setIsCreating(null);
    }
  };

  // Delete List Logic
  const itemsToDelete = type === 'folder' ? getFlatFileList(item.id) : [item];


  // --- RENDER ---

  if (type === 'file') {
    return (
      <div onContextMenu={handleContextMenu}>
        {contextMenu && (
          <ContextMenu
            position={contextMenu}
            item={item}
            type="file"
            onClose={() => setContextMenu(null)}
            onRename={handleRenameStart}
            onDelete={() => { setContextMenu(null); setShowDeleteModal(true); }}
            onFavorite={() => { setContextMenu(null); toggleFavorite(item.id, 'file'); }}
            onPin={() => { setContextMenu(null); togglePin(item.id, 'file'); }}
          />
        )}

        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          itemsToDelete={[item]}
          type="file"
        />

        <Link
          to={`/snippet/${item.id}`}
          className="block group"
        >
          <div
            className={`flex items-center justify-between py-1.5 rounded-r-md mr-2 pr-2 transition-colors cursor-pointer ${isActive ? 'bg-surface text-white' : 'hover:bg-surface text-text-muted hover:text-white'}`}
            style={{ paddingLeft }}
          >
            <div className="flex items-center space-x-2 overflow-hidden flex-1">
              <File size={14} className={`transition-colors shrink-0 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-accent'} ${item.isFavorite ? 'text-pink-500 fill-current' : ''}`} />

              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={newName}
                  onClick={(e) => e.preventDefault()}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  className="bg-transparent text-xs text-white outline-none border-b border-accent w-full"
                />
              ) : (
                <span className="truncate text-xs">{item.name}</span>
              )}
            </div>

            {/* Pin status for File */}
            {item.isPinned && (
              <div
                role="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); togglePin(item.id, 'file'); }}
                className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-white transition-colors ml-1 shrink-0"
                title="Unpin"
              >
                <Pin size={12} fill="currentColor" className="rotate-45" />
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  }

  // Folder Logic
  const { folders: subFolders, files: subFiles } = getFolderContents(item.id);
  const hasChildren = subFolders.length > 0 || subFiles.length > 0;

  return (
    <div onContextMenu={handleContextMenu}>
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          item={item}
          type="folder"
          onClose={() => setContextMenu(null)}
          onRename={handleRenameStart}
          onDelete={() => { setContextMenu(null); setShowDeleteModal(true); }}
          onFavorite={() => { setContextMenu(null); toggleFavorite(item.id, 'folder'); }}
          onPin={() => { setContextMenu(null); togglePin(item.id, 'folder'); }}
        />
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemsToDelete={itemsToDelete}
        type="folder"
      />

      <div
        className={`group flex items-center justify-between py-1.5 rounded-r-md mr-2 cursor-pointer pr-2 transition-colors ${isActive ? 'bg-surface' : 'hover:bg-surface'}`}
        style={{ paddingLeft }}
      >
        <div className="flex items-center space-x-2 overflow-hidden flex-1" onClick={handleFolderClick}>
          {isOpen ? <ChevronDown size={14} className="text-text-muted shrink-0" /> : <ChevronRight size={14} className="text-text-muted shrink-0" />}
          <Folder size={16} className={`transition-colors shrink-0 ${isActive ? 'text-amber-400' : 'text-text-muted group-hover:text-amber-400'} ${item.isFavorite ? 'text-pink-500 fill-current' : ''}`} />

          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={newName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="bg-transparent text-xs text-white outline-none border-b border-accent w-full"
            />
          ) : (
            <span className={`truncate text-xs font-medium transition-colors ${isActive ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>{item.name}</span>
          )}
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
        {/* Pin status for Folder */}
        {item.isPinned && (
          <div
            role="button"
            onClick={(e) => { e.stopPropagation(); togglePin(item.id, 'folder'); }}
            className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-white transition-colors ml-1 shrink-0"
            title="Unpin"
          >
            <Pin size={12} fill="currentColor" className="rotate-45" />
          </div>
        )}
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
