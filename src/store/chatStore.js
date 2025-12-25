import { create } from 'zustand';

const useChatStore = create((set) => ({
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

  clearChat: () => set({ messages: [] })
}));

export default useChatStore;
