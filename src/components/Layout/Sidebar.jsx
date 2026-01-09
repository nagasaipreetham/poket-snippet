import React, { useState, useEffect } from 'react';
import { Search, Home, File, Folder, X, FilePlus, FolderPlus, Heart, Plus, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFileSystem } from '../../context/FileSystemContext';
import SidebarItem from './SidebarItem';
import CreateButton from '../UI/CreateButton';
import usePocketCanvasStore from '../../store/pocketCanvasStore';

import { useAuth } from '../../context/AuthContext';
import { LogOut, Settings } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Responsive Sidebar Logic
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1000);
  const [isSmallOverlay, setIsSmallOverlay] = useState(window.innerWidth <= 600);
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [dragStartX, setDragStartX] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1000;
      setIsMobile(mobile);
      setIsSmallOverlay(window.innerWidth <= 600);
      if (!mobile) setIsOpen(true);
      else if (!isOpen) setIsOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragEnd = (e) => {
    if (dragStartX === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;

    if (diff > 50) {
      setIsOpen(true);
    }
    setDragStartX(null);
  };

  const [rootCreating, setRootCreating] = useState(null);
  const [newRootName, setNewRootName] = useState('');
  const [miscLimit, setMiscLimit] = useState(5);

  const { folders, files, getRootContents, createFolder, createFile } = useFileSystem();

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const { folders: rootFolders, files: rootFiles } = getRootContents();

  return (
    <>
      {isMobile && !isOpen && (
        <div
          className="fixed left-0 top-10 w-4 h-14 bg-sidebar rounded-r-xl z-[100] flex items-center justify-center cursor-pointer shadow-lg hover:w-7 transition-all duration-200 border-y border-r border-white/10"
          onClick={() => setIsOpen(true)}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          title="Open Sidebar"
        >
          <div className="w-1 h-6 bg-white/40 rounded-full" />
        </div>
      )}

      {isOpen && isSmallOverlay && (
        <div className="fixed inset-0 bg-black/50 z-[90]" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`w-64 h-screen bg-sidebar border-r border-border flex flex-col text-sm text-text font-medium transition-transform duration-300 z-[100]
          ${isMobile ? 'fixed inset-y-0 left-0 shadow-2xl' : 'relative'}
          ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        {/* User Info */}
        <div className="relative border-b border-transparent hover:border-border">
          <div
            className="p-4 flex items-center justify-between hover:bg-surface transition-colors cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-accent font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-white truncate max-w-[120px]" title={user?.name}>{user?.name || 'Guest User'}</span>
            </div>

            {/* Toggle for mobile close */}
            {isMobile && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1 hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

          {/* Logout Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full left-2 right-2 mt-1 bg-[#252525] border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/5 hover:text-accent transition-colors text-left"
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </div>
          )}
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

          {/* Pocket Canvas Trigger */}
          <button
            onClick={() => {
              // We need to trigger the store toggle. 
              // Since Sidebar doesn't have direct access to the store import here easily without converting to useStore,
              // we should import the store hook.
              const { toggleCanvas } = usePocketCanvasStore();
              toggleCanvas();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-surface text-text-muted hover:text-white transition-colors text-left"
          >
            <Palette size={18} />
            <span>Pocket Canvas</span>
          </button>

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
    </>
  );
};

export default Sidebar;
