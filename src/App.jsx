import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { FileSystemProvider } from './context/FileSystemContext';

// ─── Lazy-loaded pages (each becomes its own JS chunk) ───────────────────────
// Login is completely separate — loads ONLY when user is not authenticated
const Login = React.lazy(() => import('./pages/Login'));

// App pages — load ONLY when user is authenticated
const MainLayout = React.lazy(() => import('./components/Layout/MainLayout'));
const Home = React.lazy(() => import('./pages/Home'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const AllMiscellaneous = React.lazy(() => import('./pages/AllMiscellaneous'));
const SnippetDetail = React.lazy(() => import('./pages/SnippetDetail'));
const FolderDetail = React.lazy(() => import('./pages/FolderDetail'));
const PocketCanvas = React.lazy(() => import('./pages/PocketCanvas'));
const UserSettings = React.lazy(() => import('./pages/UserSettings'));

// ─── Shared loading fallback ──────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px', letterSpacing: '0.05em' }}>
    Loading...
  </div>
);

// ─── Route guards ─────────────────────────────────────────────────────────────

// If user IS logged in and tries to visit /login → send to /home
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;
  return children;
};

// If user is NOT logged in and tries to visit /home → send to /login
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Smart root redirect: check session → /home or /login
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/home' : '/login'} replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-left" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Smart root — decides where to send the user based on session */}
          <Route path="/" element={<RootRedirect />} />

          {/* Login — only loads login bundle, no app code */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected app — only loads when user is authenticated */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <FileSystemProvider>
                  <MainLayout />
                </FileSystemProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="miscellaneous" element={<AllMiscellaneous />} />
            <Route path="snippet/:id" element={<SnippetDetail />} />
            <Route path="folder/:id" element={<FolderDetail />} />
            <Route path="pocket-canvas" element={<PocketCanvas />} />
            <Route path="settings" element={<UserSettings />} />
          </Route>

          {/* Catch-all — redirect unknown URLs to root decider */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
