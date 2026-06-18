import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { MOCK_CALLS } from '../data/mockData'
import { formatTime } from '../utils/time'

export function CallsPanel() {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>שיחות אחרונות</Text>
        <TouchableOpacity style={styles.newCallBtn}>
          <Text style={styles.newCallText}>שיחה חדשה +</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={MOCK_CALLS}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: item.color }]}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, item.missed && styles.missed]}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.missed ? '📵 שיחה שלא נענתה' : item.type === 'incoming' ? '📲 שיחה נכנסת' : '📤 שיחה יוצאת'}
                {'  ·  '}
                {formatTime(item.time)}
              </Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
    backgroundColor: '#111827',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#f3f4f6' },
  newCallBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#1d4ed8', borderRadius: 8,
  },
  newCallText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#e5e7eb' },
  missed: { color: '#f87171' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  callBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#166534', alignItems: 'center', justifyContent: 'center',
  },
  callIcon: { fontSize: 16 },
  sep: { height: 8 },
})
