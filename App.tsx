import React, { useState, useEffect, Component } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LoginScreen } from './src/screens/LoginScreen'
import { Sidebar } from './src/screens/Sidebar'
import { ChatPanel } from './src/screens/ChatPanel'
import { useAuthStore } from './src/store/auth'
import { realtime } from './src/api'
import type { Conversation } from './src/types/conversation'

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack } }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>App crashed</Text>
          <ScrollView><Text style={eb.msg}>{this.state.error}</Text></ScrollView>
        </View>
      )
    }
    return this.props.children
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  title: { color: '#f87171', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  msg: { color: '#ccc', fontSize: 12, fontFamily: 'monospace' },
})

function AppInner() {
  const user = useAuthStore((s) => s.user)
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)

  useEffect(() => {
    if (user) realtime.connect(user.id)
  }, [user?.id])

  if (!user) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onLoggedIn={() => {}} />
      </>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.root}>
        <Sidebar activeConvId={activeConv?.id ?? null} onSelect={setActiveConv} />
        <ChatPanel conversation={activeConv} />
      </View>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0f1117',
  },
})
