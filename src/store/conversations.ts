import { create } from 'zustand'
import type { Conversation } from '../types/conversation'

const CONTACT_COLORS = ['#e11d48', '#0284c7', '#7c3aed', '#059669', '#d97706', '#db2777']

function colorFor(userId: string) {
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length]
}

export function makeConversation(
  id: string,
  otherUser: { id: string; display_name: string },
  lastMessage?: string,
  lastMessageTime?: number
): Conversation {
  const initials = otherUser.display_name.slice(0, 1)
  return {
    id,
    contact_name: otherUser.display_name,
    contact_initials: initials,
    contact_color: colorFor(otherUser.id),
    last_message: lastMessage ?? '',
    last_message_time: lastMessageTime ?? Date.now(),
    unread_count: 0,
    is_pinned: 0,
    is_muted: 0,
    is_online: 0,
  }
}

interface ConversationsState {
  conversations: Conversation[]
  activeConversationId: string | null
  setConversations: (convs: Conversation[]) => void
  addConversation: (conv: Conversation) => void
  setActiveConversation: (id: string | null) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  activeConversationId: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conv) =>
    set((state) => {
      if (state.conversations.some((c) => c.id === conv.id)) return state
      return { conversations: [conv, ...state.conversations] }
    }),

  setActiveConversation: (activeConversationId) => set({ activeConversationId }),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
}))
