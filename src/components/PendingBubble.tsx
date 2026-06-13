import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import type { PendingMessage } from '../types/message'
import { formatDur } from '../utils/time'

export function PendingBubble({ message, endTime, totalMs }: {
  message: PendingMessage
  endTime: number | null
  totalMs: number
}) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!endTime) return
    const tick = () => {
      const remaining = endTime - Date.now()
      setPct(Math.max(0, Math.min(1, 1 - remaining / totalMs)))
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [endTime, totalMs])

  const isVoice = message.type === 'voice' && message.voiceMessage

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        {isVoice ? (
          <View style={styles.voicePreview}>
            <Text style={styles.mic}>🎤</Text>
            <Text style={styles.voiceDur}>{formatDur(message.voiceMessage!.duration)}</Text>
          </View>
        ) : (
          <Text style={styles.text}>{message.text}</Text>
        )}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    backgroundColor: 'rgba(29,78,216,0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(74,222,128,0.45)',
    borderStyle: 'dashed',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  text: {
    fontSize: 14,
    color: 'rgba(236,236,236,0.65)',
    lineHeight: 20,
  },
  voicePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mic: {
    fontSize: 16,
  },
  voiceDur: {
    fontSize: 13,
    color: 'rgba(236,236,236,0.65)',
  },
  progressBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 2,
  },
})
