import type { Conversation } from '../types/conversation'
import type { Message } from '../types/message'

const now = Date.now()
const min = 60 * 1000
const hr = 60 * min

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'mock-1', contact_name: 'ניר כהן', contact_initials: 'נ',
    contact_color: '#7c3aed', last_message: 'מה קורה? 😄',
    last_message_time: now - 2 * min, unread_count: 3,
    is_online: 1, is_pinned: 0, is_muted: 0,
  },
  {
    id: 'mock-2', contact_name: 'מאיה לוי', contact_initials: 'מ',
    contact_color: '#059669', last_message: 'אוקיי אז מחר ב-8?',
    last_message_time: now - 18 * min, unread_count: 0,
    is_online: 0, is_pinned: 0, is_muted: 0,
  },
  {
    id: 'mock-3', contact_name: 'אבא', contact_initials: 'א',
    contact_color: '#d97706', last_message: 'תתקשר אלינו בערב',
    last_message_time: now - 2 * hr, unread_count: 1,
    is_online: 0, is_pinned: 0, is_muted: 0,
  },
  {
    id: 'mock-4', contact_name: 'צוות העבודה', contact_initials: 'צ',
    contact_color: '#0284c7', last_message: 'הפגישה נדחתה לשעה 3',
    last_message_time: now - 5 * hr, unread_count: 0,
    is_online: 0, is_pinned: 0, is_muted: 0,
  },
  {
    id: 'mock-5', contact_name: 'דוד', contact_initials: 'ד',
    contact_color: '#e11d48', last_message: '👍',
    last_message_time: now - 25 * hr, unread_count: 0,
    is_online: 0, is_pinned: 0, is_muted: 0,
  },
  {
    id: 'mock-6', contact_name: 'שרה', contact_initials: 'ש',
    contact_color: '#db2777', last_message: 'תודה רבה! 🙏',
    last_message_time: now - 48 * hr, unread_count: 0,
    is_online: 1, is_pinned: 0, is_muted: 0,
  },
]

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'mock-1': [
    { id: 'm1-1', conversation_id: 'mock-1', text: 'היי מה נשמע!', sender: 'them', timestamp: now - 30 * min, status: 'read' },
    { id: 'm1-2', conversation_id: 'mock-1', text: 'הכל טוב, מה אתך?', sender: 'me', timestamp: now - 28 * min, status: 'read' },
    { id: 'm1-3', conversation_id: 'mock-1', text: 'גם טוב! עובד על הפרויקט?', sender: 'them', timestamp: now - 15 * min, status: 'read' },
    { id: 'm1-4', conversation_id: 'mock-1', text: 'כן, כמעט גמרנו', sender: 'me', timestamp: now - 12 * min, status: 'read' },
    { id: 'm1-5', conversation_id: 'mock-1', text: 'מה קורה? 😄', sender: 'them', timestamp: now - 2 * min, status: 'delivered' },
  ],
  'mock-2': [
    { id: 'm2-1', conversation_id: 'mock-2', text: 'אתה פנוי מחר?', sender: 'them', timestamp: now - 40 * min, status: 'read' },
    { id: 'm2-2', conversation_id: 'mock-2', text: 'כן, מה הולך?', sender: 'me', timestamp: now - 38 * min, status: 'read' },
    { id: 'm2-3', conversation_id: 'mock-2', text: 'אפשר להיפגש ב-8?', sender: 'them', timestamp: now - 35 * min, status: 'read' },
    { id: 'm2-4', conversation_id: 'mock-2', text: 'בטח, אני שם!', sender: 'me', timestamp: now - 30 * min, status: 'read' },
    { id: 'm2-5', conversation_id: 'mock-2', text: 'אוקיי אז מחר ב-8?', sender: 'them', timestamp: now - 18 * min, status: 'read' },
  ],
  'mock-3': [
    { id: 'm3-1', conversation_id: 'mock-3', text: 'שלום בן, איך עובר עליך?', sender: 'them', timestamp: now - 3 * hr, status: 'read' },
    { id: 'm3-2', conversation_id: 'mock-3', text: 'שלום אבא, הכל בסדר!', sender: 'me', timestamp: now - 2.5 * hr, status: 'read' },
    { id: 'm3-3', conversation_id: 'mock-3', text: 'תתקשר אלינו בערב', sender: 'them', timestamp: now - 2 * hr, status: 'delivered' },
  ],
  'mock-4': [
    { id: 'm4-1', conversation_id: 'mock-4', text: 'בוקר טוב לכולם!', sender: 'them', timestamp: now - 7 * hr, status: 'read' },
    { id: 'm4-2', conversation_id: 'mock-4', text: 'מישהו יכול לקחת את המשימה?', sender: 'them', timestamp: now - 6 * hr, status: 'read' },
    { id: 'm4-3', conversation_id: 'mock-4', text: 'אני אקח', sender: 'me', timestamp: now - 5.5 * hr, status: 'read' },
    { id: 'm4-4', conversation_id: 'mock-4', text: 'הפגישה נדחתה לשעה 3', sender: 'them', timestamp: now - 5 * hr, status: 'read' },
  ],
  'mock-5': [
    { id: 'm5-1', conversation_id: 'mock-5', text: 'דוד, קיבלת את הקובץ?', sender: 'me', timestamp: now - 26 * hr, status: 'read' },
    { id: 'm5-2', conversation_id: 'mock-5', text: '👍', sender: 'them', timestamp: now - 25 * hr, status: 'read' },
  ],
  'mock-6': [
    { id: 'm6-1', conversation_id: 'mock-6', text: 'שלחתי לך את המסמך', sender: 'me', timestamp: now - 49 * hr, status: 'read' },
    { id: 'm6-2', conversation_id: 'mock-6', text: 'תודה רבה! 🙏', sender: 'them', timestamp: now - 48 * hr, status: 'read' },
  ],
}

export const MOCK_CALLS = [
  { id: 'c1', name: 'מאיה לוי', color: '#059669', initials: 'מ', type: 'incoming', missed: false, time: now - 20 * min },
  { id: 'c2', name: 'ניר כהן', color: '#7c3aed', initials: 'נ', type: 'outgoing', missed: false, time: now - 25 * hr },
  { id: 'c3', name: 'אבא', color: '#d97706', initials: 'א', type: 'incoming', missed: true, time: now - 3 * 24 * hr },
  { id: 'c4', name: 'דוד', color: '#e11d48', initials: 'ד', type: 'outgoing', missed: false, time: now - 5 * 24 * hr },
]
