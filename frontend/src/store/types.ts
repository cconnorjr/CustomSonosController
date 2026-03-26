export type PlaybackState = 'PLAYING' | 'PAUSED' | 'STOPPED' | 'TRANSITIONING' | 'UNKNOWN'

export interface TrackInfo {
  title: string
  artist: string
  album: string
  album_art_uri: string
  position: string
  duration: string
  uri: string
}

export interface SpeakerState {
  uid: string
  name: string
  ip_address: string
  is_coordinator: boolean
  group_uid: string | null
  group_members: string[]
  playback_state: PlaybackState
  volume: number
  is_muted: boolean
  now_playing: TrackInfo | null
  is_online: boolean
}

export interface GroupState {
  group_uid: string
  coordinator_uid: string
  coordinator_name: string
  member_uids: string[]
  member_names: string[]
}

export interface QueueItem {
  position: number
  title: string
  artist: string
  album: string
  duration: string
  uri: string
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
