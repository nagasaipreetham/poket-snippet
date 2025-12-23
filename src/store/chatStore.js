import { create } from 'zustand';

const useChatStore = create((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  setIsOpen: (isOpen) => set({ isOpen }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...message
    }]
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearChat: () => set({ messages: [] })
}));

export default useChatStore;
