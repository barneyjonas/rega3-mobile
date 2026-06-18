import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Platform, ScrollView,
} from 'react-native'
import { useMessagesStore } from '../store/messages'
import { useConversationsStore } from '../store/conversations'
import { useAuthStore } from '../store/auth'
import { realtime, api } from '../api'
import { MessageBubble } from '../components/MessageBubble'
import type { Conversation } from '../types/conversation'
import type { Message } from '../types/message'
import type { ApiMessage } from '../api'
import { formatDateSeparator } from '../utils/time'
import { generateId } from '../utils/id'

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

export function ChatPanel({ conversation }: Props) {
  if (!conversation) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>בחר שיחה</Text>
        <Text style={styles.emptySub}>בחר שיחה מהרשימה משמאל</Text>
      </View>
    )
  }
  return <ActiveChat conversation={conversation} />
}

function ActiveChat({ conversation }: { conversation: Conversation }) {
  const { messages: allMessages, setMessages, addMessage, updateMessage } = useMessagesStore()
  const { updateConversation } = useConversationsStore()
  const user = useAuthStore((s) => s.user)
  const messages = allMessages[conversation.id] ?? []
  const [text, setText] = useState('')
  const [atBottom, setAtBottom] = useState(true)
  const listRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    const isMock = conversation.id.startsWith('mock-')
    if (!user || messages.length > 0 || isMock) return
    api.getMessages(conversation.id)
      .then(({ messages: msgs }) => setMessages(conversation.id, msgs.map((m) => apiMsgToMessage(m, user.id))))
      .catch(() => {})
  }, [conversation.id, user])

  useEffect(() => {
    if (!user) return
    realtime.send({ type: 'mark_read', conversation_id: conversation.id })
    updateConversation(conversation.id, { unread_count: 0 })
    inputRef.current?.focus()
  }, [conversation.id])

  useEffect(() => {
    if (!user) return
    const off = realtime.on((msg) => {
      if (msg.type === 'new_message') {
        const m = msg.message as ApiMessage
        if (m.conversation_id !== conversation.id) return
        addMessage(conversation.id, apiMsgToMessage(m, user.id))
      }
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
    if (atBottom) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60)
    }
  }, [messages.length])

  const sendMessage = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || !user) return
    const msgId = generateId()
    const msg: Message = {
      id: msgId,
      conversation_id: conversation.id,
      text: trimmed,
      sender: 'me',
      timestamp: Date.now(),
      status: 'sending',
    }
    addMessage(conversation.id, msg)
    updateConversation(conversation.id, { last_message: trimmed, last_message_time: msg.timestamp, unread_count: 0 })
    if (!conversation.id.startsWith('mock-')) {
      realtime.send({
        type: 'send_message',
        id: msgId,
        conversation_id: conversation.id,
        sender_id: user.id,
        msg_type: 'text',
        text: trimmed,
        timestamp: msg.timestamp,
      })
    }
    setText('')
  }, [text, user, conversation.id, addMessage, updateConversation])

  const handleKeyPress = useCallback((e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault?.()
      sendMessage()
    }
  }, [sendMessage])

  type Item =
    | { kind: 'date'; key: string; label: string }
    | { kind: 'msg'; key: string; msg: Message; isFirst: boolean; isLast: boolean }

  const items: Item[] = []
  let lastDate = ''
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const d = formatDateSeparator(msg.timestamp)
    if (d !== lastDate) {
      items.push({ kind: 'date', key: `date-${d}-${i}`, label: d })
      lastDate = d
    }
    const prev = messages[i - 1]
    const next = messages[i + 1]
    const isFirst = !prev || prev.sender !== msg.sender || formatDateSeparator(prev.timestamp) !== d
    const isLast = !next || next.sender !== msg.sender
    items.push({ kind: 'msg', key: msg.id, msg, isFirst, isLast })
  }

  const renderItem = ({ item }: { item: Item }) => {
    if (item.kind === 'date') {
      return (
        <View style={styles.dateSep}>
          <Text style={styles.dateSepText}>{item.label}</Text>
        </View>
      )
    }
    return <MessageBubble message={item.msg} isFirst={item.isFirst} isLast={item.isLast} />
  }

  return (
    <View style={styles.panel}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: conversation.contact_color }]}>
          <Text style={styles.avatarText}>{conversation.contact_initials}</Text>
          {conversation.is_online === 1 && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversation.contact_name}</Text>
          <Text style={styles.headerStatus}>
            {conversation.is_online === 1 ? 'מחובר/ת' : 'לא מחובר/ת'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        style={styles.messageList}
        onContentSizeChange={() => { if (atBottom) listRef.current?.scrollToEnd({ animated: false }) }}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent
          setAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 60)
        }}
        scrollEventThrottle={100}
      />

      {/* Scroll to bottom */}
      {!atBottom && (
        <TouchableOpacity
          style={styles.scrollBtn}
          onPress={() => listRef.current?.scrollToEnd({ animated: true })}
        >
          <Text style={styles.scrollBtnText}>↓</Text>
        </TouchableOpacity>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="כתוב הודעה..."
          placeholderTextColor="#4b5563"
          multiline
          textAlign="right"
          onKeyPress={handleKeyPress}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Enter לשליחה · Shift+Enter לשורה חדשה</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: '#0f1117', flexDirection: 'column' },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0f1117', gap: 10,
  },
  emptyIcon: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 14, color: '#374151' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
    backgroundColor: '#111827', gap: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#111827',
  },
  headerInfo: { flex: 1 },
  headerName: { color: '#f3f4f6', fontWeight: '600', fontSize: 16 },
  headerStatus: { color: '#4b5563', fontSize: 12, marginTop: 1 },
  messageList: { flex: 1 },
  listContent: { paddingVertical: 16, paddingHorizontal: 20 },
  dateSep: { alignItems: 'center', paddingVertical: 12 },
  dateSepText: {
    fontSize: 11, color: '#4b5563', backgroundColor: '#1a1f2e',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
  },
  scrollBtn: {
    position: 'absolute', bottom: 80, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4,
  },
  scrollBtnText: { color: '#9ca3af', fontSize: 18, lineHeight: 22 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: '#1f2937',
    backgroundColor: '#111827', gap: 10,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 160,
    backgroundColor: '#1f2937', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    color: '#e5e7eb', fontSize: 15, textAlignVertical: 'center',
    borderWidth: 1, borderColor: '#374151',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#1f2937' },
  sendIcon: { color: '#fff', fontSize: 15 },
  hint: {
    textAlign: 'center', fontSize: 11, color: '#374151',
    paddingBottom: 8, backgroundColor: '#111827',
  },
})
