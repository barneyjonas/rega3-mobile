export type MessageSender = 'me' | 'them'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'
export type MessageType = 'text' | 'voice'

export interface VoiceSegment {
  id: string
  startTime: number
  duration: number
  waveformData: number[]
}

export interface Message {
  id: string
  conversation_id: string
  text: string
  sender: MessageSender
  timestamp: number
  status: MessageStatus
  type: MessageType
  voiceUri?: string
  voiceDuration?: number
  voiceWaveform?: number[]
  voiceSegments?: VoiceSegment[]
}

export interface VoiceMessage {
  id: string
  uri: string
  duration: number
  waveformData: number[]
  recordedAt: number
}

export interface PendingMessage {
  id: string
  text: string
  type: MessageType
  timestamp: number
  voiceMessage?: VoiceMessage
}
