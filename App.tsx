import React, { useState, useEffect, Component } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LoginScreen } from './src/screens/LoginScreen'
import { Sidebar } from './src/screens/Sidebar'
import { ChatPanel } from './src/screens/ChatPanel'
import { useAuthStore } from './src/store/auth'
import { useMessagesStore } from './src/store/messages'
import { useConversationsStore } from './src/store/conversations'
import { realtime } from './src/api'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from './src/data/mockData'
import type { Conversation } from './src/types/conversation'
import type { AppTab } from './src/types/navigation'

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

function AppInner() {
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<AppTab>('chats')
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const { setMessages } = useMessagesStore()
  const { setConversations } = useConversationsStore()

  useEffect(() => {
    setConversations(MOCK_CONVERSATIONS)
    Object.entries(MOCK_MESSAGES).forEach(([convId, msgs]) => setMessages(convId, msgs))
  }, [])

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

  const renderMain = () => {
    if (activeTab === 'calls') {
      return (
        <View style={placeholder.root}>
          <Text style={placeholder.icon}>📞</Text>
          <Text style={placeholder.title}>שיחות — בקרוב</Text>
        </View>
      )
    }
    if (activeTab === 'settings') {
      return (
        <View style={placeholder.root}>
          <Text style={placeholder.icon}>⚙️</Text>
          <Text style={placeholder.title}>הגדרות — בקרוב</Text>
        </View>
      )
    }
    return <ChatPanel conversation={activeConv} />
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.main}>{renderMain()}</View>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeConvId={activeConv?.id ?? null}
          onSelectConv={(conv) => { setActiveConv(conv); setActiveTab('chats') }}
        />
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
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#0d1117' },
  main: { flex: 1 },
})

const placeholder = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117', gap: 12 },
  icon: { fontSize: 48 },
  title: { fontSize: 18, color: '#374151', fontWeight: '600' },
})
