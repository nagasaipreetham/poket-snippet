import React, { useEffect, useState, useRef } from 'react';
import { Share2, Palette, Plus, X, MoreVertical, Trash2, AlertTriangle } from 'lucide-react'; // Added icons
import usePocketCanvasStore from '../store/pocketCanvasStore';
import { useAuth } from '../context/AuthContext';
import { getUserCanvases, deleteCanvas } from '../services/canvasService'; // Added deleteCanvas
import { saveCanvas } from '../api/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PocketCanvas = () => {
  const { user } = useAuth();
  const { openCanvasWithId } = usePocketCanvasStore();
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Menu & Deletion State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null); // Track which canvas is pending deletion
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
        setDeleteConfirmationId(null); // Reset confirmation on close
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  const fetchCanvases = async () => {
    if (user?._id) {
      try {
        const data = await getUserCanvases(user._id);
        setCanvases(data);
      } catch (error) {
        console.error("Failed to load canvases", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCanvases();
  }, [user]);

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) {
      toast.error('Please enter a canvas name');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        userId: user._id,
        name: newCanvasName,
        data: JSON.stringify({ elements: [], appState: { theme: 'dark' }, files: {} }) // Initial empty state
      };

      const res = await saveCanvas(payload);

      if (res.data && res.data.canvas) {
        toast.success('Canvas created successfully');
        setIsCreateModalOpen(false);
        setNewCanvasName('');
        await fetchCanvases(); // Refresh list
        openCanvasWithId(res.data.canvas._id); // Open immediately
      }
    } catch (error) {
      console.error('Failed to create canvas', error);
      toast.error('Failed to create canvas');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMenuClick = (e, canvasId) => {
    e.stopPropagation();
    if (activeMenuId === canvasId) {
      setActiveMenuId(null);
      setDeleteConfirmationId(null);
    } else {
      setActiveMenuId(canvasId);
      setDeleteConfirmationId(null);
    }
  };

  const handleDeleteClick = (e, canvasId) => {
    e.stopPropagation();
    if (deleteConfirmationId === canvasId) {
      // Confirmed, proceed to delete
      confirmDelete(canvasId);
    } else {
      // First click, show confirmation
      setDeleteConfirmationId(canvasId);
    }
  };

  const confirmDelete = async (canvasId) => {
    const toastId = toast.loading('Deleting canvas...');
    try {
      await deleteCanvas(canvasId);
      toast.success('Canvas deleted successfully', { id: toastId });

      // Update local state directly for speed
      setCanvases(prev => prev.filter(c => c._id !== canvasId));

      setActiveMenuId(null);
      setDeleteConfirmationId(null);
    } catch (error) {
      console.error("Delete failed", error);
      toast.error('Failed to delete canvas', { id: toastId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 pt-12 relative">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Poket Canvas</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-lg"
        >
          <Plus size={18} />
          <span>Create</span>
        </button>
      </div>

      {/* Created Canvas Section */}
      <section className="mb-10 min-h-[50vh]">
        <div className="flex items-center space-x-2 text-text-muted mb-4">
          <Share2 size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Created Canvas</h2>
        </div>

        {loading ? (
          <div className="text-text-muted italic">Loading...</div>
        ) : canvases.length === 0 ? (
          <div className="text-text-muted italic bg-surface/50 p-6 rounded-lg text-center border border-dashed border-border">
            No canvas created yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {canvases.map((canvas) => (
              <div
                key={canvas._id}
                className="bg-surface hover:bg-surface-hover transition-colors p-4 rounded-lg border border-border flex flex-col justify-between group h-32 cursor-pointer relative"
                onClick={() => openCanvasWithId(canvas._id)}
              >
                {/* Note: We refrain from adding Link logic yet as requested, just displaying details */}
                <div className="flex items-start justify-between">
                  <Palette className="text-text-muted group-hover:text-purple-400 transition-colors" size={24} />

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-muted">{new Date(canvas.updatedAt).toLocaleDateString()}</span>

                    {/* Menu Trigger */}
                    <button
                      className="text-text-muted hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors relative z-20"
                      onClick={(e) => handleMenuClick(e, canvas._id)}
                    >
                      <MoreVertical size={14} />
                    </button>

                    {/* Popup Menu */}
                    {activeMenuId === canvas._id && (
                      <div
                        ref={menuRef}
                        className="absolute top-8 right-2 w-48 bg-[#252526] border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5"
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                      >
                        <button
                          onClick={(e) => handleDeleteClick(e, canvas._id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors 
                              ${deleteConfirmationId === canvas._id
                              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                              : 'text-text hover:text-red-400 hover:bg-white/5'
                            }`}
                        >
                          <span className="flex items-center space-x-2">
                            {deleteConfirmationId === canvas._id ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
                            <span>{deleteConfirmationId === canvas._id ? 'Confirm Delete' : 'Delete'}</span>
                          </span>
                          {deleteConfirmationId !== canvas._id && <Trash2 size={12} className="opacity-50" />}
                          {deleteConfirmationId === canvas._id && <span className="sr-only">Confirm</span>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-medium text-text group-hover:text-white truncate mt-2 pr-6" title={canvas.name}>{canvas.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* Create Canvas Modal */}
      {
        isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-[#1e1e1e] border border-border rounded-xl shadow-2xl p-6 w-[400px] relative">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-6">Create New Canvas</h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <label className="text-text-muted whitespace-nowrap">Name canvas :</label>
                  <input
                    value={newCanvasName}
                    onChange={(e) => setNewCanvasName(e.target.value)}
                    placeholder="Enter name..."
                    autoFocus
                    className="bg-surface border border-border rounded px-3 py-1.5 text-white outline-none focus:border-accent w-full"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCanvas()}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleCreateCanvas}
                    disabled={isCreating}
                    className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default PocketCanvas;
