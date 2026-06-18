import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Message } from '../types/message'
import { formatTime } from '../utils/time'

const STATUS_ICON: Record<string, string> = {
  sending: '○',
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
}

interface Props {
  message: Message
  isFirst?: boolean
  isLast?: boolean
}

export function MessageBubble({ message, isFirst = true, isLast = true }: Props) {
  const isOwn = message.sender === 'me'

  return (
    <View style={[
      styles.row,
      isOwn ? styles.rowOwn : styles.rowOther,
      !isLast && styles.rowGrouped,
    ]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.bubbleOwn : styles.bubbleOther,
        isOwn
          ? { borderBottomRightRadius: isLast ? 4 : 18 }
          : { borderBottomLeftRadius: isLast ? 4 : 18 },
        isOwn
          ? { borderTopRightRadius: isFirst ? 18 : 6 }
          : { borderTopLeftRadius: isFirst ? 18 : 6 },
      ]}>
        <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
          {message.text}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Text style={[
              styles.status,
              message.status === 'read' ? styles.statusRead : styles.statusNormal,
            ]}>
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
    paddingHorizontal: 0,
    paddingVertical: 1,
  },
  rowGrouped: {
    paddingVertical: 0.5,
  },
  rowOwn: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '65%',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: '#1d4ed8',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#1e2533',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textOwn: { color: '#f0f4ff' },
  textOther: { color: '#e2e8f0' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  time: { fontSize: 10 },
  timeOwn: { color: 'rgba(255,255,255,0.45)' },
  timeOther: { color: '#4b5563' },
  status: { fontSize: 10 },
  statusRead: { color: '#60a5fa' },
  statusNormal: { color: 'rgba(255,255,255,0.4)' },
})
