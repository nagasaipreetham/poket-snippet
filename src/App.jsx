import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home';
import SnippetDetail from './pages/SnippetDetail';
import FolderDetail from './pages/FolderDetail';
import { FileSystemProvider } from './context/FileSystemContext';

function App() {
  return (
    <FileSystemProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#333', color: '#fff' }
        }} />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="snippet/:id" element={<SnippetDetail />} />
            <Route path="folder/:id" element={<FolderDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FileSystemProvider>
  );
}

export default App;
