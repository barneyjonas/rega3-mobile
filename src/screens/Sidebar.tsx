import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native'
import { useConversationsStore, makeConversation } from '../store/conversations'
import { useMessagesStore } from '../store/messages'
import { useAuthStore } from '../store/auth'
import { api, realtime } from '../api'
import type { ApiMessage } from '../api'
import type { ApiUser } from '../api'
import type { Conversation } from '../types/conversation'
import type { Message } from '../types/message'
import { formatTime } from '../utils/time'

interface Props {
  activeConvId: string | null
  onSelect: (conv: Conversation) => void
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

export function Sidebar({ activeConvId, onSelect }: Props) {
  const { conversations, setConversations, updateConversation, addConversation } = useConversationsStore()
  const { setMessages, addMessage } = useMessagesStore()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const [users, setUsers] = useState<ApiUser[]>([])
  const [query, setQuery] = useState('')
  const [newChatLoading, setNewChatLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    api.getConversations(user.id)
      .then(async ({ conversations: apiConvs }) => {
        const mapped: Conversation[] = []
        for (const c of apiConvs) {
          const other = c.members.find((m) => m.id !== user.id)
          if (!other) continue
          const lastMsg = c.last_message
          const conv = makeConversation(c.id, other, lastMsg?.text ?? '', lastMsg?.timestamp)
          mapped.push(conv)
          const { messages } = await api.getMessages(c.id)
          setMessages(c.id, messages.map((m) => apiMsgToMessage(m, user.id)))
        }
        setConversations(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

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

  const openNewChat = () => {
    setShowNewChat(true)
    setQuery('')
    if (users.length === 0) {
      api.getUsers().then(({ users: u }) => setUsers(u)).catch(() => {})
    }
  }

  const handleStartChat = async (other: ApiUser) => {
    if (!user) return
    setNewChatLoading(true)
    try {
      const { conversation } = await api.getOrCreateDirect(user.id, other.id)
      const existing = conversations.find((c) => c.id === conversation.id)
      const conv = existing ?? makeConversation(conversation.id, other)
      if (!existing) addConversation(conv)
      onSelect(conv)
      setShowNewChat(false)
    } catch {}
    setNewChatLoading(false)
  }

  const filteredUsers = users.filter(
    (u) => u.id !== user?.id && (
      u.display_name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
    )
  )

  return (
    <View style={styles.sidebar}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>rega</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={openNewChat}>
            <Text style={styles.iconBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Text style={styles.iconBtnText}>⎋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User info */}
      <View style={styles.userRow}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{user?.display_name?.[0] ?? '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.display_name}</Text>
      </View>

      {/* Search / New Chat */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder={showNewChat ? 'חפש משתמש...' : 'חפש שיחה...'}
          placeholderTextColor="#444"
          value={query}
          onChangeText={setQuery}
          textAlign="right"
        />
        {showNewChat && (
          <TouchableOpacity onPress={() => setShowNewChat(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {showNewChat ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convRow} onPress={() => handleStartChat(item)} activeOpacity={0.7}>
              <View style={[styles.avatar, { backgroundColor: '#1d4ed8' }]}>
                <Text style={styles.avatarText}>{item.display_name[0]}</Text>
              </View>
              <View style={styles.convInfo}>
                <Text style={styles.convName}>{item.display_name}</Text>
                <Text style={styles.lastMsg}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            newChatLoading
              ? <ActivityIndicator color="#1d4ed8" style={{ marginTop: 24 }} />
              : <Text style={styles.empty}>לא נמצאו משתמשים</Text>
          }
        />
      ) : loading ? (
        <ActivityIndicator color="#1d4ed8" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={conversations.filter((c) =>
            !query || c.contact_name.toLowerCase().includes(query.toLowerCase())
          )}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.convRow, item.id === activeConvId && styles.convRowActive]}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: item.contact_color }]}>
                <Text style={styles.avatarText}>{item.contact_initials}</Text>
                {item.is_online === 1 && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTop}>
                  <Text style={styles.convName} numberOfLines={1}>{item.contact_name}</Text>
                  <Text style={styles.convTime}>{formatTime(item.last_message_time)}</Text>
                </View>
                <View style={styles.convBottom}>
                  <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message}</Text>
                  {item.unread_count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.empty}>אין שיחות. לחץ ✏️ כדי להתחיל.</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    width: 300,
    backgroundColor: '#111827',
    borderRightWidth: 1,
    borderRightColor: '#1f2937',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  appName: { fontSize: 22, fontWeight: '900', color: '#3b82f6', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 8 },
  iconBtnText: { fontSize: 16 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  userName: { color: '#6b7280', fontSize: 13 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  search: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#e5e7eb',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cancelBtn: { padding: 4 },
  cancelText: { color: '#6b7280', fontSize: 16 },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  convRowActive: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#111827',
  },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  convName: { fontSize: 14, fontWeight: '600', color: '#f3f4f6', flex: 1 },
  convTime: { fontSize: 11, color: '#4b5563', marginLeft: 4 },
  lastMsg: { fontSize: 13, color: '#6b7280', flex: 1 },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#1f2937', marginLeft: 64 },
  empty: { color: '#4b5563', textAlign: 'center', marginTop: 40, fontSize: 14, paddingHorizontal: 24 },
})
