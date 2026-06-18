import { useCallback, useRef } from 'react'
import { useMessagesStore } from '../store/messages'
import { useConversationsStore } from '../store/conversations'
import { useAuthStore } from '../store/auth'
import { realtime } from '../api'
import type { Message, PendingMessage } from '../types/message'
import { generateId } from '../utils/id'

const DEBOUNCE_MS = 30000

export function useDebounce(conversationId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { addMessage, addPendingMessage, clearPending, setDebounceEndTime, setLastMerge } = useMessagesStore()
  const { updateConversation } = useConversationsStore()

  const flushPending = useCallback(() => {
    const pending = useMessagesStore.getState().pendingMessages[conversationId] ?? []
    if (pending.length === 0) return

    const myId = useAuthStore.getState().user?.id ?? 'unknown'
    const mergedText = pending.map((m) => m.text).join('\n')
    const msgId = generateId()
    if (pending.length >= 2) setLastMerge(msgId, pending.length)

    const msg: Message = {
      id: msgId,
      conversation_id: conversationId,
      text: mergedText,
      sender: 'me',
      timestamp: Date.now(),
      status: 'sending',
    }
    addMessage(conversationId, msg)
    updateConversation(conversationId, { last_message: mergedText, last_message_time: msg.timestamp, unread_count: 0 })

    realtime.send({
      type: 'send_message',
      id: msgId,
      conversation_id: conversationId,
      sender_id: myId,
      msg_type: 'text',
      text: mergedText,
      timestamp: msg.timestamp,
    })

    clearPending(conversationId)
    timerRef.current = null
  }, [conversationId, addMessage, addPendingMessage, clearPending, updateConversation, setLastMerge])

  const queueMessage = useCallback(
    (text: string) => {
      const pending: PendingMessage = {
        id: generateId(),
        text,
        timestamp: Date.now(),
      }
      addPendingMessage(conversationId, pending)

      if (timerRef.current) clearTimeout(timerRef.current)
      const endTime = Date.now() + DEBOUNCE_MS
      setDebounceEndTime(conversationId, endTime)
      timerRef.current = setTimeout(flushPending, DEBOUNCE_MS)
    },
    [conversationId, addPendingMessage, setDebounceEndTime, flushPending]
  )

  const cancelDebounce = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    clearPending(conversationId)
  }, [conversationId, clearPending])

  const sendNow = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    flushPending()
  }, [flushPending])

  return { queueMessage, cancelDebounce, sendNow }
}
