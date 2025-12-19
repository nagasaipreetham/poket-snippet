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

  // Getters for Recursive Logic
  const getFolderContents = (folderId) => {
    const childFolders = folders.filter(f => f.parentId === folderId);
    const childFiles = files.filter(f => f.folderId === folderId);
    return { folders: childFolders, files: childFiles };
  };

  const getRootContents = () => {
    const rootCtxFolders = folders.filter(f => !f.parentId); // Folders with no parent
    const rootCtxFiles = files.filter(f => !f.folderId); // Files with no parent
    return { folders: rootCtxFolders, files: rootCtxFiles };
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
      createFile,
      updateFileContent,
      updateFileMetadata,
      getFolderContents,
      getRootContents,
      getRootFiles, // Keep for backward compatibility if needed
      getFolderFiles // Keep for backward compatibility if needed
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};
