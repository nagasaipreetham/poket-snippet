import { create } from 'zustand';

const useCompilerStore = create((set) => ({
  code: '// Write your code here...',
  setCode: (code) => set({ code }),
}));

export default useCompilerStore;
