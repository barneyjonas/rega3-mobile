import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from './data/mockData'

const MOCK_ME_ID = 'mock-me'

// ── Types (unchanged interface so all existing imports keep working) ──────────

export interface ApiUser {
  id: string
  username: string
  display_name: string
  created_at: number
}

export interface ApiConversation {
  id: string
  created_at: number
}

export interface ApiMessage {
  id: string
  conversation_id: string
  sender_id: string
  text: string
  timestamp: number
  status: string
}

export interface ApiConversationWithMembers {
  id: string
  members: ApiUser[]
  last_message: ApiMessage | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toApiMessages(convId: string): ApiMessage[] {
  return (MOCK_MESSAGES[convId] ?? []).map((m) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    sender_id: m.sender === 'me' ? MOCK_ME_ID : convId + '-contact',
    text: m.text,
    timestamp: m.timestamp,
    status: m.status,
  }))
}

function toApiConversations(): ApiConversationWithMembers[] {
  return MOCK_CONVERSATIONS.map((conv) => {
    const msgs = toApiMessages(conv.id)
    const last = msgs[msgs.length - 1] ?? null
    return {
      id: conv.id,
      members: [
        { id: MOCK_ME_ID, username: 'me', display_name: 'Me', created_at: 0 },
        { id: conv.id + '-contact', username: conv.contact_name, display_name: conv.contact_name, created_at: 0 },
      ],
      last_message: last,
    }
  })
}

// ── Mock API ──────────────────────────────────────────────────────────────────

export const api = {
  register(username: string, display_name: string) {
    return Promise.resolve({
      user: { id: MOCK_ME_ID, username, display_name, created_at: Date.now() } as ApiUser,
    })
  },

  getUsers() {
    const users: ApiUser[] = MOCK_CONVERSATIONS.map((conv) => ({
      id: conv.id + '-contact',
      username: conv.contact_name,
      display_name: conv.contact_name,
      created_at: 0,
    }))
    return Promise.resolve({ users })
  },

  getOrCreateDirect(_user_a: string, _user_b: string) {
    return Promise.resolve({
      conversation: { id: `direct-${Date.now()}`, created_at: Date.now() } as ApiConversation,
    })
  },

  getConversations(_userId: string) {
    return Promise.resolve({ conversations: toApiConversations() })
  },

  getMessages(convId: string, _limit = 50) {
    return Promise.resolve({ messages: toApiMessages(convId) })
  },
}

// ── No-op realtime (replaces WebSocket) ──────────────────────────────────────

type WsListener = (msg: Record<string, unknown>) => void

class MockRealtimeClient {
  connect(_userId: string) {}
  send(_data: object) {}
  on(_fn: WsListener) { return () => {} }
  disconnect() {}
}

export const realtime = new MockRealtimeClient()
