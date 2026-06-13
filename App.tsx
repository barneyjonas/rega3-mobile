import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { LoginScreen } from './src/screens/LoginScreen'
import { ConversationListScreen } from './src/screens/ConversationListScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { NewChatScreen } from './src/screens/NewChatScreen'
import { useAuthStore } from './src/store/auth'
import type { Conversation } from './src/types/conversation'

type Screen = 'list' | 'chat' | 'newchat'

export default function App() {
  const user = useAuthStore((s) => s.user)
  const [screen, setScreen] = useState<Screen>('list')
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)

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
