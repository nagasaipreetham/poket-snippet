import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const FileSystemContext = createContext();

export const useFileSystem = () => useContext(FileSystemContext);

export const FileSystemProvider = ({ children }) => {
  // Initial state loaded from localStorage or empty
  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('poket_folders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse folders", e);
      return [];
    }
  });

  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('poket_files');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse files", e);
      return [];
    }
  });

  const [recentFiles, setRecentFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('poket_recent');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse recent files", e);
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('poket_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('poket_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('poket_recent', JSON.stringify(recentFiles));
  }, [recentFiles]);


  const createFolder = (name, parentId = null) => {
    const newFolder = {
      id: uuidv4(),
      name,
      parentId, // Support for nested folders
      createdAt: new Date().toISOString(),
      type: 'folder'
    };
    setFolders(prev => [...prev, newFolder]);
    toast.success(`Folder "${name}" created`);
    return newFolder.id;
  };

  const updateFolder = (id, updates) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const createFile = (name, folderId = null, language = 'javascript') => {
    const newFile = {
      id: uuidv4(),
      name,
      folderId, // null means root/documents
      content: '// Start coding here...',
      codeTitle: 'Untitled Logic', // Separate title for the code snippet itself
      language,
      description: '',
      expectedOutput: '',
      customMetadata: [], // Array of { id, title, content }
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'file'
    };
    setFiles(prev => [...prev, newFile]);
    toast.success(`File "${name}" created`);
    addToRecent(newFile);
    return newFile.id;
  };

  const updateFileContent = (id, content) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const updated = { ...f, content, updatedAt: new Date().toISOString() };
        addToRecent(updated);
        return updated;
      }
      return f;
    }));
  };

  const updateFileMetadata = (id, updates) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const updated = { ...f, ...updates, updatedAt: new Date().toISOString() };
        // Update recent files if this file is in there
        setRecentFiles(recent => recent.map(r => r.id === id ? updated : r));
        return updated;
      }
      return f;
    }));
  };

  const addToRecent = (file) => {
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.id !== file.id);
      return [file, ...filtered].slice(0, 10); // Keep last 10
    });
  };

  const toggleFavorite = (id, type) => {
    if (type === 'file') {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
    } else {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
    }
  };

  const togglePin = (id, type) => {
    if (type === 'file') {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isPinned: !f.isPinned } : f));
    } else {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, isPinned: !f.isPinned } : f));
    }
    // toast.success(type + " Pin toggled"); // User requested to remove message
  };


  // Helper: Recursive delete logic to get ALL IDs to delete
  const getAllDescendants = (folderId) => {
    let descendantFileIds = [];
    let descendantFolderIds = [folderId];

    // Files directly in this folder
    const directFiles = files.filter(f => f.folderId === folderId);
    descendantFileIds.push(...directFiles.map(f => f.id));

    // Sub-folders
    const subFolders = folders.filter(f => f.parentId === folderId);

    subFolders.forEach(sub => {
      const result = getAllDescendants(sub.id);
      descendantFileIds.push(...result.fileIds);
      descendantFolderIds.push(...result.folderIds);
    });

    return { fileIds: descendantFileIds, folderIds: descendantFolderIds };
  };

  // Helper: Get formatted list of files for Delete Modal (recursively)
  const getFlatFileList = (folderId) => {
    const allFiles = [];

    const traverse = (currentId) => {
      // Files in current
      const fs = files.filter(f => f.folderId === currentId);
      allFiles.push(...fs);

      // Folders in current
      const subs = folders.filter(f => f.parentId === currentId);
      subs.forEach(sub => traverse(sub.id));
    }

    traverse(folderId);
    return allFiles;
  };

  const deleteItem = (id, type) => {
    if (type === 'file') {
      setFiles(prev => prev.filter(f => f.id !== id));
      setRecentFiles(prev => prev.filter(f => f.id !== id));
      toast.success("File deleted");
    } else {
      // Recursive delete
      const { fileIds, folderIds } = getAllDescendants(id);

      setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
      setRecentFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
      setFolders(prev => prev.filter(f => !folderIds.includes(f.id)));
      toast.success("Folder and contents deleted");
    }
  };

  const moveItem = (itemId, type, targetFolderId) => {
    if (type === 'file') {
      setFiles(prev => prev.map(f => f.id === itemId ? { ...f, folderId: targetFolderId, updatedAt: new Date().toISOString() } : f));
    } else {
      if (itemId === targetFolderId) return; // Prevent self-move
      // Prevent moving into own child (cycle) - Simple check
      // For now assuming user won't do deep cyclic moves in simplified UI, but safe to add later.
      setFolders(prev => prev.map(f => f.id === itemId ? { ...f, parentId: targetFolderId } : f));
    }
    toast.success("Moved successfully");
  };

  // Sort Helper
  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then Alphabetical
      return a.name.localeCompare(b.name);
    });
  };

  // Getters for Recursive Logic with Sorting
  const getFolderContents = (folderId) => {
    const childFolders = folders.filter(f => f.parentId === folderId);
    const childFiles = files.filter(f => f.folderId === folderId);
    return { folders: sortItems(childFolders), files: sortItems(childFiles) };
  };

  const getRootContents = () => {
    const rootCtxFolders = folders.filter(f => !f.parentId);
    const rootCtxFiles = files.filter(f => !f.folderId);
    return { folders: sortItems(rootCtxFolders), files: sortItems(rootCtxFiles) };
  };

  // Legacy support getters (optional, but good for safety)
  const getRootFiles = () => files.filter(f => !f.folderId);
  const getFolderFiles = (folderId) => files.filter(f => f.folderId === folderId);

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
      addToRecent, // Exposed for tracking visits
      getFolderContents,
      getRootContents,
      deleteItem,
      moveItem,
      toggleFavorite,
      togglePin,
      getFlatFileList,
      getRootFiles, // Keep for backward compatibility if needed
      getFolderFiles // Keep for backward compatibility if needed
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};
