import React, { useState } from 'react';
import { Search, Home, File, Folder, X, FilePlus, FolderPlus, Heart, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFileSystem } from '../../context/FileSystemContext';
import SidebarItem from './SidebarItem';
import CreateButton from '../UI/CreateButton';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for root creation inline input
  const [rootCreating, setRootCreating] = useState(null); // 'file' or 'folder'
  const [newRootName, setNewRootName] = useState('');
  const [miscLimit, setMiscLimit] = useState(5);

  const { folders, files, getRootContents, createFolder, createFile } = useFileSystem();

  const handleSearch = (e) => setSearchQuery(e.target.value);

  // Filtered Logic for Search
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render Logic
  const { folders: rootFolders, files: rootFiles } = getRootContents();

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-border flex flex-col text-sm text-text font-medium">
      {/* User Info */}
      <div className="p-4 flex items-center space-x-3 hover:bg-surface transition-colors cursor-pointer mb-2 border-b border-transparent hover:border-border">
        <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-accent font-bold">U</div>
        <span className="text-white">User Name</span>
      </div>

      {/* Trigger Search (Visual only, opens modal) */}
      <div
        className="mx-4 mb-4 p-2 bg-surface rounded flex items-center space-x-2 text-text-muted hover:text-white cursor-pointer transition-colors border border-transparent hover:border-border group"
        onClick={() => setIsSearchOpen(true)}
      >
        <Search size={16} className="group-hover:text-accent transition-colors" />
        <span className="text-xs uppercase tracking-wide">Search</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-2 px-2">
        {/* Home */}
        <Link to="/" className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surface text-text-muted hover:text-white transition-colors">
          <Home size={18} />
          <span>Home</span>
        </Link>
        <Link to="/favorites" className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surface text-text-muted hover:text-white transition-colors">
          <Heart size={18} />
          <span>Favorites</span>
        </Link>

        {/* Restored Main Create Button - User Request #3 */}
        <div className="px-2 pb-4 border-b border-border/50">
          <CreateButton />
        </div>

        {/* Miscellaneous (Root Files) - User Request #1 */}
        {rootFiles.length > 0 && (
          <div className="mt-4">
            <div className="px-3 flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Miscellaneous</h3>
              <Link to="/miscellaneous" className="text-[10px] text-accent hover:underline">View All</Link>
            </div>

            <div className="space-y-0.5">
              {rootFiles.slice(0, miscLimit).map(file => (
                <SidebarItem key={file.id} item={file} type="file" />
              ))}

              {/* Pagination Button */}
              {rootFiles.length > miscLimit && (
                <button
                  onClick={() => {
                    if (miscLimit >= 10) {
                      navigate('/miscellaneous');
                    } else {
                      setMiscLimit(10);
                    }
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 rounded hover:bg-surface text-text-muted hover:text-white transition-colors text-xs mt-1 group"
                >
                  <Plus size={12} className="group-hover:text-white" />
                  <span>{miscLimit >= 10 ? 'View All' : 'More'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Workspace (Root Folders) */}
        <div className="mt-6">
          <div className="px-3 flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Workspace</h3>
            <div className="flex items-center space-x-1 opacity-100">
              <button
                onClick={() => setRootCreating('file')}
                className="p-1 hover:bg-surface rounded text-text-muted hover:text-white transition-colors"
                title="New Root File"
              >
                <FilePlus size={14} />
              </button>
              <button
                onClick={() => setRootCreating('folder')}
                className="p-1 hover:bg-surface rounded text-text-muted hover:text-white transition-colors"
                title="New Root Folder"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>
          {/* Root Creation Input */}
          {rootCreating && (
            <div className="mx-2 px-3 py-1.5 flex items-center space-x-2 bg-surface/50 rounded mb-2 animate-in fade-in slide-in-from-top-1">
              {rootCreating === 'folder' ? <Folder size={16} className="text-amber-400" /> : <File size={16} className="text-accent" />}
              <input
                autoFocus
                value={newRootName}
                onChange={(e) => setNewRootName(e.target.value)}
                onBlur={() => {
                  if (!newRootName.trim()) { setRootCreating(null); return; }
                  if (rootCreating === 'folder') createFolder(newRootName, null);
                  else createFile(newRootName, null);
                  setNewRootName('');
                  setRootCreating(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!newRootName.trim()) { setRootCreating(null); return; }
                    if (rootCreating === 'folder') createFolder(newRootName, null);
                    else createFile(newRootName, null);
                    setNewRootName('');
                    setRootCreating(null);
                  }
                  if (e.key === 'Escape') { setNewRootName(''); setRootCreating(null); }
                }}
                className="bg-transparent border-b border-accent outline-none text-xs text-white w-full pb-0.5"
                placeholder={`New ${rootCreating}...`}
              />
            </div>
          )}

          <div className="space-y-0.5">
            {rootFolders.length === 0 && !rootCreating && (
              <div className="px-3 text-xs text-text-muted italic opacity-50">No workspaces</div>
            )}
            {/* Folders always first - SidebarItem handles children recursively */}
            {rootFolders.map(folder => (
              <SidebarItem key={folder.id} item={folder} type="folder" />
            ))}
          </div>
        </div>
      </nav>

      {/* Support / Buy me a coffee */}
      <div className="p-4 border-t border-border bg-[#1e1e1e]">
        <div className="text-xs text-center text-gray-300 mb-3 font-medium">Support me by buying a coffee...</div>
        <a
          href="https://www.buymeacoffee.com/Preetham.Dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full bg-white rounded-full py-1.5 hover:opacity-90 transition-opacity shadow-md"
        >
          <img src="/bmc.png" alt="Buy me a coffee" className="h-8 object-contain" />
        </a>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 animate-in fade-in duration-200" onClick={() => setIsSearchOpen(false)}>
          <div className="w-[600px] max-h-[70vh] flex flex-col bg-background border border-border rounded-xl shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center space-x-3">
              <Search size={20} className="text-accent" />
              <input
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search files, folders..."
                className="bg-transparent border-none outline-none text-lg text-white placeholder-text-muted w-full font-medium"
                autoFocus
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-text-muted hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {searchQuery && filteredFiles.length === 0 && filteredFolders.length === 0 && (
                <div className="p-8 text-center text-text-muted">No results found for "{searchQuery}"</div>
              )}

              {!searchQuery && (
                <div className="p-8 text-center text-text-muted text-xs uppercase tracking-widest">Type to search...</div>
              )}

              {filteredFolders.length > 0 && (
                <div className="mb-2">
                  <h4 className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-widest">Folders</h4>
                  {filteredFolders.map(folder => (
                    <div key={folder.id} className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surface text-text hover:text-white cursor-pointer group">
                      <Folder size={16} className="text-text-muted group-hover:text-amber-400" />
                      <span>{folder.name}</span>
                      <span className="text-xs text-text-muted ml-auto">Folder</span>
                    </div>
                  ))}
                </div>
              )}

              {filteredFiles.length > 0 && (
                <div className="mb-4">
                  <h4 className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-widest">Files</h4>
                  {filteredFiles.map(file => (
                    <Link
                      to={`/snippet/${file.id}`}
                      key={file.id}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surface text-text hover:text-white cursor-pointer group"
                    >
                      <File size={16} className="text-text-muted group-hover:text-accent" />
                      <span>{file.name}</span>
                      <span className="text-xs text-text-muted ml-auto">{file.language}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
