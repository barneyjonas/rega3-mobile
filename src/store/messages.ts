import { create } from 'zustand'
import type { Message, PendingMessage } from '../types/message'

interface MessagesState {
  messages: Record<string, Message[]>
  pendingMessages: Record<string, PendingMessage[]>
  debounceEndTime: Record<string, number | null>
  lastMerge: { id: string; count: number } | null

  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, msgId: string, patch: Partial<Message>) => void
  addPendingMessage: (conversationId: string, message: PendingMessage) => void
  clearPending: (conversationId: string) => void
  setDebounceEndTime: (conversationId: string, time: number | null) => void
  setLastMerge: (id: string, count: number) => void
  clearLastMerge: () => void
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messages: {},
  pendingMessages: {},
  debounceEndTime: {},
  lastMerge: null,

  setMessages: (conversationId, messages) =>
    set((state) => ({ messages: { ...state.messages, [conversationId]: messages } })),

  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), message],
      },
    })),

  updateMessage: (conversationId, msgId, patch) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m.id === msgId ? { ...m, ...patch } : m
        ),
      },
    })),

  addPendingMessage: (conversationId, message) =>
    set((state) => ({
      pendingMessages: {
        ...state.pendingMessages,
        [conversationId]: [...(state.pendingMessages[conversationId] ?? []), message],
      },
    })),

  clearPending: (conversationId) =>
    set((state) => ({
      pendingMessages: { ...state.pendingMessages, [conversationId]: [] },
      debounceEndTime: { ...state.debounceEndTime, [conversationId]: null },
    })),

  setDebounceEndTime: (conversationId, time) =>
    set((state) => ({
      debounceEndTime: { ...state.debounceEndTime, [conversationId]: time },
    })),

  setLastMerge: (id, count) => set({ lastMerge: { id, count } }),
  clearLastMerge: () => set({ lastMerge: null }),
}))
