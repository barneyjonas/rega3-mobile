import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native'
import { useConversationsStore, makeConversation } from '../store/conversations'
import { useMessagesStore } from '../store/messages'
import { useAuthStore } from '../store/auth'
import { api, realtime } from '../api'
import type { ApiMessage, ApiUser } from '../api'
import type { Conversation } from '../types/conversation'
import type { Message } from '../types/message'
import type { AppTab } from '../types/navigation'
import { formatTime } from '../utils/time'

interface Props {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  activeConvId: string | null
  onSelectConv: (conv: Conversation) => void
}

function apiMsgToMessage(m: ApiMessage, myId: string): Message {
  return {
    id: m.id, conversation_id: m.conversation_id, text: m.text,
    sender: m.sender_id === myId ? 'me' : 'them',
    timestamp: m.timestamp, status: m.status as Message['status'],
  }
}

export function Sidebar({ activeTab, onTabChange, activeConvId, onSelectConv }: Props) {
  const { conversations, setConversations, updateConversation, addConversation } = useConversationsStore()
  const { setMessages, addMessage } = useMessagesStore()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [loading, setLoading] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [users, setUsers] = useState<ApiUser[]>([])
  const [query, setQuery] = useState('')

  // Load real conversations from API (merges with mock data)
  useEffect(() => {
    if (!user) return
    setLoading(true)
    api.getConversations(user.id)
      .then(async ({ conversations: apiConvs }) => {
        const real: Conversation[] = []
        for (const c of apiConvs) {
          const other = c.members.find((m) => m.id !== user.id)
          if (!other) continue
          const lastMsg = c.last_message
          real.push(makeConversation(c.id, other, lastMsg?.text ?? '', lastMsg?.timestamp))
          const { messages } = await api.getMessages(c.id)
          setMessages(c.id, messages.map((m) => apiMsgToMessage(m, user.id)))
        }
        // Merge real conversations into store (mock ones already there)
        real.forEach((c) => addConversation(c))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // Listen for incoming messages
  useEffect(() => {
    if (!user) return
    const off = realtime.on((msg) => {
      if (msg.type === 'new_message') {
        const m = msg.message as ApiMessage
        addMessage(m.conversation_id, apiMsgToMessage(m, user.id))
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
    if (users.length === 0) api.getUsers().then(({ users: u }) => setUsers(u)).catch(() => {})
  }

  const handleStartChat = async (other: ApiUser) => {
    if (!user) return
    try {
      const { conversation } = await api.getOrCreateDirect(user.id, other.id)
      const existing = conversations.find((c) => c.id === conversation.id)
      const conv = existing ?? makeConversation(conversation.id, other)
      if (!existing) addConversation(conv)
      onSelectConv(conv)
      setShowNewChat(false)
    } catch {}
  }

  const sortedConvs = conversations
    .filter((c) => !query || c.contact_name.toLowerCase().includes(query.toLowerCase()))
    .slice()
    .sort((a, b) => (b.last_message_time ?? 0) - (a.last_message_time ?? 0))

  const filteredUsers = users.filter(
    (u) => u.id !== user?.id &&
      (u.display_name.toLowerCase().includes(query.toLowerCase()) ||
       u.username.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <View style={styles.sidebar}>
      {/* App header */}
      <View style={styles.appHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user?.display_name?.[0] ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.appName}>rega</Text>
            <Text style={styles.userName}>{user?.display_name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>יציאה</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation tabs */}
      <View style={styles.tabs}>
        {([
          { id: 'chats', label: 'צ׳אטים', icon: '💬' },
          { id: 'calls', label: 'שיחות', icon: '📞' },
          { id: 'settings', label: 'הגדרות', icon: '⚙️' },
        ] as { id: AppTab; label: string; icon: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab !== 'chats' ? null : (
        <>
          {/* Search / new chat row */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.search}
              placeholder={showNewChat ? 'חפש משתמש...' : 'חפש שיחה...'}
              placeholderTextColor="#4b5563"
              value={query}
              onChangeText={setQuery}
              textAlign="right"
            />
            {showNewChat ? (
              <TouchableOpacity onPress={() => setShowNewChat(false)} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>✕</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={openNewChat} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {showNewChat ? (
            <FlatList
              data={filteredUsers}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.convRow} onPress={() => handleStartChat(item)}>
                  <View style={[styles.avatar, { backgroundColor: '#1d4ed8' }]}>
                    <Text style={styles.avatarText}>{item.display_name[0]}</Text>
                  </View>
                  <View style={styles.convInfo}>
                    <Text style={styles.convName}>{item.display_name}</Text>
                    <Text style={styles.convSub}>@{item.username}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>לא נמצאו משתמשים</Text>}
            />
          ) : (
            <FlatList
              data={sortedConvs}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => <ConvRow item={item} isActive={item.id === activeConvId} onPress={() => onSelectConv(item)} />}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              ListEmptyComponent={loading
                ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />
                : <Text style={styles.empty}>אין שיחות</Text>}
            />
          )}
        </>
      )}
    </View>
  )
}

function ConvRow({ item, isActive, onPress }: { item: Conversation; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.convRow, isActive && styles.convRowActive]}
      onPress={onPress}
      activeOpacity={0.75}
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
          <Text style={styles.convSub} numberOfLines={1}>{item.last_message}</Text>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    width: 300,
    backgroundColor: '#111827',
    borderLeftWidth: 1,
    borderLeftColor: '#1f2937',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  appName: { fontSize: 16, fontWeight: '900', color: '#3b82f6' },
  userName: { fontSize: 11, color: '#6b7280' },
  logoutBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1, borderColor: '#374151',
  },
  logoutText: { fontSize: 12, color: '#6b7280' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 2,
  },
  tabActive: {
    borderBottomWidth: 2, borderBottomColor: '#3b82f6',
  },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 10, color: '#6b7280' },
  tabLabelActive: { color: '#3b82f6', fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8, gap: 6,
  },
  search: {
    flex: 1, backgroundColor: '#1f2937', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
    color: '#e5e7eb', fontSize: 13,
    borderWidth: 1, borderColor: '#374151',
  },
  actionBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 14 },
  convRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 9, gap: 10,
  },
  convRowActive: { backgroundColor: '#1e2a3a' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#111827',
  },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  convName: { fontSize: 14, fontWeight: '600', color: '#e5e7eb', flex: 1 },
  convTime: { fontSize: 10, color: '#4b5563' },
  convSub: { fontSize: 12, color: '#6b7280', flex: 1 },
  badge: {
    backgroundColor: '#3b82f6', borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#1a2030', marginLeft: 62 },
  empty: { color: '#4b5563', textAlign: 'center', marginTop: 40, fontSize: 13 },
})
