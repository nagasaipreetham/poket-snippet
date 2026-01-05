import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const FileSystemContext = createContext();

export const useFileSystem = () => useContext(FileSystemContext);

export const FileSystemProvider = ({ children }) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]); // Start empty, load in useEffect
  const API_URL = import.meta.env.VITE_API_URL;

  // Header Helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.accessToken}`
  });

  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);
  const metadataTimeoutRef = useRef(null);

  // Fetch Data on Load
  useEffect(() => {
    // Always clear state immediately on user change
    setFolders([]);
    setFiles([]);
    setRecentFiles([]);

    if (user?.accessToken) {
      setIsLoading(true); // Start loading
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user?.accessToken) return;

      const headers = {
        ...getHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      const [foldersRes, snippetsRes] = await Promise.all([
        fetch(`${API_URL}/api/folders`, { headers }),
        fetch(`${API_URL}/api/snippets`, { headers })
      ]);

      if (foldersRes.status === 401 || snippetsRes.status === 401) {
        console.error("Session expired details:", {
          foldersStatus: foldersRes.status,
          snippetsStatus: snippetsRes.status,
          hasToken: !!user?.accessToken,
          tokenPreview: user?.accessToken?.substring(0, 10) + '...'
        });
        toast.error("Session expired, please sign in again");
        return;
      }

      if (!foldersRes.ok || !snippetsRes.ok) {
        throw new Error(`Fetch failed: Folders ${foldersRes.status}, Snippets ${snippetsRes.status}`);
      }

      const foldersData = await foldersRes.json();
      const filesData = await snippetsRes.json();

      // Normalize MongoDB _id to id for frontend compatibility
      const normFiles = filesData.map(f => ({ ...f, id: f._id }));
      setFolders(foldersData.map(f => ({ ...f, id: f._id })));
      setFiles(normFiles);

      // Derive recent files from fetched data (sort by lastAccessedAt)
      const sortedRecent = [...normFiles]
        .sort((a, b) => new Date(b.lastAccessedAt || 0) - new Date(a.lastAccessedAt || 0))
        .slice(0, 6);
      setRecentFiles(sortedRecent);

    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to sync data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };


  const createFolder = async (name, parentId = null) => {
    try {
      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, parentId })
      });

      if (res.ok) {
        const newFolder = await res.json();
        const normalized = { ...newFolder, id: newFolder._id };
        setFolders(prev => [normalized, ...prev]); // Add to top
        toast.success(`Folder "${name}" created`);
        return normalized.id;
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to create folder");
    }
  };

  const updateFolder = async (id, updates) => {
    try {
      // Optimistic update
      setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));

      await fetch(`${API_URL}/api/folders/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
    } catch (e) {
      fetchData(); // Revert on error
      toast.error("Failed to update folder");
    }
  };

  const createFile = async (name, folderId = null, language = 'javascript') => {
    try {
      // Helper to generate initial modules
      const initialModules = [
        { id: crypto.randomUUID(), type: 'text', content: '' }, // crypto.randomUUID is native browser API
        {
          id: crypto.randomUUID(),
          type: 'snippet',
          content: '// Start coding here...',
          language: language,
          codeTitle: 'Untitled Logic',
          description: '',
          expectedOutput: '',
          customMetadata: []
        }
      ];

      const res = await fetch(`${API_URL}/api/snippets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          folderId,
          language,
          content: '// Start coding here...', // Keep legacy content for backward compat/search
          modules: initialModules,
          codeTitle: 'Untitled Logic'
        })
      });

      if (res.ok) {
        const newFile = await res.json();
        const normalized = { ...newFile, id: newFile._id };
        setFiles(prev => [normalized, ...prev]);
        toast.success(`File "${name}" created`);
        addToRecent(normalized);
        return normalized.id;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to create file", res.status, errorData);
        toast.error(`Error: ${errorData.message || 'Failed to create file'}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to create file");
    }
  };

  const updateFileContent = async (id, content) => {
    // 1. Optimistic update
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));

    // 2. Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/snippets/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ content })
      })
        .then(res => {
          if (!res.ok) console.error("Auto-save failed", res.status);
        })
        .catch(e => console.error("Auto-save failed", e));
    }, 2000);
  };

  const updateFileMetadata = async (id, updates) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));

    if (metadataTimeoutRef.current) {
      clearTimeout(metadataTimeoutRef.current);
    }

    metadataTimeoutRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/snippets/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      })
        .then(res => {
          if (!res.ok) console.error("Update failed", res.status);
        })
        .catch(e => console.error(e));
    }, 2000);
  };


  const deleteItem = async (id, type) => {
    try {
      const endpoint = type === 'file' ? 'snippets' : 'folders';

      // Optimistic UI update
      if (type === 'file') {
        setFiles(prev => prev.filter(f => f.id !== id));
        // Remove from recent files as well
        setRecentFiles(prev => prev.filter(f => f.id !== id));
      } else {
        setFolders(prev => prev.filter(f => f.id !== id));
      }

      await fetch(`${API_URL}/api/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      toast.success("Item deleted");
      // If folder, technically we should refresh or recursively remove children in state
      if (type === 'folder') fetchData();

    } catch (e) {
      fetchData(); // Revert
      toast.error("Failed to delete");
    }
  };

  const addToRecent = (file) => {
    const now = new Date();

    // 1. Update Recent List State
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.id !== file.id);
      return [{ ...file, lastAccessedAt: now }, ...filtered].slice(0, 6);
    });

    // 2. Persist to DB (bypass debounce for immediate interaction log)
    fetch(`${API_URL}/api/snippets/${file.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ lastAccessedAt: now })
    }).catch(e => console.error("Failed to update access time", e));
  };

  // --- Getters & Helpers (Same as before) ---

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const getFolderContents = (folderId) => {
    const childFolders = folders.filter(f => f.parentId === folderId);
    // MongoDB stores IDs as strings usually, compare loosely or ensure formatting
    const childFiles = files.filter(f => f.folderId === folderId);
    return { folders: sortItems(childFolders), files: sortItems(childFiles) };
  };

  const getRootContents = () => {
    const rootCtxFolders = folders.filter(f => !f.parentId);
    const rootCtxFiles = files.filter(f => !f.folderId);
    return { folders: sortItems(rootCtxFolders), files: sortItems(rootCtxFiles) };
  };

  const getFlatFileList = (folderId) => {
    const allFiles = [];
    const traverse = (currentId) => {
      const fs = files.filter(f => f.folderId === currentId);
      allFiles.push(...fs);
      const subs = folders.filter(f => f.parentId === currentId);
      subs.forEach(sub => traverse(sub.id));
    }
    traverse(folderId);
    return allFiles;
  };

  const toggleFavorite = (id, type) => {
    // Implement logic to call update API with isFavorite: !current
    const item = type === 'file' ? files.find(f => f.id === id) : folders.find(f => f.id === id);
    if (item) {
      if (type === 'file') updateFileMetadata(id, { isFavorite: !item.isFavorite });
      else updateFolder(id, { isFavorite: !item.isFavorite });
    }
  };

  const togglePin = (id, type) => {
    const item = type === 'file' ? files.find(f => f.id === id) : folders.find(f => f.id === id);
    if (item) {
      if (type === 'file') updateFileMetadata(id, { isPinned: !item.isPinned });
      else updateFolder(id, { isPinned: !item.isPinned });
    }
  };

  const moveItem = (itemId, type, targetFolderId) => {
    if (type === 'file') updateFileMetadata(itemId, { folderId: targetFolderId });
    else updateFolder(itemId, { parentId: targetFolderId });
  };


  return (
    <FileSystemContext.Provider value={{
      folders,
      files,
      recentFiles,
      createFolder,
      updateFolder,
      createFile,
      updateFileContent,
      updateFileMetadata,
      addToRecent,
      getFolderContents,
      getRootContents,
      deleteItem,
      moveItem,
      toggleFavorite,
      togglePin,
      getFlatFileList,
      getRootFiles: () => files.filter(f => !f.folderId),
      getFolderFiles: (id) => files.filter(f => f.folderId === id),
      isLoading
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};
