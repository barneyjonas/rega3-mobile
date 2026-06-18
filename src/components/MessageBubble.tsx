import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Message } from '../types/message'
import { formatTime } from '../utils/time'

const STATUS_ICON: Record<string, string> = {
  sending: '🕐',
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
}

export function MessageBubble({ message }: { message: Message }) {
  const isOwn = message.sender === 'me'

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
          {message.text}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Text style={[styles.status, message.status === 'read' ? styles.statusRead : styles.statusNormal]}>
              {STATUS_ICON[message.status] ?? ''}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  rowOwn: {
    alignItems: 'flex-end',
  },
  rowOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: '#1d4ed8',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOwn: {
    color: '#fff',
  },
  textOther: {
    color: '#e8e8e8',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  time: {
    fontSize: 10,
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.55)',
  },
  timeOther: {
    color: '#666',
  },
  status: {
    fontSize: 10,
  },
  statusRead: {
    color: '#60a5fa',
  },
  statusNormal: {
    color: 'rgba(255,255,255,0.55)',
  },
})
