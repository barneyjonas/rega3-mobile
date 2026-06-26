const BASE_URL = 'https://rega3-server-production.up.railway.app'
const WS_URL = BASE_URL.replace('https://', 'wss://')

// ── REST ──────────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

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

export const api = {
  register(username: string, display_name: string) {
    return post<{ user: ApiUser }>('/auth/register', { username, display_name })
  },

  getUsers() {
    return get<{ users: ApiUser[] }>('/users')
  },

  getOrCreateDirect(user_a: string, user_b: string) {
    return post<{ conversation: ApiConversation }>('/conversations/direct', { user_a, user_b })
  },

  getConversations(userId: string) {
    return get<{ conversations: ApiConversationWithMembers[] }>(`/users/${userId}/conversations`)
  },

  getMessages(convId: string, limit = 50) {
    return get<{ messages: ApiMessage[] }>(`/conversations/${convId}/messages?limit=${limit}`)
  },
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

type WsListener = (msg: Record<string, unknown>) => void

class RealtimeClient {
  private ws: WebSocket | null = null
  private userId: string | null = null
  private listeners = new Set<WsListener>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0

  connect(userId: string) {
    this.userId = userId
    this.reconnectAttempt = 0
    this._open()
  }

  private _open() {
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
    }
    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      this.reconnectAttempt = 0
      this.ws!.send(JSON.stringify({ type: 'identify', userId: this.userId }))
    }

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Record<string, unknown>
        this.listeners.forEach((fn) => fn(msg))
      } catch {}
    }

    this.ws.onclose = () => {
      const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempt))
      this.reconnectAttempt++
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      this.reconnectTimer = setTimeout(() => this._open(), delay)
    }
  }

  send(data: object) {
    if (this.ws?.readyState === 1) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(fn: WsListener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null }
    this.userId = null
  }
}

export const realtime = new RealtimeClient()
