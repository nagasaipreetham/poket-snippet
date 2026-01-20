import React, { useEffect, useState } from 'react';
import { Share2, Palette } from 'lucide-react'; // Using Palette for Canvas icon to match sidebar
import usePocketCanvasStore from '../store/pocketCanvasStore';
import { useAuth } from '../context/AuthContext';
import { getUserCanvases } from '../services/canvasService';
import { Link } from 'react-router-dom';

const PocketCanvas = () => {
  const { user } = useAuth();
  const { openCanvasWithId } = usePocketCanvasStore();
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchCanvases();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-8 pt-12">
      <h1 className="text-3xl font-bold text-white mb-8">Poket Canvas</h1>

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
    </div>
  );
};

export default PocketCanvas;
