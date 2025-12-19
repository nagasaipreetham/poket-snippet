import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFileSystem } from '../context/FileSystemContext';
import { Folder, File, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';

const FolderDetail = () => {
  const { id } = useParams();
  const { folders, getFolderContents, updateFolder } = useFileSystem();

  const [currentFolder, setCurrentFolder] = useState(null);

  // Renaming State
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const renameInputRef = useRef(null);

  useEffect(() => {
    const found = folders.find(f => f.id === id);
    if (found) {
      setCurrentFolder(found);
      // Only sync local state if we are NOT currently renaming to prevent cursor issues/overwrites
      if (!isRenaming) {
        setNewName(found.name);
      }
    }
  }, [id, folders, isRenaming]);

  // Auto-focus input when renaming starts
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [isRenaming]);

  if (!currentFolder) return <div className="p-8 text-center text-text-muted">Folder not found</div>;

  const { folders: subFolders, files: subFiles } = getFolderContents(id);

  const handleRenameChange = (e) => {
    const val = e.target.value;
    setNewName(val);
    updateFolder(id, { name: val });
  };

  const handleRenameSubmit = () => {
    setIsRenaming(false);
    // No toast, no revert logic needed as it is real-time
    if (!newName.trim()) {
      if (currentFolder.name === '') updateFolder(id, { name: 'Untitled Folder' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') handleRenameSubmit();
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8 pt-12">
        {/* Header - Renaming Logic Applied */}
        <div className="mb-8 border-b border-border pb-4">
          <div className="flex items-center space-x-3 mb-2 group">
            <Folder size={32} className="text-amber-400 shrink-0" />

            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={newName}
                onChange={handleRenameChange}
                onBlur={handleRenameSubmit}
                onKeyDown={handleKeyDown}
                className="bg-transparent text-3xl font-bold text-white outline-none border-b border-accent min-w-[200px]"
              />
            ) : (
              <h1
                onClick={() => setIsRenaming(true)}
                className="text-3xl font-bold text-white cursor-pointer hover:text-accent transition-colors border-b border-transparent hover:border-border/50"
                title="Click to rename"
              >
                {currentFolder.name}
              </h1>
            )}
          </div>
          <p className="text-text-muted text-sm ml-11">Dashboard</p>
        </div>

        {/* Section 1: Sub-Folders */}
        <div className="mb-10">
          <div className="flex items-center space-x-2 mb-4 text-text-muted">
            <LayoutGrid size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Sub-Folders</h2>
          </div>

          {subFolders.length === 0 ? (
            <div className="text-text-muted italic opacity-50 text-sm">No sub-folders</div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin">
              {subFolders.map(folder => (
                <Link
                  to={`/folder/${folder.id}`}
                  key={folder.id}
                  className="min-w-[180px] h-32 bg-surface hover:bg-surface-hover rounded-xl p-4 border border-border flex flex-col justify-between transition-colors group"
                >
                  <Folder size={32} className="text-text-muted group-hover:text-amber-400 transition-colors" />
                  <div>
                    <h3 className="font-semibold text-white truncate text-sm">{folder.name}</h3>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Folder</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Files */}
        <div>
          <div className="flex items-center space-x-2 mb-4 text-text-muted">
            <File size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Files</h2>
          </div>

          {subFiles.length === 0 ? (
            <div className="text-text-muted italic opacity-50 text-sm">No files in this folder</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subFiles.map(file => (
                <Link
                  to={`/snippet/${file.id}`}
                  key={file.id}
                  className="bg-surface hover:bg-surface-hover rounded-lg p-4 border border-border flex items-center space-x-3 transition-colors group"
                >
                  <div className="p-2 bg-background rounded-lg">
                    <File size={20} className="text-text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate text-sm">{file.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-text-muted uppercase">{file.language}</span>
                      <span className="text-[10px] text-text-muted">{new Date(file.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderDetail;
