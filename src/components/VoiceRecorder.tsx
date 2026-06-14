import React from 'react'
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import type { VoiceMessage } from '../types/message'

interface Props {
  onVoice: (vm: VoiceMessage) => void
}

// Voice recording stubbed out for Expo Go compatibility
export function VoiceRecorder(_props: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} disabled>
        <Text style={styles.icon}>🎤</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  icon: { fontSize: 18 },
})
