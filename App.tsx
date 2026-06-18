import React, { useState, useEffect, Component } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LoginScreen } from './src/screens/LoginScreen'
import { ConversationListScreen } from './src/screens/ConversationListScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { NewChatScreen } from './src/screens/NewChatScreen'
import { useAuthStore } from './src/store/auth'
import { realtime } from './src/api'
import type { Conversation } from './src/types/conversation'

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack } }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.c}>
          <Text style={eb.t}>שגיאה</Text>
          <ScrollView><Text style={eb.m}>{this.state.error}</Text></ScrollView>
        </View>
      )
    }
    return this.props.children
  }
}

const eb = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  t: { color: '#f87171', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  m: { color: '#ccc', fontSize: 12, fontFamily: 'monospace' },
})

type Screen =
  | { name: 'list' }
  | { name: 'chat'; conversation: Conversation }
  | { name: 'new-chat' }

function AppInner() {
  const user = useAuthStore((s) => s.user)
  const [screen, setScreen] = useState<Screen>({ name: 'list' })

  useEffect(() => {
    if (user) realtime.connect(user.id)
    else realtime.disconnect()
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
      {screen.name === 'list' && (
        <ConversationListScreen
          onSelect={(conv) => setScreen({ name: 'chat', conversation: conv })}
          onNewChat={() => setScreen({ name: 'new-chat' })}
        />
      )}
      {screen.name === 'chat' && (
        <ChatScreen
          conversation={(screen as Extract<Screen, { name: 'chat' }>).conversation}
          onBack={() => setScreen({ name: 'list' })}
        />
      )}
      {screen.name === 'new-chat' && (
        <NewChatScreen
          onSelect={(conv) => setScreen({ name: 'chat', conversation: conv })}
          onBack={() => setScreen({ name: 'list' })}
        />
      )}
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
