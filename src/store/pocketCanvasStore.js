import { create } from 'zustand';

const usePocketCanvasStore = create((set) => ({
  isOpen: false,
  openCanvas: () => set({ isOpen: true }),
  closeCanvas: () => set({ isOpen: false }),
  toggleCanvas: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export default usePocketCanvasStore;
