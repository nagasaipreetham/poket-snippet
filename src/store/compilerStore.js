import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCompilerStore = create(
  persist(
    (set) => ({
      code: '// Write your code here...',
      setCode: (code) => set({ code }),
      reset: () => set({ code: '// Write your code here...' }),
    }),
    {
      name: 'compiler-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useCompilerStore;
