import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { api, realtime } from '../api'
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
      realtime.connect(user.id)
      onLoggedIn()
    } catch {
      setError('לא ניתן להתחבר לשרת. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Text style={styles.title}>rega3</Text>
          <Text style={styles.sub}>הכנס שם כדי להתחיל</Text>

          <TextInput
            style={styles.input}
            placeholder="שם תצוגה (למשל: יואב)"
            placeholderTextColor="#555"
            value={displayName}
            onChangeText={setDisplayName}
            textAlign="right"
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="שם משתמש (למשל: yoav)"
            placeholderTextColor="#555"
            value={username}
            onChangeText={setUsername}
            textAlign="right"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>כניסה</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            אם יש לך כבר חשבון עם שם המשתמש הזה, תיכנס אוטומטית.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  title: { fontSize: 48, fontWeight: '900', color: '#1d4ed8', letterSpacing: -1 },
  sub: { fontSize: 16, color: '#888', marginBottom: 8 },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  error: { color: '#f87171', fontSize: 14 },
  btn: {
    width: '100%',
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 12, color: '#444', textAlign: 'center', marginTop: 8 },
})
