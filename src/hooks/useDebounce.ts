import { useCallback, useRef } from 'react'
import { useMessagesStore } from '../store/messages'
import { useConversationsStore } from '../store/conversations'
import { useAuthStore } from '../store/auth'
import { realtime } from '../api'
import type { Message, PendingMessage, MessageType, VoiceMessage, VoiceSegment } from '../types/message'
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

    const textMessages = pending.filter((m) => m.type === 'text')
    const voiceMessages = pending.filter((m) => m.type === 'voice' && m.voiceMessage)

    if (voiceMessages.length > 0) {
      const vms = voiceMessages.map((pm) => pm.voiceMessage!)

      let cursor = 0
      const segments: VoiceSegment[] = vms.map((v) => {
        const seg = { id: generateId(), startTime: cursor, duration: v.duration, waveformData: v.waveformData }
        cursor += v.duration
        return seg
      })
      const totalDuration = cursor

      const SAMPLES = 40
      const mergedWaveform: number[] = []
      segments.forEach((seg) => {
        const count = Math.max(1, Math.round((seg.duration / totalDuration) * SAMPLES))
        for (let i = 0; i < count; i++) {
          mergedWaveform.push(seg.waveformData[Math.floor((i / count) * seg.waveformData.length)] ?? 0.5)
        }
      })

      const msgId = generateId()
      if (voiceMessages.length >= 2) setLastMerge(msgId, voiceMessages.length)
      const msg: Message = {
        id: msgId,
        conversation_id: conversationId,
        text: '',
        sender: 'me',
        timestamp: Date.now(),
        status: 'sending',
        type: 'voice',
        voiceUri: vms[0].uri,
        voiceDuration: totalDuration,
        voiceWaveform: mergedWaveform,
        voiceSegments: voiceMessages.length >= 2 ? segments : undefined,
      }
      addMessage(conversationId, msg)
      updateConversation(conversationId, { last_message: '🎤 הודעה קולית', last_message_time: msg.timestamp, unread_count: 0 })

      realtime.send({
        type: 'send_message',
        id: msgId,
        conversation_id: conversationId,
        sender_id: myId,
        msg_type: 'voice',
        text: '',
        voice_uri: vms[0].uri,
        voice_duration: totalDuration,
        voice_waveform: mergedWaveform,
        voice_segments: voiceMessages.length >= 2 ? segments : undefined,
        timestamp: msg.timestamp,
      })
    }

    if (textMessages.length > 0) {
      const mergedText = textMessages.map((m) => m.text).join('\n')
      const msgId = generateId()
      if (textMessages.length >= 2) setLastMerge(msgId, textMessages.length)
      const msg: Message = {
        id: msgId,
        conversation_id: conversationId,
        text: mergedText,
        sender: 'me',
        timestamp: Date.now(),
        status: 'sending',
        type: 'text',
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
    }

    clearPending(conversationId)
    timerRef.current = null
  }, [conversationId, addMessage, addPendingMessage, clearPending, updateConversation, setLastMerge])

  const queueMessage = useCallback(
    (text: string, type: MessageType = 'text', voiceMessage?: VoiceMessage) => {
      const pending: PendingMessage = {
        id: generateId(),
        text,
        type,
        timestamp: Date.now(),
        ...(voiceMessage ? { voiceMessage } : {}),
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
