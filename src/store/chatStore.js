import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useChatStore = create(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],
      isLoading: false,
      mode: 'chat', // 'chat' or 'compiler'
      input: '',
      setInput: (input) => set({ input }),

      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

      setIsOpen: (isOpen) => set({ isOpen }),

      setMode: (mode) => set({ mode }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          ...message
        }]
      })),

      setLoading: (loading) => set({ isLoading: loading }),

      clearChat: () => set({ messages: [] }),

      reset: () => set({
        isOpen: false,
        messages: [],
        isLoading: false,
        mode: 'chat',
        input: ''
      })
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useChatStore;
