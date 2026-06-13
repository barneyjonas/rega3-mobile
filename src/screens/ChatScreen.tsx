import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native'
import { useMessagesStore } from '../store/messages'
import { useConversationsStore } from '../store/conversations'
import { useAuthStore } from '../store/auth'
import { realtime, api } from '../api'
import { useDebounce } from '../hooks/useDebounce'
import { MessageBubble } from '../components/MessageBubble'
import { PendingBubble } from '../components/PendingBubble'
import { DebouncePill } from '../components/DebouncePill'
import { VoiceRecorder } from '../components/VoiceRecorder'
import type { Conversation } from '../types/conversation'
import type { Message, VoiceMessage } from '../types/message'
import type { ApiMessage } from '../api'
import { formatDateSeparator } from '../utils/time'

interface Props {
  conversation: Conversation
  onBack: () => void
}

function apiMsgToMessage(m: ApiMessage, myId: string): Message {
  return {
    id: m.id,
    conversation_id: m.conversation_id,
    text: m.text,
    sender: m.sender_id === myId ? 'me' : 'them',
    timestamp: m.timestamp,
    status: m.status as Message['status'],
    type: m.type,
    voiceUri: m.voice_uri ?? undefined,
    voiceDuration: m.voice_duration ?? undefined,
    voiceWaveform: m.voice_waveform ?? undefined,
  }
}

export function ChatScreen({ conversation, onBack }: Props) {
  const { messages: allMessages, pendingMessages, debounceEndTime, setMessages, updateMessage } = useMessagesStore()
  const { updateConversation } = useConversationsStore()
  const user = useAuthStore((s) => s.user)
  const messages = allMessages[conversation.id] ?? []
  const pending = pendingMessages[conversation.id] ?? []
  const endTime = debounceEndTime[conversation.id] ?? null
  const { queueMessage, cancelDebounce, sendNow } = useDebounce(conversation.id)
  const [text, setText] = useState('')
  const listRef = useRef<FlatList>(null)

  const DEBOUNCE_MS = 30000

  // Load message history if not already loaded
  useEffect(() => {
    if (!user || messages.length > 0) return
    api.getMessages(conversation.id).then(({ messages: msgs }) => {
      setMessages(conversation.id, msgs.map((m) => apiMsgToMessage(m, user.id)))
    }).catch(() => {})
  }, [conversation.id, user])

  // Mark as read when entering the chat
  useEffect(() => {
    if (!user) return
    realtime.send({ type: 'mark_read', conversation_id: conversation.id })
    updateConversation(conversation.id, { unread_count: 0 })
  }, [conversation.id, user])

  // Listen for real-time events for this conversation
  useEffect(() => {
    if (!user) return
    const off = realtime.on((msg) => {
      if (msg.type === 'message_saved') {
        const m = msg.message as ApiMessage
        if (m.conversation_id !== conversation.id) return
        updateMessage(conversation.id, m.id, { status: m.status as Message['status'] })
      }
      if (msg.type === 'status_update') {
        const { messageId, status } = msg as { messageId: string; status: string }
        updateMessage(conversation.id, messageId, { status: status as Message['status'] })
      }
      if (msg.type === 'messages_read') {
        const { conversation_id } = msg as { conversation_id: string }
        if (conversation_id !== conversation.id) return
        // Mark all our sent messages as read
        const msgs = useMessagesStore.getState().messages[conversation.id] ?? []
        msgs.forEach((m) => {
          if (m.sender === 'me' && m.status !== 'read') {
            updateMessage(conversation.id, m.id, { status: 'read' })
          }
        })
      }
    })
    return off
  }, [conversation.id, user])

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages.length, pending.length])

  const handleSend = useCallback(() => {
    if (!text.trim()) return
    queueMessage(text.trim())
    setText('')
  }, [text, queueMessage])

  const handleVoice = useCallback((vm: VoiceMessage) => {
    queueMessage('', 'voice', vm)
  }, [queueMessage])

  type Item =
    | { kind: 'date'; key: string; label: string }
    | { kind: 'msg'; key: string; msgId: string }
    | { kind: 'pending'; key: string; pmId: string }

  const items: Item[] = []
  let lastDate = ''
  for (const msg of messages) {
    const d = formatDateSeparator(msg.timestamp)
    if (d !== lastDate) {
      items.push({ kind: 'date', key: `date-${d}`, label: d })
      lastDate = d
    }
    items.push({ kind: 'msg', key: msg.id, msgId: msg.id })
  }
  for (const pm of pending) {
    items.push({ kind: 'pending', key: pm.id, pmId: pm.id })
  }

  const renderItem = ({ item }: { item: Item }) => {
    if (item.kind === 'date') {
      return (
        <View style={styles.dateSep}>
          <Text style={styles.dateSepText}>{item.label}</Text>
        </View>
      )
    }
    if (item.kind === 'msg') {
      const msg = messages.find((m) => m.id === item.msgId)
      if (!msg) return null
      return <MessageBubble message={msg} />
    }
    if (item.kind === 'pending') {
      const pm = pending.find((p) => p.id === item.pmId)
      if (!pm) return null
      return <PendingBubble message={pm} endTime={endTime} totalMs={DEBOUNCE_MS} />
    }
    return null
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: conversation.contact_color }]}>
            <Text style={styles.avatarText}>{conversation.contact_initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{conversation.contact_name}</Text>
            {conversation.is_online === 1 && (
              <Text style={styles.online}>מחובר/ת</Text>
            )}
          </View>
        </View>

        {/* Debounce pill */}
        {endTime !== null && (
          <DebouncePill
            endTime={endTime}
            totalMs={DEBOUNCE_MS}
            onCancel={cancelDebounce}
            onSendNow={sendNow}
          />
        )}

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.flex}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="הודעה..."
            placeholderTextColor="#555"
            multiline
            textAlign="right"
          />
          {text.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          ) : (
            <VoiceRecorder onVoice={handleVoice} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 10,
  },
  backBtn: { paddingHorizontal: 4 },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 32 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  online: { color: '#4ade80', fontSize: 12, marginTop: 1 },
  dateSep: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateSepText: {
    fontSize: 12,
    color: '#555',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  listContent: { paddingVertical: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 8,
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 16 },
})
