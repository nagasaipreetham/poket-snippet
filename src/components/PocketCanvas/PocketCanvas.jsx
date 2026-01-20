import React, { useEffect, useState, useRef, useCallback } from 'react';
import usePocketCanvasStore from '../../store/pocketCanvasStore';
import ExcalidrawApp from '../../lib/excalidraw-app/App';
import '../../lib/excalidraw-app/index.scss';
import { useAuth } from '../../context/AuthContext';
import { saveCanvas, getCanvases, getCanvas } from '../../api/api';
import toast from 'react-hot-toast';
import { Cloud, Check, Loader, ChevronDown, File } from 'lucide-react';
import { debounce } from 'lodash';
import { loadFromBlob } from '@excalidraw/excalidraw/data/blob';

// Define environment variables expected by the app
if (!window.process) {
  window.process = { env: { NODE_ENV: 'development' } };
}

const PocketCanvas = (props) => {
  const { currentCanvasId } = usePocketCanvasStore();
  const { user, updateProfile } = useAuth();
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [savedCanvases, setSavedCanvases] = useState([]);
  const [savingStatus, setSavingStatus] = useState('saved'); // saved, saving, error
  const [initialData, setInitialData] = useState(null);
  const [showCanvasList, setShowCanvasList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState('dark'); // Default theme


  const lastSavedDataStringRef = useRef(""); // To prevent redundant saves
  const lastSavedNameRef = useRef(canvasName);
  const lastSavedElementsRef = useRef(null);
  const lastSavedFilesRef = useRef(null);
  const hasAutoLoadedRef = useRef(false);
  const listFetchLockRef = useRef(false);
  const listFetchTsRef = useRef(0);
  const excalidrawAPIRef = useRef(null); // Ref to access Excalidraw API
  const isInitializedRef = useRef(false); // Guard against premature saves

  const decodePayload = (data) => {
    try {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (_) { }
        try {
          let s = data;
          s = s.replace(/-/g, '+').replace(/_/g, '/');
          const pad = s.length % 4;
          if (pad) s = s + '='.repeat(4 - pad);
          const decoded = atob(s);
          return JSON.parse(decoded);
        } catch (_) { }
        return null;
      }
      if (data && typeof data === 'object') {
        return data;
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  // Cleanup local storage when user changes or on mount to ensure no stale data
  useEffect(() => {
    if (!ready || !initialData || !excalidrawAPIRef.current) return;
    const api = excalidrawAPIRef.current;
    const sanitizedAppState = { ...(initialData.appState || {}) };
    delete sanitizedAppState.collaborators;
    api.updateScene({
      elements: initialData.elements || [],
      appState: sanitizedAppState,
      commitToHistory: true,
      scrollToContent: true,
    });
    if (initialData.files && Object.keys(initialData.files).length > 0) {
      api.addFiles(Object.values(initialData.files));
    }
  }, [ready, initialData]);
  // Clear Excalidraw's local storage keys on mount/user change
  useEffect(() => {
    localStorage.removeItem('excalidraw');
    localStorage.removeItem('excalidraw-state');
    localStorage.removeItem('excalidraw-collab');
    localStorage.removeItem('version-dataState');
    localStorage.removeItem('version-files');
    localStorage.removeItem('excalidraw-library');
  }, [user]);

  // Cleanup local storage only on unload to ensure fresh cloud load next time
  useEffect(() => {
    const cleanup = () => {
      // Clear Excalidraw's local storage keys to prevent stale data persistence
      localStorage.removeItem('excalidraw');
      localStorage.removeItem('excalidraw-state');
      localStorage.removeItem('excalidraw-collab');
      localStorage.removeItem('version-dataState');
      localStorage.removeItem('version-files');
      localStorage.removeItem('excalidraw-library');
    };

    // Only cleanup on unload, not on mount
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
    };
  }, []);

  // Auto-load logic and initial fetch
  useEffect(() => {
    const init = async () => {
      // If user logs out, clear everything
      if (!user) {
        hasAutoLoadedRef.current = false;
        isInitializedRef.current = false; // Block saves
        setActiveCanvasId(null);
        setCanvasName('Untitled Canvas');
        setSavedCanvases([]);
        if (excalidrawAPIRef.current) {
          excalidrawAPIRef.current.resetScene();
        }
        return;
      }

      // Initialize theme from user settings
      if (user.settings && user.settings.canvasTheme) {
        setTheme(user.settings.canvasTheme);
      } else {
        setTheme('dark'); // Default if not set
      }


      // If user exists, proceed with auto-load
      if (!hasAutoLoadedRef.current) {
        hasAutoLoadedRef.current = true;
        isInitializedRef.current = false; // Block saves during init
        setReady(false);
        try {
          // Pass currentCanvasId from store to valid initialization
          await initializeCanvas(currentCanvasId);
        } catch (err) {
          console.error("Failed to fetch/load canvases", err);
          isInitializedRef.current = true; // Allow saves if error
          setReady(true);
        }
      } else {
        isInitializedRef.current = true;
        setReady(true);
      }
    };
    init();
  }, [user]); // Dependency on user only, since currentCanvasId is read once at mount

  // Effect to load canvas if selected from store (Modal opening or subsequent clicks)
  useEffect(() => {
    // Only handle if already initialized (to avoid race with init) and ID is present
    if (currentCanvasId && isInitializedRef.current && currentCanvasId !== activeCanvasId) {
      loadCanvas(currentCanvasId);
    }
  }, [currentCanvasId]);

  const fetchCanvases = async () => {
    try {
      if (!user) return;
      const now = Date.now();
      if (listFetchLockRef.current && now - listFetchTsRef.current < 1500) {
        return;
      }
      listFetchLockRef.current = true;
      listFetchTsRef.current = now;
      const res = await getCanvases(user._id);
      setSavedCanvases(res.data);
      listFetchLockRef.current = false;
    } catch (err) {
      console.error("Failed to fetch canvases", err);
      listFetchLockRef.current = false;
    }
  };

  const initializeCanvas = async (overrideId) => {
    setReady(false);
    setIsLoading(true);
    try {
      // Always fetch the list to ensure dropdown is up to date
      const listRes = await getCanvases(user._id);
      const canvases = Array.isArray(listRes.data) ? listRes.data : [];
      setSavedCanvases(canvases);

      if (overrideId) {
        // If a specific ID is requested, load it directly
        // loadCanvas handles fetching, parsing, and setting ready/initialData
        await loadCanvas(overrideId);
      } else {
        // If no ID is requested, load an EMPTY/UNTITLED canvas
        // We explicitly Do NOT load the last modified file here
        const emptyInitial = { elements: [], appState: { theme: user?.settings?.canvasTheme || 'dark' }, files: {}, scrollToContent: true };
        setInitialData(emptyInitial);

        lastSavedDataStringRef.current = JSON.stringify({ type: "excalidraw", version: 2, source: "pocket-snippet", ...emptyInitial });
        lastSavedNameRef.current = 'Untitled Canvas';
        lastSavedElementsRef.current = JSON.stringify([]);
        lastSavedFilesRef.current = JSON.stringify({});
        setActiveCanvasId(null);
        setCanvasName('Untitled Canvas');
        isInitializedRef.current = true;
        setReady(true);
      }
    } catch (err) {
      console.error('[PocketCanvas] Initialization failed', err);
      // Fallback to empty
      const emptyInitial = { elements: [], appState: { theme: user?.settings?.canvasTheme || 'dark' }, files: {}, scrollToContent: true };
      setInitialData(emptyInitial);
      setActiveCanvasId(null);
      setCanvasName('Untitled Canvas');
      isInitializedRef.current = true;
      setReady(true);
    } finally {
      setIsLoading(false);
    }
  };

  const activeCanvasIdRef = useRef(null);
  const isCreatingRef = useRef(false); // Lock for creation
  const pendingSaveRef = useRef(false); // Track if we have a save waiting

  // Sync state with ref
  useEffect(() => {
    activeCanvasIdRef.current = activeCanvasId;
  }, [activeCanvasId]);

  const handleSave = async (elements, appState, files, currentName) => {
    if (!user) return;

    // If locked for creation, pending save logic handles it... 
    if (isCreatingRef.current) {
      console.log('PocketCanvas: Creation in progress, marking pending save');
      pendingSaveRef.current = true;
      return;
    }

    // Check for changes to prevent loop
    const data = {
      type: "excalidraw",
      version: 2,
      source: "pocket-snippet",
      elements,
      appState,
      files
    };
    const dataString = JSON.stringify(data);
    const elementsString = JSON.stringify(elements || []);
    const filesString = JSON.stringify(files || {});

    // Safety: avoid resetting a non-empty canvas if a load failed and scene is empty
    if (
      activeCanvasIdRef.current &&
      (Array.isArray(elements) ? elements.length === 0 : true) &&
      (!files || Object.keys(files).length === 0) &&
      lastSavedElementsRef.current && lastSavedElementsRef.current !== JSON.stringify([])
    ) {
      setSavingStatus('saved');
      return;
    }

    // Only save when elements/files/name change; ignore ephemeral appState-only changes
    if (
      activeCanvasIdRef.current &&
      elementsString === lastSavedElementsRef.current &&
      filesString === lastSavedFilesRef.current &&
      currentName === lastSavedNameRef.current
    ) {
      setSavingStatus('saved');
      return;
    }

    setSavingStatus('saving');
    try {
      // Determine if this is a creation request
      const isCreation = !activeCanvasIdRef.current;

      if (isCreation) {
        isCreatingRef.current = true;
      }

      console.log('PocketCanvas: Saving canvas...', { name: currentName, id: activeCanvasIdRef.current, isCreation });


      const payload = {
        userId: user._id,
        name: currentName,
        data: JSON.stringify(data),
        canvasId: activeCanvasIdRef.current // Use ref for latest ID
      };

      const res = await saveCanvas(payload);
      console.log('PocketCanvas: Save success', res.data);

      // Update refs on successful save
      lastSavedDataStringRef.current = dataString;
      lastSavedNameRef.current = currentName;
      lastSavedElementsRef.current = elementsString;
      lastSavedFilesRef.current = filesString;

      // If it was a new canvas, update ID immediately in ref and state
      if (isCreation && res.data.canvas._id) {
        activeCanvasIdRef.current = res.data.canvas._id; // Immediate update
        setActiveCanvasId(res.data.canvas._id); // State update for UI
        isCreatingRef.current = false; // Release lock
        // Persist last active for this user
        localStorage.setItem(`pocketCanvas:lastActive:${user._id}`, res.data.canvas._id);
        // Also refresh list to show new canvas
        fetchCanvases();
      } else {
        // Just update list to reflect partial updates (like time)
        if (activeCanvasIdRef.current) {
          localStorage.setItem(`pocketCanvas:lastActive:${user._id}`, activeCanvasIdRef.current);
        }
        fetchCanvases();
      }

      // If we have a pending save (from edits during creation), fire it now
      if (pendingSaveRef.current) {
        console.log('PocketCanvas: Executing pending save...');
        pendingSaveRef.current = false;

        if (lastCanvasDataRef.current) {
          handleSave(
            lastCanvasDataRef.current.elements,
            lastCanvasDataRef.current.appState,
            lastCanvasDataRef.current.files,
            canvasName
          );
        } else {
          // Should not happen if pending is true, but safe fallback
          setSavingStatus('saved');
        }
      } else {
        setSavingStatus('saved');
      }

    } catch (err) {
      console.error("Save error", err);
      setSavingStatus('error');
      isCreatingRef.current = false; // Release lock on error too
    }
  };

  // Debounced save function
  // We use useRef to keep the latest name and ID without recreating the debounced func
  // The `latestState` ref for `name` and `id` is no longer needed as `activeCanvasIdRef` handles ID
  // and `canvasName` can be passed directly to `debouncedSave`
  const debouncedSave = useCallback(
    debounce((elements, appState, files, name) => {
      handleSave(elements, appState, files, name);
    }, 2000),
    [user] // Re-create if user changes
  );

  const lastCanvasDataRef = useRef(null);

  const onChange = (elements, appState, files) => {
    if (!user || isLoading || !isInitializedRef.current) return;
    lastCanvasDataRef.current = { elements, appState, files }; // Cache latest data
    setSavingStatus('saving'); // Set to saving immediately on change
    // Pass current name directly to avoid stale closuers in debounce
    debouncedSave(elements, appState, files, canvasName);
  };

  const loadCanvas = async (canvasId) => {
    // Cancel any pending save to avoid race conditions
    debouncedSave.cancel();

    try {
      setIsLoading(true);

      // Clear localStorage to ensure cloud data takes precedence
      localStorage.removeItem('excalidraw');
      localStorage.removeItem('excalidraw-state');
      localStorage.removeItem('excalidraw-collab');

      const res = await getCanvas(canvasId);
      const { canvas, data } = res.data;
      console.log('[PocketCanvas] getCanvas response', {
        id: canvas?.id || canvas?._id || canvasId,
        name: canvas?.name,
        type: typeof data,
        strLen: typeof data === 'string' ? data.length : undefined,
        keys: data && typeof data === 'object' ? Object.keys(data) : [],
      });
      let restored;
      try {
        const parsed = decodePayload(data);
        const blob = new Blob([JSON.stringify(parsed || {})], { type: 'application/json' });
        restored = await loadFromBlob(blob, null, null);
      } catch (e) {
        restored = { elements: [], appState: {}, files: {} };
      }

      setCanvasName(canvas.name);
      setActiveCanvasId(canvas._id);
      localStorage.setItem(`pocketCanvas:lastActive:${user._id}`, canvas._id);

      // Update refs to reflect loaded data as "saved"
      const dataString = JSON.stringify(restored);
      lastSavedDataStringRef.current = dataString;
      lastSavedNameRef.current = canvas.name;
      lastSavedElementsRef.current = JSON.stringify(restored.elements || []);
      lastSavedFilesRef.current = JSON.stringify(restored.files || {});

      // Use Excalidraw API to update scene if available (avoids Provider isolation errors)
      if (excalidrawAPIRef.current) {
        // Sanitize appState to remove transient/incompatible data
        const sanitizedAppState = { ...(restored.appState || {}), theme: user?.settings?.canvasTheme || 'dark' };

        delete sanitizedAppState.collaborators; // Fixes "forEach is not a function" error

        console.log("[PocketCanvas] Loading data into Excalidraw:", {
          elements: (restored.elements || []).length,
          appStateKeys: Object.keys(sanitizedAppState)
        });

        excalidrawAPIRef.current.updateScene({
          elements: restored.elements || [],
          appState: sanitizedAppState,
          commitToHistory: true,
          scrollToContent: true // Ensure content is visible
        });
        // Add files if any
        if (restored.files && Object.keys(restored.files).length > 0) {
          excalidrawAPIRef.current.addFiles(Object.values(restored.files));
        }
      } else {
        // Fallback for initial load before API is ready
        setInitialData({
          elements: restored.elements || [],
          appState: { ...restored.appState || {}, theme: user?.settings?.canvasTheme || 'dark' },

          files: restored.files || {},
          scrollToContent: true,
        });
        setReady(true);
      }

      // Set status to saved after successful load
      setSavingStatus('saved');
      setShowCanvasList(false);
    } catch (err) {
      console.error("Load error", err);
      toast.error("Failed to load canvas");
    } finally {
      setIsLoading(false);
      isInitializedRef.current = true; // Unblock saves after load
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    // Excalidraw handles localStorage update internally via useHandleAppTheme

    if (user) {
      try {
        await updateProfile({
          settings: {
            ...user.settings,
            canvasTheme: newTheme
          }
        });
      } catch (err) {
        console.error("Failed to persist theme preference", err);
      }
    }
  };

  const createNewCanvas = () => {
    setCanvasName('Untitled Canvas');
    setActiveCanvasId(null);

    // Clear canvas using API if available
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        elements: [],
        appState: { theme: user?.settings?.canvasTheme || 'dark' },

        commitToHistory: false
      });
    }

    setShowCanvasList(false);
    setSavingStatus('saved');
  };

  const [remountKey, setRemountKey] = useState(0);

  return (
    <div className="relative h-full w-full">
      {/* Custom Top Bar Overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-[50px] z-[5] pointer-events-none flex items-center"
        style={{ paddingLeft: '60px' }} // Approx space for Files button
      >
        <div className="pointer-events-auto flex items-center bg-surface-light/80 backdrop-blur-sm rounded-md px-2 py-1 gap-2 border border-border shadow-sm">

          {/* Canvas Name Input */}
          <input
            value={canvasName}
            onChange={(e) => {
              const newName = e.target.value;
              setCanvasName(newName);

              if (lastCanvasDataRef.current) {
                // Use debounced save to avoid spamming API on every keystroke
                debouncedSave(
                  lastCanvasDataRef.current.elements,
                  lastCanvasDataRef.current.appState,
                  lastCanvasDataRef.current.files,
                  newName
                );
              }
            }}
            className="bg-transparent text-sm font-medium text-text outline-none focus:border-b border-accent min-w-[150px]"
            placeholder="Untitled Canvas"
          />


          {/* Load Canvas Menu */}
          <div className="relative">
            <button
              onClick={() => setShowCanvasList(!showCanvasList)}
              className="flex items-center text-xs text-text hover:bg-surface p-1 rounded transition-colors"
            >
              Load <ChevronDown size={12} className="ml-1" />
            </button>

            {showCanvasList && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded shadow-lg max-h-60 overflow-y-auto z-50">
                <div
                  onClick={createNewCanvas}
                  className="px-3 py-2 hover:bg-surface-light cursor-pointer flex items-center text-sm border-b border-border/50 text-accent"
                >
                  <File size={14} className="mr-2" /> New Canvas
                </div>
                {savedCanvases.map(c => (
                  <div
                    key={c._id}
                    onClick={() => loadCanvas(c._id)}
                    className={`px-3 py-2 hover:bg-surface-light cursor-pointer flex items-center text-sm ${activeCanvasId === c._id ? 'bg-surface-light font-medium' : ''}`}
                  >
                    <span className="truncate flex-1">{c.name}</span>
                    <span className="text-[10px] text-text-muted ml-2">{new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {savedCanvases.length === 0 && (
                  <div className="px-3 py-2 text-xs text-text-muted text-center">No saved canvases</div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>


      <div style={{ height: "100%", width: "100%" }} className="excalidraw-app">
        {ready ? (
          <ExcalidrawApp
            {...props}
            initialData={initialData}
            onChange={onChange}
            onAPIReady={(api) => {
              excalidrawAPIRef.current = api;
            }}
            onThemeChange={handleThemeChange}
          />

        ) : (
          <div className="flex items-center justify-center h-full w-full text-text-muted">
            <Loader className="animate-spin mr-2" size={16} /> Loading canvas…
          </div>
        )}
      </div>
    </div>
  );
};

export default PocketCanvas;
