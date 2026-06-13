export interface Conversation {
  id: string
  contact_name: string
  contact_initials: string
  contact_color: string
  last_message: string
  last_message_time: number
  unread_count: number
  is_pinned: 0 | 1
  is_muted: 0 | 1
  is_online: 0 | 1
}
