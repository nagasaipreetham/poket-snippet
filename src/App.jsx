import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home';
import SnippetDetail from './pages/SnippetDetail';
import FolderDetail from './pages/FolderDetail';
import Favorites from './pages/Favorites';
import AllMiscellaneous from './pages/AllMiscellaneous';
import Login from './pages/Login';
import { FileSystemProvider } from './context/FileSystemContext';

function App() {
  return (
    <FileSystemProvider>
      <BrowserRouter>
        <Toaster position="bottom-left" toastOptions={{
          style: { background: '#333', color: '#fff' }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            import AllMiscellaneous from './pages/AllMiscellaneous';

            // ... inside Routes ...
            <Route path="favorites" element={<Favorites />} />
            <Route path="miscellaneous" element={<AllMiscellaneous />} />
            <Route path="snippet/:id" element={<SnippetDetail />} />
            <Route path="folder/:id" element={<FolderDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FileSystemProvider>
  );
}

export default App;
