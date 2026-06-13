import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export function DebouncePill({ endTime, totalMs, onCancel, onSendNow }: {
  endTime: number
  totalMs: number
  onCancel: () => void
  onSendNow: () => void
}) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endTime - Date.now()))
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [endTime])

  const secs = Math.ceil(remaining / 1000)

  return (
    <View style={styles.pill}>
      <Text style={styles.label}>שולח בעוד {secs}ש׳</Text>
      <TouchableOpacity onPress={onSendNow} style={styles.btn}>
        <Text style={styles.btnText}>שלח עכשיו</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} style={[styles.btn, styles.cancelBtn]}>
        <Text style={styles.cancelText}>בטל</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(29,78,216,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,78,216,0.2)',
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: '#93c5fd',
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(29,78,216,0.35)',
  },
  cancelBtn: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  btnText: {
    fontSize: 12,
    color: '#93c5fd',
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '600',
  },
})
