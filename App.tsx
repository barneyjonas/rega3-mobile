import React, { useState, useEffect, Component } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { LoginScreen } from './src/screens/LoginScreen'
import { ConversationListScreen } from './src/screens/ConversationListScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { NewChatScreen } from './src/screens/NewChatScreen'
import { useAuthStore } from './src/store/auth'
import { realtime } from './src/api'
import type { Conversation } from './src/types/conversation'

type Screen = 'list' | 'chat' | 'newchat'

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack } }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>App crashed</Text>
          <ScrollView>
            <Text style={eb.msg}>{this.state.error}</Text>
          </ScrollView>
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
  const [screen, setScreen] = useState<Screen>('list')
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)

  useEffect(() => {
    if (user) realtime.connect(user.id)
  }, [user?.id])

  if (!user) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onLoggedIn={() => setScreen('list')} />
      </>
    )
  }

  if (screen === 'chat' && activeConv) {
    return (
      <>
        <StatusBar style="light" />
        <ChatScreen conversation={activeConv} onBack={() => setScreen('list')} />
      </>
    )
  }

  if (screen === 'newchat') {
    return (
      <>
        <StatusBar style="light" />
        <NewChatScreen
          onSelect={(conv) => { setActiveConv(conv); setScreen('chat') }}
          onBack={() => setScreen('list')}
        />
      </>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <ConversationListScreen
        onSelect={(conv) => { setActiveConv(conv); setScreen('chat') }}
        onNewChat={() => setScreen('newchat')}
      />
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
