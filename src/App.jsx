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
import UserSettings from './pages/UserSettings';
import PocketCanvas from './pages/PocketCanvas';
import { FileSystemProvider } from './context/FileSystemContext';

import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a loading spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <FileSystemProvider>
        <Toaster position="bottom-left" toastOptions={{
          style: { background: '#333', color: '#fff' }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="miscellaneous" element={<AllMiscellaneous />} />
            <Route path="snippet/:id" element={<SnippetDetail />} />
            <Route path="folder/:id" element={<FolderDetail />} />
            <Route path="pocket-canvas" element={<PocketCanvas />} />
            <Route path="settings" element={<UserSettings />} />
          </Route>
        </Routes>
      </FileSystemProvider>
    </BrowserRouter>
  );
}

export default App;
