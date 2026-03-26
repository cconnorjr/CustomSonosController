import { apiClient } from './client'
import type { QueueItem } from '../store/types'

export const getQueue = (uid: string) =>
  apiClient.get<{ uid: string; items: QueueItem[]; total: number }>(`/speakers/${uid}/queue`)

export const addToQueue = (uid: string, uri: string, position?: number) =>
  apiClient.post(`/speakers/${uid}/queue`, { uri, position })

export const clearQueue = (uid: string) => apiClient.delete(`/speakers/${uid}/queue`)
