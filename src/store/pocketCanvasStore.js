import { create } from 'zustand';

const usePocketCanvasStore = create((set) => ({
  isOpen: false,
  currentCanvasId: null,
  openCanvas: () => set({ isOpen: true, currentCanvasId: null }), // Open empty/default
  openCanvasWithId: (id) => set({ isOpen: true, currentCanvasId: id }),
  closeCanvas: () => set({ isOpen: false }),
  toggleCanvas: () => set((state) => ({ isOpen: !state.isOpen, currentCanvasId: null })),
}));

export default usePocketCanvasStore;
