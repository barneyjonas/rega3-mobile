import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { api } from '../api'
import { useAuthStore } from '../store/auth'

interface Props {
  onLoggedIn: () => void
}

export function LoginScreen({ onLoggedIn }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setUser = useAuthStore((s) => s.setUser)

  const handleLogin = async () => {
    const name = displayName.trim()
    const uname = username.trim().toLowerCase().replace(/\s+/g, '_')
    if (!name || !uname) { setError('נא למלא שם ושם משתמש'); return }

    setLoading(true)
    setError('')
    try {
      const { user } = await api.register(uname, name)
      setUser(user)
      onLoggedIn()
    } catch {
      setError('לא ניתן להתחבר לשרת. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') handleLogin()
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>ר</Text>
        </View>
        <Text style={styles.title}>rega</Text>
        <Text style={styles.sub}>הצ'אט שלנו</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>שם תצוגה</Text>
            <TextInput
              style={styles.input}
              placeholder="למשל: יואב"
              placeholderTextColor="#4b5563"
              value={displayName}
              onChangeText={setDisplayName}
              textAlign="right"
              autoCapitalize="words"
              onKeyPress={handleKeyPress}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>שם משתמש</Text>
            <TextInput
              style={styles.input}
              placeholder="למשל: yoav"
              placeholderTextColor="#4b5563"
              value={username}
              onChangeText={setUsername}
              textAlign="right"
              autoCapitalize="none"
              autoCorrect={false}
              onKeyPress={handleKeyPress}
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>כניסה / הרשמה</Text>
            }
          </TouchableOpacity>

          <Text style={styles.hint}>
            אם שם המשתמש כבר קיים, תיכנס לחשבון הקיים.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f1117',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 360,
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 36,
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  title: { fontSize: 28, fontWeight: '900', color: '#f3f4f6', letterSpacing: -0.5 },
  sub: { fontSize: 15, color: '#4b5563', marginBottom: 16 },
  form: { width: '100%', gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', textAlign: 'right' },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#e5e7eb',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  btn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, color: '#374151', textAlign: 'center', marginTop: 4 },
})
