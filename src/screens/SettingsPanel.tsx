import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native'
import { useAuthStore } from '../store/auth'

export function SettingsPanel() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [notifications, setNotifications] = useState(true)
  const [sounds, setSounds] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>הגדרות</Text>
      </View>

      <View style={styles.content}>
        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרופיל</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{user?.display_name?.[0] ?? '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.display_name}</Text>
              <Text style={styles.profileUsername}>@{user?.username}</Text>
              <Text style={styles.profileStatus}>🟢 מחובר</Text>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>שם תצוגה</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              textAlign="right"
              placeholder="שם תצוגה"
              placeholderTextColor="#4b5563"
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>התראות</Text>
          <View style={styles.card}>
            <ToggleRow label="התראות הודעות" value={notifications} onChange={setNotifications} />
            <View style={styles.rowSep} />
            <ToggleRow label="צלילי הודעות" value={sounds} onChange={setSounds} />
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטיות</Text>
          <View style={styles.card}>
            <ToggleRow label="אישורי קריאה" value={readReceipts} onChange={setReadReceipts} />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>אודות</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>גרסה</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.rowSep} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>שרת</Text>
              <Text style={styles.aboutValue}>rega3 · Railway</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>יציאה מהחשבון</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#374151', true: '#1d4ed8' }}
        thumbColor="#fff"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  header: {
    paddingHorizontal: 28, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
    backgroundColor: '#111827',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#f3f4f6' },
  content: { padding: 24, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'right' },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1f2937', gap: 14,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#f3f4f6', textAlign: 'right' },
  profileUsername: { fontSize: 13, color: '#6b7280', textAlign: 'right' },
  profileStatus: { fontSize: 12, color: '#22c55e', textAlign: 'right' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, color: '#6b7280', textAlign: 'right' },
  input: {
    backgroundColor: '#111827', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    color: '#e5e7eb', fontSize: 14,
    borderWidth: 1, borderColor: '#1f2937',
  },
  card: {
    backgroundColor: '#111827', borderRadius: 12,
    borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  toggleLabel: { fontSize: 14, color: '#d1d5db' },
  rowSep: { height: 1, backgroundColor: '#1f2937', marginHorizontal: 16 },
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  aboutLabel: { fontSize: 14, color: '#d1d5db' },
  aboutValue: { fontSize: 14, color: '#4b5563' },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  logoutText: { color: '#f87171', fontSize: 15, fontWeight: '600' },
})
