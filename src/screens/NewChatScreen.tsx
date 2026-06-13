import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, TextInput,
} from 'react-native'
import { api } from '../api'
import { useAuthStore } from '../store/auth'
import { useConversationsStore, makeConversation } from '../store/conversations'
import type { ApiUser } from '../api'
import type { Conversation } from '../types/conversation'

interface Props {
  onSelect: (conv: Conversation) => void
  onBack: () => void
}

export function NewChatScreen({ onSelect, onBack }: Props) {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const myId = useAuthStore((s) => s.user?.id)
  const { addConversation } = useConversationsStore()

  useEffect(() => {
    api.getUsers()
      .then(({ users }) => setUsers(users))
      .catch(() => setError('לא ניתן לטעון משתמשים'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(
    (u) => u.id !== myId && (
      u.display_name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
    )
  )

  const handleSelect = async (other: ApiUser) => {
    if (!myId) return
    try {
      const { conversation } = await api.getOrCreateDirect(myId, other.id)
      const conv = makeConversation(conversation.id, other)
      addConversation(conv)
      onSelect(conv)
    } catch {
      setError('שגיאה ביצירת שיחה')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>שיחה חדשה</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="חפש לפי שם..."
        placeholderTextColor="#555"
        value={query}
        onChangeText={setQuery}
        textAlign="right"
      />

      {loading && <ActivityIndicator color="#1d4ed8" style={{ marginTop: 32 }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.display_name[0]}</Text>
            </View>
            <View>
              <Text style={styles.name}>{item.display_name}</Text>
              <Text style={styles.uname}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>לא נמצאו משתמשים</Text> : null}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 8,
  },
  backBtn: { paddingHorizontal: 4 },
  back: { fontSize: 28, color: '#fff', lineHeight: 32 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  search: {
    margin: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  uname: { color: '#666', fontSize: 13, marginTop: 2 },
  sep: { height: 1, backgroundColor: '#1a1a1a', marginLeft: 70 },
  error: { color: '#f87171', textAlign: 'center', marginTop: 16 },
  empty: { color: '#555', textAlign: 'center', marginTop: 32, fontSize: 15 },
})
