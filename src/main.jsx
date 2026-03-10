import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/Utils/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext';
import { loader } from '@monaco-editor/react';

// Configure Monaco loader to use a stable version from CDN 
// This helps prevent "anonymous define" conflicts by ensuring 
// the loader is initialized with a known-good configuration.
loader.config({
  paths: {
    vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
