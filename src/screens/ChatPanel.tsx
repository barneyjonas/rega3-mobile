import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useMessagesStore } from '../store/messages'
import { useConversationsStore } from '../store/conversations'
import { useAuthStore } from '../store/auth'
import { realtime, api } from '../api'
import { useDebounce } from '../hooks/useDebounce'
import { MessageBubble } from '../components/MessageBubble'
import { PendingBubble } from '../components/PendingBubble'
import { DebouncePill } from '../components/DebouncePill'
import type { Conversation } from '../types/conversation'
import type { Message } from '../types/message'
import type { ApiMessage } from '../api'
import { formatDateSeparator } from '../utils/time'

interface Props {
  conversation: Conversation | null
}

function apiMsgToMessage(m: ApiMessage, myId: string): Message {
  return {
    id: m.id,
    conversation_id: m.conversation_id,
    text: m.text,
    sender: m.sender_id === myId ? 'me' : 'them',
    timestamp: m.timestamp,
    status: m.status as Message['status'],
  }
}

const DEBOUNCE_MS = 30000

export function ChatPanel({ conversation }: Props) {
  if (!conversation) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>בחר שיחה</Text>
        <Text style={styles.emptySub}>בחר שיחה מהרשימה כדי להתחיל</Text>
      </View>
    )
  }

  return <ActiveChat conversation={conversation} />
}

function ActiveChat({ conversation }: { conversation: Conversation }) {
  const { messages: allMessages, pendingMessages, debounceEndTime, setMessages, updateMessage } = useMessagesStore()
  const { updateConversation } = useConversationsStore()
  const user = useAuthStore((s) => s.user)
  const messages = allMessages[conversation.id] ?? []
  const pending = pendingMessages[conversation.id] ?? []
  const endTime = debounceEndTime[conversation.id] ?? null
  const { queueMessage, cancelDebounce, sendNow } = useDebounce(conversation.id)
  const [text, setText] = useState('')
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (!user || messages.length > 0) return
    api.getMessages(conversation.id).then(({ messages: msgs }) => {
      setMessages(conversation.id, msgs.map((m) => apiMsgToMessage(m, user.id)))
    }).catch(() => {})
  }, [conversation.id, user])

  useEffect(() => {
    if (!user) return
    realtime.send({ type: 'mark_read', conversation_id: conversation.id })
    updateConversation(conversation.id, { unread_count: 0 })
  }, [conversation.id, user])

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
        const msgs = useMessagesStore.getState().messages[conversation.id] ?? []
        msgs.forEach((m) => {
          if (m.sender === 'me' && m.status !== 'read') {
            updateMessage(conversation.id, m.id, { status: 'read' })
          }
        })
      }
    })
    return () => { off() }
  }, [conversation.id, user])

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages.length, pending.length])

  const handleSend = useCallback(() => {
    if (!text.trim()) return
    queueMessage(text.trim())
    setText('')
  }, [text, queueMessage])

  const handleKeyPress = useCallback((e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault?.()
      handleSend()
    }
  }, [handleSend])

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
    <KeyboardAvoidingView
      style={styles.panel}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: conversation.contact_color }]}>
          <Text style={styles.avatarText}>{conversation.contact_initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversation.contact_name}</Text>
          {conversation.is_online === 1 && <Text style={styles.online}>מחובר/ת</Text>}
        </View>
      </View>

      {/* Debounce pill */}
      {endTime !== null && (
        <DebouncePill endTime={endTime} totalMs={DEBOUNCE_MS} onCancel={cancelDebounce} onSendNow={sendNow} />
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        style={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="כתוב הודעה... (Enter לשליחה)"
          placeholderTextColor="#4b5563"
          multiline
          textAlign="right"
          onKeyPress={handleKeyPress}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#0f1117',
    flexDirection: 'column',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1117',
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 14, color: '#374151' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    backgroundColor: '#111827',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerInfo: { flex: 1 },
  headerName: { color: '#f3f4f6', fontWeight: '600', fontSize: 16 },
  online: { color: '#22c55e', fontSize: 12, marginTop: 1 },
  messageList: { flex: 1 },
  listContent: { paddingVertical: 12, paddingHorizontal: 8 },
  dateSep: { alignItems: 'center', paddingVertical: 10 },
  dateSepText: {
    fontSize: 12,
    color: '#4b5563',
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    backgroundColor: '#111827',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 15,
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 16 },
})
