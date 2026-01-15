import React, { useEffect, useState, useRef, useCallback } from 'react';
import ExcalidrawApp from '../../lib/excalidraw-app/App';
import '../../lib/excalidraw-app/index.scss';
import { useAuth } from '../../context/AuthContext';
import { saveCanvas, getCanvases, getCanvas } from '../../api/api';
import toast from 'react-hot-toast';
import { Cloud, Check, Loader, ChevronDown, File } from 'lucide-react';
import { debounce } from 'lodash';

// Define environment variables expected by the app
if (!window.process) {
  window.process = { env: { NODE_ENV: 'development' } };
}

const PocketCanvas = (props) => {
  const { user } = useAuth();
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [savedCanvases, setSavedCanvases] = useState([]);
  const [savingStatus, setSavingStatus] = useState('saved'); // saved, saving, error
  const [initialData, setInitialData] = useState(null);
  const [showCanvasList, setShowCanvasList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const lastSavedDataStringRef = useRef(""); // To prevent redundant saves
  const lastSavedNameRef = useRef(canvasName);
  const hasAutoLoadedRef = useRef(false);
  const excalidrawAPIRef = useRef(null); // Ref to access Excalidraw API

  // Cleanup local storage only on unload to ensure fresh cloud load next time
  useEffect(() => {
    const cleanup = () => {
      // Clear Excalidraw's local storage keys to prevent stale data persistence
      localStorage.removeItem('excalidraw');
      localStorage.removeItem('excalidraw-state');
      localStorage.removeItem('excalidraw-collab');
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
      if (user && !hasAutoLoadedRef.current) {
        hasAutoLoadedRef.current = true;
        try {
          const res = await getCanvases(user._id);
          setSavedCanvases(res.data);

          // Auto-load latest if exists
          if (res.data && res.data.length > 0) {
            const latest = res.data[0]; // Assuming sorted by updatedAt desc in backend
            console.log("[PocketCanvas] Auto-loading latest canvas:", { id: latest._id, name: latest.name, r2Key: latest.r2Key });
            await loadCanvas(latest._id);
            console.log("[PocketCanvas] Auto-load complete");
          } else {
            console.log("[PocketCanvas] No saved canvases to auto-load");
          }
        } catch (err) {
          console.error("Failed to fetch/load canvases", err);
        }
      } else if (user) {
        fetchCanvases();
      }
    };
    init();
  }, [user]);

  const fetchCanvases = async () => {
    try {
      if (!user) return;
      const res = await getCanvases(user._id);
      setSavedCanvases(res.data);
    } catch (err) {
      console.error("Failed to fetch canvases", err);
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
      elements,
      appState,
      files
    };
    const dataString = JSON.stringify(data);

    // If data AND name are identical to last save, skip
    // We store the exact string sent to backend to ensure parity
    // Note: We need to check if we have a valid ID too. If we don't have ID, we MUST save (create).
    if (activeCanvasIdRef.current &&
      dataString === lastSavedDataStringRef.current &&
      currentName === lastSavedNameRef.current) {
      // console.log('PocketCanvas: No changes detected, skipping save');
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

      // If it was a new canvas, update ID immediately in ref and state
      if (isCreation && res.data.canvas._id) {
        activeCanvasIdRef.current = res.data.canvas._id; // Immediate update
        setActiveCanvasId(res.data.canvas._id); // State update for UI
        isCreatingRef.current = false; // Release lock
        // Also refresh list to show new canvas
        fetchCanvases();
      } else {
        // Just update list to reflect partial updates (like time)
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
    if (!user || isLoading) return;
    lastCanvasDataRef.current = { elements, appState, files }; // Cache latest data
    setSavingStatus('saving'); // Set to saving immediately on change
    // Pass current name directly to avoid stale closuers in debounce
    debouncedSave(elements, appState, files, canvasName);
  };

  const loadCanvas = async (canvasId) => {
    try {
      setIsLoading(true);

      // Clear localStorage to ensure cloud data takes precedence
      localStorage.removeItem('excalidraw');
      localStorage.removeItem('excalidraw-state');
      localStorage.removeItem('excalidraw-collab');

      const res = await getCanvas(canvasId);
      const { canvas, data } = res.data;

      setCanvasName(canvas.name);
      setActiveCanvasId(canvas._id);

      // Update refs to reflect loaded data as "saved"
      const dataString = JSON.stringify(data);
      lastSavedDataStringRef.current = dataString;
      lastSavedNameRef.current = canvas.name;

      // Use Excalidraw API to update scene if available (avoids Provider isolation errors)
      if (excalidrawAPIRef.current) {
        excalidrawAPIRef.current.updateScene({
          elements: data.elements,
          appState: data.appState,
          commitToHistory: true
        });
        // Add files if any
        if (data.files && Object.keys(data.files).length > 0) {
          excalidrawAPIRef.current.addFiles(Object.values(data.files));
        }
      } else {
        // Fallback for initial load before API is ready
        setInitialData({
          elements: data.elements,
          appState: data.appState,
          files: data.files,
          scrollToContent: true
        });
      }

      // Set status to saved after successful load
      setSavingStatus('saved');
      setShowCanvasList(false);
    } catch (err) {
      console.error("Load error", err);
      toast.error("Failed to load canvas");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewCanvas = () => {
    setCanvasName('Untitled Canvas');
    setActiveCanvasId(null);

    // Clear canvas using API if available
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        elements: [],
        appState: {},
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
        <ExcalidrawApp
          {...props}
          initialData={initialData}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default PocketCanvas;
