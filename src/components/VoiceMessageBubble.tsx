import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet, Text, GestureResponderEvent } from 'react-native'
import { Audio } from 'expo-av'
import type { VoiceSegment } from '../types/message'
import { formatDur } from '../utils/time'

interface Props {
  uri: string
  duration: number
  waveform?: number[]
  segments?: VoiceSegment[]
  isOwn: boolean
}

function Waveform({
  waveform,
  progress,
  isOwn,
  segments,
  totalDuration,
  onSeek,
}: {
  waveform: number[]
  progress: number
  isOwn: boolean
  segments?: VoiceSegment[]
  totalDuration: number
  onSeek: (pct: number) => void
}) {
  const markers = segments && totalDuration > 0
    ? segments.slice(1).map((seg) => seg.startTime / totalDuration)
    : []

  const playedColor = isOwn ? 'rgba(255,255,255,0.92)' : '#3d7af5'
  const unplayedColor = isOwn ? 'rgba(255,255,255,0.22)' : 'rgba(100,100,120,0.4)'

  const handleTouch = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX
    const width = e.nativeEvent.target
    // We'll use layout width from state
    onSeek(Math.max(0, Math.min(1, x / containerWidth)))
  }

  const [containerWidth, setContainerWidth] = useState(1)

  return (
    <View
      style={styles.waveform}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        const x = e.nativeEvent.locationX
        onSeek(Math.max(0, Math.min(1, x / containerWidth)))
      }}
    >
      {waveform.map((amp, i) => {
        const played = i / waveform.length <= progress
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: Math.max(3, amp * 30),
                backgroundColor: played ? playedColor : unplayedColor,
              },
            ]}
          />
        )
      })}
      {markers.map((pct, i) => (
        <View
          key={i}
          style={[styles.marker, { left: `${pct * 100}%` as any }]}
        />
      ))}
    </View>
  )
}

export function VoiceMessageBubble({ uri, duration, waveform = [], segments, isOwn }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync()
    }
  }, [])

  const loadSound = useCallback(async () => {
    if (soundRef.current) return soundRef.current
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false },
      (status) => {
        if (!status.isLoaded) return
        const dur = status.durationMillis ?? duration * 1000
        setProgress(dur > 0 ? (status.positionMillis ?? 0) / dur : 0)
        setCurrentTime((status.positionMillis ?? 0) / 1000)
        if (status.didJustFinish) {
          setPlaying(false)
          setProgress(0)
          setCurrentTime(0)
        }
      }
    )
    soundRef.current = sound
    return sound
  }, [uri, duration])

  const togglePlay = useCallback(async () => {
    const sound = await loadSound()
    if (playing) {
      await sound.pauseAsync()
      setPlaying(false)
    } else {
      await sound.playAsync()
      setPlaying(true)
    }
  }, [playing, loadSound])

  const seekTo = useCallback(async (pct: number) => {
    const sound = await loadSound()
    const status = await sound.getStatusAsync()
    if (!status.isLoaded) return
    const dur = status.durationMillis ?? duration * 1000
    await sound.setPositionAsync(pct * dur)
    if (!playing) {
      await sound.playAsync()
      setPlaying(true)
    }
  }, [playing, loadSound, duration])

  const bars = waveform.length > 0
    ? waveform
    : Array.from({ length: 36 }, (_, i) => 0.25 + 0.5 * Math.sin(i * 0.55) * 0.6 + 0.2)

  const displayDur = duration > 0 ? formatDur(playing ? currentTime : duration) : '0:00'

  return (
    <View style={[styles.bubble, isOwn ? styles.own : styles.other]}>
      <TouchableOpacity
        style={[styles.playBtn, isOwn ? styles.playBtnOwn : styles.playBtnOther]}
        onPress={togglePlay}
        activeOpacity={0.75}
      >
        {playing ? (
          <View style={styles.pauseIcon}>
            <View style={styles.pauseBar} />
            <View style={styles.pauseBar} />
          </View>
        ) : (
          <View style={styles.playIcon} />
        )}
      </TouchableOpacity>

      <View style={styles.waveContainer}>
        <Waveform
          waveform={bars}
          progress={progress}
          isOwn={isOwn}
          segments={segments}
          totalDuration={duration}
          onSeek={seekTo}
        />
      </View>

      <Text style={[styles.dur, isOwn ? styles.durOwn : styles.durOther]}>
        {displayDur}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 200,
    maxWidth: 280,
  },
  own: {
    backgroundColor: '#1d4ed8',
    borderBottomRightRadius: 4,
  },
  other: {
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 4,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playBtnOwn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  playBtnOther: {
    backgroundColor: 'rgba(61,122,245,0.18)',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: 2,
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 3,
  },
  pauseBar: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  waveContainer: {
    flex: 1,
    minWidth: 0,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 2,
    position: 'relative',
  },
  bar: {
    width: 3,
    borderRadius: 3,
  },
  marker: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
  },
  dur: {
    fontSize: 11,
    flexShrink: 0,
    minWidth: 28,
    textAlign: 'right',
  },
  durOwn: {
    color: 'rgba(255,255,255,0.65)',
  },
  durOther: {
    color: '#888',
  },
})
