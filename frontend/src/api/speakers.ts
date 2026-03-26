import { apiClient } from './client'
import type { SpeakerState } from '../store/types'

export const getSpeakers = () => apiClient.get<SpeakerState[]>('/speakers')

export const getSpeaker = (uid: string) => apiClient.get<SpeakerState>(`/speakers/${uid}`)

export const discoverSpeakers = () => apiClient.post<string[]>('/speakers/discover')
