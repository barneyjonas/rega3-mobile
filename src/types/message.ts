export type MessageSender = 'me' | 'them'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

export interface Message {
  id: string
  conversation_id: string
  text: string
  sender: MessageSender
  timestamp: number
  status: MessageStatus
}

export interface PendingMessage {
  id: string
  text: string
  timestamp: number
}
