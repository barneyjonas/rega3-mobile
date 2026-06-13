import React, { useState, useRef, useCallback } from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native'
import { Audio } from 'expo-av'
import type { VoiceMessage } from '../types/message'
import { generateId } from '../utils/id'
import { formatDur } from '../utils/time'

interface Props {
  onVoice: (vm: VoiceMessage) => void
}

export function VoiceRecorder({ onVoice }: Props) {
  const recordingRef = useRef<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const pulseAnim = useRef(new Animated.Value(1)).current

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start()
  }

  const stopPulse = () => {
    pulseAnim.stopAnimation()
    pulseAnim.setValue(1)
  }

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      recordingRef.current = recording
      startTimeRef.current = Date.now()
      setIsRecording(true)
      setElapsed(0)
      startPulse()

      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (e) {
      console.error('Failed to start recording', e)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return
    try {
      if (timerRef.current) clearInterval(timerRef.current)
      stopPulse()

      await recordingRef.current.stopAndUnloadAsync()
      const uri = recordingRef.current.getURI()
      const status = await recordingRef.current.getStatusAsync()
      const durationMs = status.isRecording ? 0 : (status as any).durationMillis ?? elapsed * 1000
      const duration = durationMs / 1000 || elapsed

      recordingRef.current = null
      setIsRecording(false)
      setElapsed(0)

      if (!uri) return

      // Generate a simple fake waveform (real amplitude data needs native module)
      const waveformData = Array.from({ length: 40 }, () => 0.2 + Math.random() * 0.7)

      const vm: VoiceMessage = {
        id: generateId(),
        uri,
        duration: Math.max(0.5, duration),
        waveformData,
        recordedAt: Date.now(),
      }
      onVoice(vm)
    } catch (e) {
      console.error('Failed to stop recording', e)
      setIsRecording(false)
    }
  }, [elapsed, onVoice])

  return (
    <View style={styles.container}>
      {isRecording && (
        <Text style={styles.timer}>{formatDur(elapsed)}</Text>
      )}
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.btn,
            isRecording ? styles.btnRecording : styles.btnIdle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.icon}>{isRecording ? '⏹' : '🎤'}</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    fontSize: 13,
    color: '#ef4444',
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'center',
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIdle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnRecording: {
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
  icon: {
    fontSize: 18,
  },
})
