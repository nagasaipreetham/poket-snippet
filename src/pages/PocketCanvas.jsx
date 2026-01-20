import React, { useEffect, useState } from 'react';
import { Share2, Palette, Plus, X } from 'lucide-react'; // Using Palette for Canvas icon to match sidebar
import usePocketCanvasStore from '../store/pocketCanvasStore';
import { useAuth } from '../context/AuthContext';
import { getUserCanvases } from '../services/canvasService';
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
      <section className="mb-10">
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
                className="bg-surface hover:bg-surface-hover transition-colors p-4 rounded-lg border border-border flex flex-col justify-between group h-32 cursor-pointer"
                onClick={() => openCanvasWithId(canvas._id)}
              >
                {/* Note: We refrain from adding Link logic yet as requested, just displaying details */}
                <div className="flex items-start justify-between">
                  <Palette className="text-text-muted group-hover:text-purple-400 transition-colors" size={24} />
                  <span className="text-xs text-text-muted">{new Date(canvas.updatedAt).toLocaleDateString()}</span>
                </div>
                <span className="font-medium text-text group-hover:text-white truncate mt-2">{canvas.name}</span>
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
