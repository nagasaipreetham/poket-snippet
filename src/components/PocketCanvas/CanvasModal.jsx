import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import usePocketCanvasStore from '../../store/pocketCanvasStore';
import PocketCanvas from './PocketCanvas';

const CanvasModal = () => {
  const { isOpen, closeCanvas } = usePocketCanvasStore();

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-[5px] z-[100] bg-[#1e1e1e] flex flex-col animate-in fade-in zoom-in-95 duration-200 rounded-xl overflow-hidden shadow-2xl border border-[#333]">
      {/* Header / Toolbar */}
      {/* Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        <PocketCanvas
          customTopRightUI={
            <button
              onClick={closeCanvas}
              style={{ height: "36px", width: "36px" }}
              className="flex items-center justify-center bg-[#252526] hover:bg-[#333] rounded-lg text-gray-400 hover:text-white border border-[#333] transition-colors ml-2"
              title="Close Pocket Canvas"
            >
              <X size={18} />
            </button>
          }
        />
      </div>
    </div>
  );
};

export default CanvasModal;
