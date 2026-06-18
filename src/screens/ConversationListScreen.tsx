import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native'
import { useConversationsStore, makeConversation } from '../store/conversations'
import { useAuthStore } from '../store/auth'
import { useMessagesStore } from '../store/messages'
import { api, realtime } from '../api'
import type { Conversation } from '../types/conversation'
import type { Message } from '../types/message'
import type { ApiMessage } from '../api'
import { formatTime } from '../utils/time'

interface Props {
  onSelect: (conv: Conversation) => void
  onNewChat: () => void
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

function ConvRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: conv.contact_color }]}>
        <Text style={styles.avatarText}>{conv.contact_initials}</Text>
        {conv.is_online === 1 && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{conv.contact_name}</Text>
          <Text style={styles.time}>{formatTime(conv.last_message_time)}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.lastMsg} numberOfLines={1}>{conv.last_message}</Text>
          {conv.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conv.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export function ConversationListScreen({ onSelect, onNewChat }: Props) {
  const { conversations, setConversations, updateConversation } = useConversationsStore()
  const { setMessages, addMessage } = useMessagesStore()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    if (!user) return
    api.getConversations(user.id)
      .then(async ({ conversations: apiConvs }) => {
        const mapped: Conversation[] = []
        for (const c of apiConvs) {
          const other = c.members.find((m) => m.id !== user.id)
          if (!other) continue
          const lastMsg = c.last_message
          const conv = makeConversation(
            c.id, other,
            lastMsg ? lastMsg.text : '',
            lastMsg?.timestamp,
          )
          mapped.push(conv)

          // Pre-load messages
          const { messages } = await api.getMessages(c.id)
          setMessages(c.id, messages.map((m) => apiMsgToMessage(m, user.id)))
        }
        setConversations(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // Listen for incoming messages via WebSocket
  useEffect(() => {
    if (!user) return
    const off = realtime.on((msg) => {
      if (msg.type === 'new_message') {
        const m = msg.message as ApiMessage
        const message = apiMsgToMessage(m, user.id)
        addMessage(m.conversation_id, message)
        updateConversation(m.conversation_id, {
          last_message: m.text,
          last_message_time: m.timestamp,
          unread_count: (conversations.find((c) => c.id === m.conversation_id)?.unread_count ?? 0) + 1,
        })
      }
    })
    return () => { off() }
  }, [user, conversations])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>הודעות</Text>
        <TouchableOpacity style={styles.newBtn} onPress={onNewChat}>
          <Text style={styles.newBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#1d4ed8" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConvRow conv={item} onPress={() => onSelect(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.empty}>אין שיחות עדיין. לחץ + כדי להתחיל שיחה.</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtnText: { color: '#fff', fontSize: 24, lineHeight: 28, fontWeight: '300' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#111',
  },
  info: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  time: { fontSize: 12, color: '#555', marginLeft: 8 },
  lastMsg: { fontSize: 14, color: '#666', flex: 1 },
  badge: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#1a1a1a', marginLeft: 74 },
  empty: { color: '#555', textAlign: 'center', marginTop: 48, fontSize: 15, paddingHorizontal: 32 },
})
