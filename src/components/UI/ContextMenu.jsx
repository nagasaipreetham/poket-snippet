import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, FolderInput, Heart, ChevronLeft, ChevronRight, Folder, Check, Pin, PinOff } from 'lucide-react';
import { useFileSystem } from '../../context/FileSystemContext';

const ContextMenu = ({ position, item, type, onClose, onRename, onDelete, onFavorite, onPin }) => {
  const { folders, moveItem } = useFileSystem();
  const [view, setView] = useState('menu'); // 'menu' | 'move'
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to not go off-screen (basic)
  const [adjustedPos, setAdjustedPos] = useState(position);

  useEffect(() => {
    const { x, y } = position;
    const menuWidth = 256; // w-64
    const menuHeight = 300; // rough max height

    let newX = x;
    let newY = y;

    // Check right edge
    if (x + menuWidth > window.innerWidth) {
      newX = window.innerWidth - menuWidth - 20;
    }

    // Check bottom edge
    if (y + menuHeight > window.innerHeight) {
      newY = window.innerHeight - menuHeight - 20;
    }

    setAdjustedPos({ x: newX, y: newY });
  }, [position]);

  const style = {
    top: adjustedPos.y,
    left: adjustedPos.x,
  };

  const handleMove = (targetFolderId) => {
    moveItem(item.id, type, targetFolderId);
    onClose();
  };

  // Exclude self and children (block cyclic moves) for folders
  const validMoveTargets = folders.filter(f => {
    if (type === 'file') return true;
    // If moving a folder, cannot move into self or own children
    // Simple check: ID !== item.id. (Deep cyclic check optional for now)
    return f.id !== item.id;
  });

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-[90] w-64 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl flex flex-col text-sm backdrop-blur-3xl"
    >
      {view === 'menu' && (
        <>
          <div className="px-3 py-2 border-b border-white/5 font-semibold text-white truncate opacity-80 select-none">
            {item.name}
          </div>

          <div className="p-1 space-y-0.5">
            <button onClick={onRename} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-blue-600/20 hover:text-blue-400 text-text transition-colors text-left group">
              <Edit2 size={14} className="group-hover:scale-110 transition-transform" />
              <span>Rename</span>
            </button>

            <button onClick={onPin} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-yellow-600/20 hover:text-yellow-400 text-text transition-colors text-left group">
              {item.isPinned ? <PinOff size={14} className="text-yellow-500" /> : <Pin size={14} />}
              <span>{item.isPinned ? 'Unpin' : 'Pin to Top'}</span>
            </button>

            <button onClick={onFavorite} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-pink-600/20 hover:text-pink-400 text-text transition-colors text-left group">
              <Heart size={14} className={`group-hover:scale-110 transition-transform ${item.isFavorite ? 'fill-current text-pink-500' : ''}`} />
              <span>{item.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
            </button>

            <button onClick={() => setView('move')} className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-surface hover:text-white text-text transition-colors text-left group">
              <div className="flex items-center space-x-3">
                <FolderInput size={14} />
                <span>Move to...</span>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </button>

            <div className="h-px bg-white/10 my-1 mx-2"></div>

            <button onClick={onDelete} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-red-900/30 hover:text-red-400 text-red-500 transition-colors text-left group">
              <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}

      {view === 'move' && (
        <>
          <div className="px-2 py-2 border-b border-white/5 flex items-center space-x-2 text-white font-medium select-none">
            <button onClick={() => setView('menu')} className="p-1 hover:bg-surface rounded text-text-muted hover:text-white">
              <ChevronLeft size={16} />
            </button>
            <span>Move to</span>
          </div>
          <div className="p-1 max-h-[200px] overflow-y-auto scrollbar-thin">
            <button
              onClick={() => handleMove(null)} // Root
              className="w-full flex items-center space-x-2 px-3 py-2 rounded hover:bg-surface text-text hover:text-white transition-colors text-left"
            >
              <Folder size={14} className="text-blue-400" />
              <span className="italic opacity-80">Workspace Root</span>
            </button>
            {validMoveTargets.map(folder => (
              <button
                key={folder.id}
                onClick={() => handleMove(folder.id)}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded hover:bg-surface text-text hover:text-white transition-colors text-left"
              >
                <Folder size={14} className="text-amber-400" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ContextMenu;
